// server/certificateService/middleware/auth.middleware.js
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_SECRET;

// For local development, provide a helpful error message
if (!ACCESS_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('❌ FATAL: ACCESS_SECRET must be set in production');
        process.exit(1);
    } else {
        console.warn('⚠️  WARNING: ACCESS_SECRET not set. Using development secret!');
        console.warn('   Set ACCESS_SECRET in .env file for proper security');
        // Use a temporary secret for local development only
        const tempSecret = 'dev-secret-do-not-use-in-production';
        // Don't exit, just warn
    }
}

console.log('✅ Certificate Service: JWT middleware configured');

export const authenticate = async (req, res, next) => {
    let token = null;
    
    // Try Authorization header first
    if (req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }
    
    // Try cookie as fallback
    if (!token && req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Use the secret (with fallback for development only)
    const secret = ACCESS_SECRET || 'dev-secret-do-not-use-in-production';
    
    try {
        const decoded = jwt.verify(token, secret);
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