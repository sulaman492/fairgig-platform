import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const EARNINGS_SERVICE_URL = process.env.EARNINGS_SERVICE_URL || 'http://localhost:3002';
const ANOMALY_SERVICE_URL = process.env.ANOMALY_SERVICE_URL || 'http://localhost:3003';  // ← MOVE HERE

// ✅ Forward Auth requests
app.use('/api/auth', async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 'Cookie': req.headers.cookie || '' },
            withCredentials: true
        });
        
        if (response.headers['set-cookie']) {
            res.setHeader('Set-Cookie', response.headers['set-cookie']);
        }
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Auth service error' });
    }
});

// Forward Earnings requests
app.use('/api/shifts', async (req, res) => {
    try {
        const url = `${EARNINGS_SERVICE_URL}${req.originalUrl}`;
        console.log(`🔄 Forwarding to: ${url}`);
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 'Cookie': req.headers.cookie || '' },
            withCredentials: true
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Earnings proxy error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Earnings service error' });
    }
});

// Forward Analytics requests
app.use('/api/analytics', async (req, res) => {
    try {
        const url = `${EARNINGS_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Analytics service error' });
    }
});

// ✅ Forward Anomaly requests (ADD THIS)
// Forward Anomaly requests
app.use('/api/anomaly', async (req, res) => {
    try {
        // ✅ Remove '/api/anomaly' prefix, keep '/api/detect-anomalies'
        const path = req.originalUrl.replace('/api/anomaly', '/api');
        const url = `${ANOMALY_SERVICE_URL}${path}`;
        
        console.log('🔄 Forwarding anomaly to:', url);
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Anomaly proxy error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Anomaly service error' });
    }
});

// Add this with other service URLs
const GRIEVANCE_SERVICE_URL = process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3004';

// Add this before the health check
// Forward Grievance requests
app.use('/api/complaints', async (req, res) => {
    try {
        const url = `${GRIEVANCE_SERVICE_URL}${req.originalUrl}`;
        console.log(`🔄 Forwarding grievance to: ${url}`);
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
            },
            withCredentials: true
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Grievance proxy error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Grievance service error' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        services: {
            auth: AUTH_SERVICE_URL,
            earnings: EARNINGS_SERVICE_URL,
            anomaly: ANOMALY_SERVICE_URL  // ← ADD THIS
        }
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
    console.log(`   Auth: ${AUTH_SERVICE_URL}`);
    console.log(`   Earnings: ${EARNINGS_SERVICE_URL}`);
    console.log(`   Anomaly: ${ANOMALY_SERVICE_URL}`);  // ← ADD THIS
});