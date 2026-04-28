import express from 'express';
import { 
    signUp, 
    login,
    getMe, 
    refreshAccessToken,
    logout,
    uploadProfilePicture,
    deleteProfilePicture,
    getProfile
} from '../controllers/auth.controller.js';
import { upload } from '../middleware/upload.middleware.js';
import { verifyToken, authenticateToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No authentication needed)
// ============================================
router.post('/signup', signUp);
router.post('/login', login);
router.get('/verify', verifyToken);  // For API Gateway to verify tokens

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// Get current user info
router.get('/me', authenticateToken, getMe);

// Get user profile (with avatar)
router.get('/profile', authenticateToken, getProfile);

// Refresh access token
router.post('/refresh', refreshAccessToken);

// Logout
router.post('/logout', authenticateToken, logout);

// ============================================
// PROFILE PICTURE ROUTES
// ============================================

// Upload profile picture
router.post('/profile-picture', 
    authenticateToken,           // 1. Verify user first (gets req.user)
    upload.single('avatar'),     // 2. Parse the file (needs req.user for filename)
    (req, res, next) => {
        console.log('🎯 After upload middleware');
        console.log('req.file:', req.file);
        console.log('req.user:', req.user);
        console.log("Route hit, forwarding to controller");
        next();
    },
    uploadProfilePicture          // 3. Save to database
);

// Delete profile picture
router.delete('/profile-picture', authenticateToken, deleteProfilePicture);

export default router;