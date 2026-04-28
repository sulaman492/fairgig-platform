// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import grievanceRoutes from './routes/grievance.route.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

// CORS should only allow API Gateway, not frontend directly!
app.use(cors({
    origin: process.env.API_GATEWAY_URL ,  // ← API Gateway only!
    credentials: true
}));

// Routes - only accessible via API Gateway
app.use('/api/complaints', grievanceRoutes);

// Health check (internal)
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'grievance-service' });
});

export default app;