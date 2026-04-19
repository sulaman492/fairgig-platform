// src/app.js - No need for static uploads folder anymore
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shiftRoutes from './src/routes/shifts.route.js';
import analyticsRoutes from './src/routes/shifts.analytics.route.js';

const app = express();

app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// No more static file serving needed for uploads

app.use('/api/shifts', shiftRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'earnings-service' });
});

export default app;