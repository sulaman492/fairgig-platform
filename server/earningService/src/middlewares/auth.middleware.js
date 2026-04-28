import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const ACCESS_SECRET = process.env.ACCESS_SECRET;

// Validate required environment variable
if (!ACCESS_SECRET) {
    console.error('❌ FATAL: ACCESS_SECRET must be set in earnings-service .env');
    console.error('   Copy the same ACCESS_SECRET from auth-service to earnings-service');
    process.exit(1);
}

console.log('✅ Earnings Service: JWT middleware configured');

// Middleware to authenticate requests independently
export const authenticate = async (req, res, next) => {
    console.log('🔐 Earnings Service: Authenticating request');
    
    // Try to get token from cookie or Authorization header
    let token = null;
    
    // Check cookie first
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
        console.log('   Token from cookie');
    }
    
    // Check Authorization header as fallback
    if (!token && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
            console.log('   Token from Authorization header');
        }
    }
    
    if (!token) {
        console.log('❌ No token found');
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        // Verify JWT locally (NO network call to Auth Service!)
        const decoded = jwt.verify(token, ACCESS_SECRET);
        
        req.user = decoded;
        console.log(`✅ User authenticated: ${decoded.email} (${decoded.role})`);
        
        next();
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired', expired: true });
        }
        
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Optional: Role-based authorization
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