// src/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;

// Validate required environment variable
if (!ACCESS_SECRET) {
    console.error('❌ FATAL: ACCESS_SECRET must be set in grievance-service .env');
    console.error('   Copy the same ACCESS_SECRET from auth-service');
    process.exit(1);
}

console.log('✅ Grievance Service: JWT middleware configured');

// Main authentication middleware - verifies JWT locally
export const verifyToken = async (req, res, next) => {
    let token = null;
    
    // Try to get token from cookie
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    
    // Try Authorization header as fallback
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        // Verify JWT locally - NO CALL TO AUTH SERVICE!
        const decoded = jwt.verify(token, ACCESS_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', expired: true });
        }
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Role-based authorization middleware
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: `Access denied. Required role: ${roles.join(' or ')}`,
                your_role: req.user.role
            });
        }
        
        next();
    };
};