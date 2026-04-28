import axios from 'axios';

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Main authentication middleware for API Gateway
export const authenticateGateway = async (req, res, next) => {
    // Skip authentication for public routes
    const publicRoutes = ['/api/auth/login', '/api/auth/signup', '/health'];
    
    if (publicRoutes.some(route => req.originalUrl.startsWith(route))) {
        return next();
    }
    
    try {
        const cookies = req.headers.cookie || '';
        
        if (!cookies) {
            console.log('❌ No cookies provided');
            return res.status(401).json({ error: 'Authentication required' });
        }
        
        // Verify token with Auth Service
        const authResponse = await axios({
            method: 'GET',
            url: `${AUTH_SERVICE_URL}/api/auth/verify`,
            headers: { 
                'Cookie': cookies,
                'Content-Type': 'application/json'
            },
            withCredentials: true,
            timeout: 5000
        });
        
        if (authResponse.data && authResponse.data.valid) {
            req.user = authResponse.data.user;
            console.log(`✅ User authenticated: ${req.user.email} (${req.user.role})`);
            
            // Add user info to headers for downstream services
            req.headers['x-user'] = JSON.stringify(req.user);
            req.headers['x-user-id'] = req.user.id;
            req.headers['x-user-role'] = req.user.role;
            req.headers['x-user-email'] = req.user.email;
            
            next();
        } else {
            console.log('❌ Invalid token');
            res.status(401).json({ error: 'Invalid or expired token' });
        }
        
    } catch (error) {
        console.error('❌ Authentication error:', error.message);
        
        if (error.response?.status === 401) {
            res.status(401).json({ error: 'Authentication required' });
        } else {
            res.status(500).json({ error: 'Auth service unavailable' });
        }
    }
};

// Optional: Role-based authorization middleware
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