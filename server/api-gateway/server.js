import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import multer from 'multer';
import { authenticateGateway, requireRole } from './middlewares/auth.middleware.js';

const upload = multer({ storage: multer.memoryStorage() });
dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

// ============================================
// CORS CONFIGURATION - READ FROM ENV VARIABLE
// ============================================
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

console.log(`🔧 CORS allowed origin: ${FRONTEND_URL}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);

app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const EARNINGS_SERVICE_URL = process.env.EARNINGS_SERVICE_URL || 'http://localhost:3002';
const ANOMALY_SERVICE_URL = process.env.ANOMALY_SERVICE_URL || 'http://localhost:3003';
const GRIEVANCE_SERVICE_URL = process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3004';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005';
const CERTIFICATE_SERVICE_URL = process.env.CERTIFICATE_SERVICE_URL || 'http://localhost:3006';

// ============================================
// PUBLIC ROUTES (No Authentication)
// ============================================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        services: {
            auth: AUTH_SERVICE_URL,
            earnings: EARNINGS_SERVICE_URL,
            anomaly: ANOMALY_SERVICE_URL,
            grievance: GRIEVANCE_SERVICE_URL,
            analytics: ANALYTICS_SERVICE_URL,
            certificate: CERTIFICATE_SERVICE_URL
        }
    });
});

// Login - Public
// Login - Public
app.post('/api/auth/login', async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/login`;
        const response = await axios({
            method: 'POST',
            url: url,
            data: req.body,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true  // Add this
        });
        
        // Forward all cookies, not just the first one
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
            // Handle both single cookie and array of cookies
            const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            cookies.forEach(cookie => {
                res.append('Set-Cookie', cookie);
            });
            console.log(`✅ Forwarded ${cookies.length} cookie(s)`);
        } else {
            console.log('❌ No Set-Cookie headers from Auth Service');
        }
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Login failed' });
    }
});

// Signup - Public
// Signup - Public
app.post('/api/auth/signup', async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/signup`;
        const response = await axios({
            method: 'POST',
            url: url,
            data: req.body,
            headers: { 'Content-Type': 'application/json' },
            withCredentials: true  // Add this
        });
        
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
            const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
            cookies.forEach(cookie => {
                res.append('Set-Cookie', cookie);
            });
        }
        
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Signup failed' });
    }
});

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================

// Get current user - Protected
app.get('/api/auth/me', authenticateGateway, async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/me`;
        const response = await axios({
            method: 'GET',
            url: url,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 401).json({ error: 'Authentication required' });
    }
});

// Get user profile - Protected
app.get('/api/auth/profile', authenticateGateway, async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/profile`;
        const response = await axios({
            method: 'GET',
            url: url,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Profile error' });
    }
});

// Profile picture upload - Protected
app.post('/api/auth/profile-picture', authenticateGateway, upload.single('avatar'), async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/profile-picture`;
        
        const FormData = (await import('form-data')).default;
        const formData = new FormData();
        formData.append('avatar', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });
        
        const response = await axios({
            method: 'POST',
            url: url,
            data: formData,
            headers: {
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user'],
                ...formData.getHeaders()
            }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Upload failed' });
    }
});

// Delete profile picture - Protected
app.delete('/api/auth/profile-picture', authenticateGateway, async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/profile-picture`;
        const response = await axios({
            method: 'DELETE',
            url: url,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Delete failed' });
    }
});

// Logout - Protected
app.post('/api/auth/logout', authenticateGateway, async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}/api/auth/logout`;
        const response = await axios({
            method: 'POST',
            url: url,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        
        if (response.headers['set-cookie']) {
            res.setHeader('Set-Cookie', response.headers['set-cookie']);
        }
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Logout failed' });
    }
});

// Anomaly detection - Worker only
app.get('/api/shifts/anomalies', authenticateGateway, requireRole(['worker']), async (req, res) => {
    try {
        const earningsUrl = `${EARNINGS_SERVICE_URL}/api/shifts/my`;
        const shiftsResponse = await axios({
            method: 'GET',
            url: earningsUrl,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        
        const shifts = shiftsResponse.data.shifts || [];
        
        if (shifts.length === 0) {
            return res.json({ anomalies: [], summary: "No shifts to analyze", has_anomalies: false });
        }
        
        const earningsData = shifts.map(shift => ({
            date: shift.shift_date.split('T')[0],
            amount: parseFloat(shift.net_received),
            hours_worked: parseFloat(shift.hours_worked),
            platform: shift.platform
        }));
        
        const anomalyResponse = await axios({
            method: 'POST',
            url: `${ANOMALY_SERVICE_URL}/api/detect-anomalies`,
            data: { user_id: req.user.id, earnings: earningsData },
            headers: { 'Content-Type': 'application/json' }
        });
        
        res.json(anomalyResponse.data);
    } catch (error) {
        res.status(500).json({ anomalies: [], summary: 'Anomaly service error', has_anomalies: false });
    }
});

// Earnings routes - Protected
app.use('/api/shifts', authenticateGateway, async (req, res) => {
    try {
        const url = `${EARNINGS_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user'],
                'x-user-id': req.headers['x-user-id'],
                'x-user-role': req.headers['x-user-role']
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Earnings service error' });
    }
});

// Grievance routes - Protected
app.use('/api/complaints', authenticateGateway, async (req, res) => {
    try {
        const url = `${GRIEVANCE_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Grievance service error' });
    }
});

// Certificate routes - Protected
app.use('/api/certificate', authenticateGateway, async (req, res) => {
    try {
        const url = `${CERTIFICATE_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 
                'Cookie': req.headers.cookie || '',
                'x-user': req.headers['x-user']
            },
            responseType: 'text'
        });
        res.setHeader('Content-Type', 'text/html');
        res.send(response.data);
    } catch (error) {
        res.status(500).json({ error: 'Certificate service error' });
    }
});

// Analytics routes - Advocate only
app.use('/api/analytics', authenticateGateway, requireRole(['advocate']), async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({ error: 'Analytics service error' });
    }
});

// Direct anomaly proxy - Worker or Advocate
app.use('/api/anomaly', authenticateGateway, requireRole(['worker', 'advocate']), async (req, res) => {
    try {
        const path = req.originalUrl.replace('/api/anomaly', '/api');
        const url = `${ANOMALY_SERVICE_URL}${path}`;
        
        let token = req.cookies?.accessToken;
        
        if (!token && req.headers.authorization) {
            const authHeader = req.headers.authorization;
            if (authHeader.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }
        
        const authHeaderValue = token ? `Bearer ${token}` : '';
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeaderValue,
                'Cookie': req.headers.cookie || ''
            }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Anomaly proxy error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Anomaly service error' });
    }
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
    console.log(`   Auth: ${AUTH_SERVICE_URL}`);
    console.log(`   Earnings: ${EARNINGS_SERVICE_URL}`);
    console.log(`   Anomaly: ${ANOMALY_SERVICE_URL}`);
    console.log(`   Grievance: ${GRIEVANCE_SERVICE_URL}`);
    console.log(`   Analytics: ${ANALYTICS_SERVICE_URL}`);
    console.log(`   Certificate: ${CERTIFICATE_SERVICE_URL}`);
});