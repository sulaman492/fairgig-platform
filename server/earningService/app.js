// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shiftRoutes from './src/routes/shifts.route.js';
import analyticsRoutes from './src/routes/shifts.analytics.route.js';
import { authenticate } from './src/middlewares/auth.middleware.js';  

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

// Apply authentication middleware to ALL routes
app.use('/api/shifts', authenticate, shiftRoutes);        // ← ADD authenticate
app.use('/api/analytics', authenticate, analyticsRoutes);  // ← ADD authenticate

// Public health check (no auth needed)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'earnings-service' });
});

export default app;