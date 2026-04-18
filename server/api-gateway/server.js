import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
const EARNINGS_SERVICE_URL = process.env.EARNINGS_SERVICE_URL || 'http://localhost:3002';
const ANOMALY_SERVICE_URL = process.env.ANOMALY_SERVICE_URL || 'http://localhost:3003';
const GRIEVANCE_SERVICE_URL = process.env.GRIEVANCE_SERVICE_URL || 'http://localhost:3004';
const ANALYTICS_SERVICE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3005';
const CERTIFICATE_SERVICE_URL = process.env.CERTIFICATE_SERVICE_URL || 'http://localhost:3006';

// ============================================
// AUTH ROUTES - Just forward to Auth Service
// ============================================
app.use('/api/auth', async (req, res) => {
    try {
        const url = `${AUTH_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Auth service error' });
    }
});

// ============================================
// EARNINGS ROUTES - Just forward to Earnings Service
// ============================================
app.use('/api/shifts', async (req, res) => {
    try {
        const url = `${EARNINGS_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Earnings service error' });
    }
});

// ============================================
// ANOMALY ROUTES - Just forward to Anomaly Service
// ============================================
app.use('/api/detect-anomalies', async (req, res) => {
    try {
        const url = `${ANOMALY_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Anomaly service error' });
    }
});

// ============================================
// GRIEVANCE ROUTES - Just forward to Grievance Service
// ============================================
app.use('/api/complaints', async (req, res) => {
    try {
        const url = `${GRIEVANCE_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Grievance service error' });
    }
});

// ============================================
// ANALYTICS ROUTES - Just forward to Analytics Service
// ============================================
app.use('/api/analytics', async (req, res) => {
    try {
        const url = `${ANALYTICS_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Analytics service error' });
    }
});

// ============================================
// CERTIFICATE ROUTES - Just forward to Certificate Service
// ============================================
app.use('/api/certificate', async (req, res) => {
    try {
        const url = `${CERTIFICATE_SERVICE_URL}${req.originalUrl}`;
        const response = await axios({
            method: req.method,
            url: url,
            params: req.query,
            data: req.body,
            headers: { Authorization: req.headers.authorization }
        });
        res.status(response.status).send(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Certificate service error' });
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ API Gateway running on port ${PORT}`);
});