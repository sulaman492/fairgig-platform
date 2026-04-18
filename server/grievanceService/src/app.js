// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import grievanceRoutes from './routes/grievance.route.js';

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));

app.use('/api/complaints', grievanceRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'grievance-service' });
});

export default app;