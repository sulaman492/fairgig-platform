import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';
import { log } from 'console';

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
        
        // Return user info (exclude sensitive data)
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            city: user.city,
            created_at: user.created_at
        });
        
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Access token expired', expired: true });
        }
        console.error('GetMe error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Helper to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;
    // Example URL: https://res.cloudinary.com/cloud-name/image/upload/v123456/fairgig/profiles/avatar-123.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
};

// Upload profile picture to Cloudinary
// Upload profile picture to Cloudinary
export const uploadProfilePicture = async (req, res) => {
    console.log('📸 Auth Service: uploadProfilePicture START');
    console.log("controller hit")
    console.log('req.file:', req.file);
    console.log('req.body:', req.body);
    console.log('req.user:', req.user);
    
    try {
        if (!req.file) {
            console.log('❌ No file in request - req.file is undefined');
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('✅ File received:', req.file.originalname);
        console.log('📁 Local file path:', req.file.path);
        console.log('📏 File size:', req.file.size);
        console.log('📝 File mimetype:', req.file.mimetype);

        const userId = req.user.id;
        console.log('👤 User ID:', userId);
        
        // Get current user to delete old image from Cloudinary
        const currentUser = await User.findByIdWithAvatar(userId);
        
        // Delete old profile picture from Cloudinary if exists
        if (currentUser.profile_picture) {
            const oldPublicId = extractPublicId(currentUser.profile_picture);
            if (oldPublicId) {
                try {
                    await cloudinary.uploader.destroy(oldPublicId);
                    console.log(`🗑️ Deleted old Cloudinary image: ${oldPublicId}`);
                } catch (err) {
                    console.error('Failed to delete old Cloudinary image:', err.message);
                }
            }
        }
        
        // Upload to Cloudinary
        console.log('☁️ Uploading to Cloudinary...');
        const cloudinaryResult = await cloudinary.uploader.upload(req.file.path, {
            folder: 'fairgig/profiles',
            transformation: [{ width: 300, height: 300, crop: 'fill' }]
        });
        
        console.log('✅ Cloudinary upload successful:', cloudinaryResult.secure_url);
        
        // Delete local file after successful Cloudinary upload
        try {
            fs.unlinkSync(req.file.path);
            console.log('🗑️ Deleted local file:', req.file.path);
        } catch (err) {
            console.error('Failed to delete local file:', err.message);
        }
        
        const imageUrl = cloudinaryResult.secure_url;
        console.log('📷 Final Image URL:', imageUrl);

        // Update database
        const updatedUser = await User.updateProfilePicture(userId, imageUrl);
        
        console.log('💾 Database updated:', updatedUser);

        res.json({
            success: true,
            message: 'Profile picture updated successfully',
            profile_picture: updatedUser.profile_picture
        });
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        
        // Clean up local file if upload failed
        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
                console.log('🗑️ Cleaned up local file after error:', req.file.path);
            } catch (err) {
                console.error('Failed to delete local file after error:', err.message);
            }
        }
        
        res.status(500).json({ error: 'Failed to upload profile picture', details: error.message });
    }
};
// Delete profile picture from Cloudinary
// Delete profile picture from Cloudinary
export const deleteProfilePicture = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get current user
        const user = await User.findByIdWithAvatar(userId);
        
        if (user.profile_picture) {
            const publicId = extractPublicId(user.profile_picture);
            if (publicId) {
                // Delete from Cloudinary only (no local file to delete)
                await cloudinary.uploader.destroy(publicId);
                console.log(`🗑️ Deleted Cloudinary profile picture: ${publicId}`);
            }
        }
        
        // Update database
        await User.deleteProfilePicture(userId);
        
        res.json({
            success: true,
            message: 'Profile picture removed successfully'
        });
    } catch (error) {
        console.error('Delete profile picture error:', error);
        res.status(500).json({ error: 'Failed to delete profile picture' });
    }
};

// Get user profile with avatar
export const getProfile = async (req, res) => {
    try {
        const user = await User.findByIdWithAvatar(req.user.id);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
