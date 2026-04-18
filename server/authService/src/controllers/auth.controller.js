// src/controllers/authController.js
import User from '../models/auth.model.js';

export const signUp = async (req, res) => {
    const { email, password, fullName, role } = req.body;
    
    // Validations
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
        // Check if user exists
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already exists' });
        }
        
        // Create user
        const newUser = await User.signUp({ email, password, fullName, role });
        
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