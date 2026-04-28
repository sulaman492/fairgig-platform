import axios from 'axios';
import dotenv from 'dotenv';


dotenv.config();
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL  ;

// Verify token with Auth Service
export const verifyToken = async (req, res, next) => {
    try {
        // Get cookies from request
        const cookies = req.headers.cookie || '';
        
        // Call Auth Service to verify token
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
            headers: {
                Cookie: cookies
            },
            withCredentials: true
        });

        if (response.data.valid) {
            req.user = response.data.user;
            next();
        } else {
            res.status(401).json({ error: 'Invalid or expired token' });
        }
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Authentication required' });
        } else {
            res.status(500).json({ error: 'Auth service unavailable' });
        }
    }
};

// Check if user has required role
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

// Optional: Get user from token without failing
export const optionalAuth = async (req, res, next) => {
    try {
        const cookies = req.headers.cookie || '';
        
        const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/verify`, {
            headers: { Cookie: cookies },
            withCredentials: true
        });

        if (response.data.valid) {
            req.user = response.data.user;
        }
        next();
    } catch (error) {
        // Continue without user
        next();
    }
};
const testAuthConnection = async () => {
    try {
        console.log(`📡 Testing connection to Auth Service: ${AUTH_SERVICE_URL}`);
        const response = await axios.get(`${AUTH_SERVICE_URL}/health`, {
            timeout: 5000
        });
        console.log(`✅ Auth Service health check:`, response.data);
        return true;
    } catch (error) {
        console.error(`❌ Cannot reach Auth Service: ${error.message}`);
        return false;
    }
};

// Call it when the middleware loads
testAuthConnection();