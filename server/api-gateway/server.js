import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

app.use(cors({
    origin: 'http://localhost:5173',
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

// ============================================
// AUTH ROUTES
// ============================================
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

// ============================================
// EARNINGS ROUTES (Worker)
// ============================================
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

// ============================================
// ANALYTICS ROUTES (Advocate - FastAPI Service)
// ============================================

// Commission trends
app.get('/api/analytics/commission-trends', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/api/analytics/commission-trends`;
        console.log(`🔄 Forwarding to Analytics Service: ${url}`);
        
        const response = await axios({
            method: 'GET',
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Analytics proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Analytics service unavailable',
            details: error.message
        });
    }
});

// Income distribution
app.get('/api/analytics/income-distribution', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/api/analytics/income-distribution`;
        console.log(`🔄 Forwarding to Analytics Service: ${url}`);
        
        const response = await axios({
            method: 'GET',
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Analytics proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Analytics service unavailable',
            details: error.message
        });
    }
});

// Vulnerable workers
app.get('/api/analytics/vulnerable-workers', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/api/analytics/vulnerable-workers`;
        console.log(`🔄 Forwarding to Analytics Service: ${url}`);
        
        const response = await axios({
            method: 'GET',
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Analytics proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Analytics service unavailable',
            details: error.message
        });
    }
});

// Top complaints
app.get('/api/analytics/top-complaints', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/api/analytics/top-complaints`;
        console.log(`🔄 Forwarding to Analytics Service: ${url}`);
        
        const response = await axios({
            method: 'GET',
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Analytics proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Analytics service unavailable',
            details: error.message
        });
    }
});

// Complete summary
app.get('/api/analytics/summary', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/api/analytics/summary`;
        console.log(`🔄 Forwarding to Analytics Service: ${url}`);
        
        const response = await axios({
            method: 'GET',
            url: url,
            params: req.query,
            headers: { 'Cookie': req.headers.cookie || '' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Analytics proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            success: false, 
            error: 'Analytics service unavailable',
            details: error.message
        });
    }
});

// Analytics health check
app.get('/api/analytics/health', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}/health`;
        const response = await axios.get(url);
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(503).json({ status: 'unavailable', service: 'analytics-service' });
    }
});

// ============================================
// ANOMALY ROUTES
// ============================================
app.use('/api/anomaly', async (req, res) => {
    try {
        const path = req.originalUrl.replace('/api/anomaly', '/api');
        const url = `${ANOMALY_SERVICE_URL}${path}`;
        console.log('🔄 Forwarding anomaly to:', url);
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 'Content-Type': 'application/json' }
        });
        
        res.status(response.status).json(response.data);
    } catch (error) {
        console.error('Anomaly proxy error:', error.message);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Anomaly service error' });
    }
});

// ============================================
// GRIEVANCE ROUTES
// ============================================
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

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        services: {
            auth: AUTH_SERVICE_URL,
            earnings: EARNINGS_SERVICE_URL,
            anomaly: ANOMALY_SERVICE_URL,
            grievance: GRIEVANCE_SERVICE_URL,
            analytics: ANALYTICS_SERVICE_URL
        }
    });
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
});