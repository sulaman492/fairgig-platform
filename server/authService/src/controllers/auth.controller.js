import User from '../models/auth.model.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';

dotenv.config();

// ⚠️ CRITICAL: No fallbacks! Must be set in .env
const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY;
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY;

// Validate required environment variables
if (!ACCESS_SECRET || !REFRESH_SECRET) {
    console.error('❌ FATAL: ACCESS_SECRET and REFRESH_SECRET must be set in .env file');
    process.exit(1);
}

if (!ACCESS_TOKEN_EXPIRY || !REFRESH_TOKEN_EXPIRY) {
    console.error('❌ FATAL: Token expiry values must be set in .env file');
    process.exit(1);
}

console.log('✅ JWT Configuration loaded successfully');
console.log(`   Access Token Expiry: ${ACCESS_TOKEN_EXPIRY}`);
console.log(`   Refresh Token Expiry: ${REFRESH_TOKEN_EXPIRY}`);

// Generate both tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        ACCESS_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id, email: user.email },
        REFRESH_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
    
    return { accessToken, refreshToken };
};

// Helper function to set cookies - FIXED DOMAIN
const setTokenCookies = (res, accessToken, refreshToken) => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // For Render.com, use .onrender.com domain
    // For localhost, don't set domain (undefined)
    let cookieDomain = undefined;
    if (isProduction) {
        cookieDomain = '.onrender.com';
    }
    
    console.log(`🍪 Setting cookies - Production: ${isProduction}, Domain: ${cookieDomain || 'none'}`);
    
    // Access token cookie - 15 minutes
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: cookieDomain,
        maxAge: 15 * 60 * 1000,
        path: '/'
    });
    
    // Refresh token cookie - 7 days
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        domain: cookieDomain,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};

export const signUp = async (req, res) => {
    const { email, password, fullName, role } = req.body;
    
    if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Email, password, and full name are required' });
    }
    
    try {
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        const newUser = await User.signUp({ email, password, fullName, role });
        const { accessToken, refreshToken } = generateTokens(newUser);
        
        await User.storeRefreshToken(newUser.id, refreshToken);
        setTokenCookies(res, accessToken, refreshToken);
        
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
        
        const { accessToken, refreshToken } = generateTokens(user);
        await User.storeRefreshToken(user.id, refreshToken);
        setTokenCookies(res, accessToken, refreshToken);
        
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

// Get current user using req.user from middleware
export const getMe = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        res.status(200).json({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            city: user.city,
            created_at: user.created_at
        });
        
    } catch (error) {
        console.error('GetMe error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Refresh access token - FIXED DOMAIN
export const refreshAccessToken = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
    }
    
    try {
        const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        const isValid = await User.verifyRefreshToken(decoded.id, refreshToken);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid or revoked refresh token' });
        }
        
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        
        // Generate NEW access token only
        const newAccessToken = jwt.sign(
            { id: user.id, email: user.email, name: user.name, role: user.role },
            ACCESS_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRY }
        );
        
        // Use same cookie settings
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = isProduction ? '.onrender.com' : undefined;
        
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            domain: cookieDomain,
            maxAge: 15 * 60 * 1000,
            path: '/'
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

// Logout - FIXED DOMAIN
export const logout = async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    
    if (refreshToken) {
        await User.revokeRefreshToken(refreshToken);
    }
    
    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = isProduction ? '.onrender.com' : undefined;
    
    res.clearCookie('accessToken', { domain: cookieDomain, path: '/' });
    res.clearCookie('refreshToken', { domain: cookieDomain, path: '/' });
    
    res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

// Helper to extract public_id from Cloudinary URL
const extractPublicId = (url) => {
    if (!url) return null;
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.\w+$/);
    return match ? match[1] : null;
};

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