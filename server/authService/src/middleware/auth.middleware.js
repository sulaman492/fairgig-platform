import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET || 'access-secret-key';

// For API Gateway to verify tokens (returns JSON response)
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

// For protecting routes (calls next())
export const authenticateToken = async (req, res, next) => {
    const accessToken = req.cookies.accessToken;
    
    console.log('🔐 authenticateToken middleware');
    console.log('   Has token:', !!accessToken);
    
    if (!accessToken) {
        console.log('❌ No token found');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        const decoded = jwt.verify(accessToken, ACCESS_SECRET);
        req.user = decoded;
        console.log('✅ User authenticated:', decoded.email);
        next();
    } catch (error) {
        console.error('❌ Token invalid:', error.message);
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Role-based authorization
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