import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shiftRoutes from './src/routes/shifts.route.js';
import analyticsRoutes from './src/routes/shifts.analytics.route.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Routes
app.use('/api/shifts', shiftRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'earnings-service' });
});

export default app;