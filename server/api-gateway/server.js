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
const CERTIFICATE_SERVICE_URL = process.env.CERTIFICATE_SERVICE_URL || 'http://localhost:3006';

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
app.get('/api/shifts/anomalies', async (req, res) => {
    console.log('🎯 ANOMALY ROUTE HIT');
    
    try {
        // Step 1: Get shifts from earnings service
        const earningsUrl = `${EARNINGS_SERVICE_URL}/api/shifts/my`;
        console.log(`📡 Fetching shifts from: ${earningsUrl}`);
        
        const shiftsResponse = await axios({
            method: 'GET',
            url: earningsUrl,
            headers: { 'Cookie': req.headers.cookie || '' },
            withCredentials: true
        });
        
        // Extract the shifts array from the response
        const shifts = shiftsResponse.data.shifts || [];
        console.log(`📊 Found ${shifts.length} shifts`);
        
        if (shifts.length === 0) {
            return res.json({
                user_id: null,
                anomalies: [],
                summary: "No shifts to analyze",
                has_anomalies: false
            });
        }
        
        // Step 2: Format shifts for anomaly service (CORRECT FORMAT)
        const earningsData = shifts.map(shift => ({
            date: shift.shift_date.split('T')[0], // Convert "2026-04-25T19:00:00.000Z" to "2026-04-25"
            amount: parseFloat(shift.net_received),
            hours_worked: parseFloat(shift.hours_worked),
            platform: shift.platform
        }));
        
        // Step 3: Call Python anomaly service with CORRECT body format
        const anomalyUrl = `${ANOMALY_SERVICE_URL}/api/detect-anomalies`;
        console.log(`🐍 Calling anomaly service: ${anomalyUrl}`);
        console.log(`📦 Sending ${earningsData.length} earnings entries`);
        
        const anomalyResponse = await axios({
            method: 'POST',
            url: anomalyUrl,
            data: {
                user_id: 6,  // Hardcode for now, or extract from shift data
                earnings: earningsData
            },
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });
        
        console.log(`✅ Anomaly detection complete. Found ${anomalyResponse.data.anomalies?.length || 0} anomalies`);
        res.json(anomalyResponse.data);
        
    } catch (error) {
        console.error('❌ Anomaly detection error:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        res.status(500).json({
            anomalies: [],
            summary: 'Anomaly service error: ' + error.message,
            has_anomalies: false
        });
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

// Specific route for anomaly detection
// ============================================
// ANOMALY ROUTE - CORRECTED
// ============================================

// Alternative: Direct proxy for anomaly service (if you want to forward all /api/anomaly/*)
app.use('/api/anomaly', async (req, res) => {
    try {
        const path = req.originalUrl.replace('/api/anomaly', '/api');
        const url = `${ANOMALY_SERVICE_URL}${path}`;
        console.log(`🔄 Forwarding to anomaly service: ${url}`);

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
// CERTIFICATE ROUTES
// ============================================
app.use('/api/certificate', async (req, res) => {
    try {
        const url = `${CERTIFICATE_SERVICE_URL}${req.originalUrl}`;
        console.log(`🔄 Forwarding certificate request to: ${url}`);
        
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { 
                'Content-Type': 'application/json',
                'Cookie': req.headers.cookie || ''
            },
            withCredentials: true,
            responseType: 'text'  // Important for HTML response
        });
        
        res.setHeader('Content-Type', 'text/html');
        res.send(response.data);
    } catch (error) {
        console.error('Certificate proxy error:', error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'Certificate service error',
            details: error.message 
        });
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
            analytics: ANALYTICS_SERVICE_URL,
            certificate: CERTIFICATE_SERVICE_URL
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
    console.log(`   Certificate: ${CERTIFICATE_SERVICE_URL}`);
});