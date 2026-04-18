import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret-key';

// Generate both tokens
const generateTokens = (user) => {
    // Access token - short lived (15 minutes)
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        ACCESS_SECRET,
        { expiresIn: '15m' }
    );
    
    // Refresh token - long lived (7 days)
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        REFRESH_SECRET,
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

export const signUp = async (req, res) => {
    const { email, password, fullName, role } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const validRoles = ['worker', 'verifier', 'advocate'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be worker, verifier, or advocate' });
    }
    
    try {
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        const newUser = await User.signUp({ email, password, fullName, role });
        
        // Generate both tokens
        const { accessToken, refreshToken } = generateTokens(newUser);
        
        // Store refresh token in database
        await User.storeRefreshToken(newUser.id, refreshToken);
        
        // Set access token as HTTP-only cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000  // 15 minutes
        });
        
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });
        
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    
    try {
        const user = await User.login({ email, password });
        
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Generate both tokens
        const { accessToken, refreshToken } = generateTokens(user);
        
        // Store refresh token in database
        await User.storeRefreshToken(user.id, refreshToken);
        
        // Set access token cookie
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000  // 15 minutes
        });
        
        // Set refresh token cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000  // 7 days
        });
        
        res.status(200).json({
            success: true,
            message: 'Login successful',
            user
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }
    
    try {
        // Verify refresh token
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        
        // Check if refresh token exists in database (not revoked)
        const isValid = await User.verifyRefreshToken(decoded.id, refreshToken);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or revoked refresh token' });
        }
        
        // Get user
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Generate new access token
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            ACCESS_SECRET,
            { expiresIn: '15m' }
        );
        
        // Set new access token cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        
        res.status(200).json({
            success: true,
            message: 'Access token refreshed'
        });
        
    } catch (error) {
        console.error('Refresh error:', error);
        res.status(401).json({ error: 'Invalid refresh token' });
    }
};

// Logout - clear both tokens
export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
        // Revoke refresh token in database
        await User.revokeRefreshToken(refreshToken);
    }
    
    res.clearCookie('accessToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Get current user from access token
export const getMe = async (req, res) => {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        res.status(200).json({ user });
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Access token expired', expired: true });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Verify token middleware for other services
export const verifyToken = async (req, res) => {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
        return res.status(401).json({ valid: false, error: 'No token provided' });
    }
    
    try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        res.json({ valid: true, user: decoded });
    } catch (error) {
        res.status(401).json({ valid: false, error: error.message });
    }
};