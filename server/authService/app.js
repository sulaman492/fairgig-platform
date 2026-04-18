// backend/auth-service/src/app.js
import express from 'express';
import cors from 'cors';
import authRoutes from './src/routes/auth.route.js';

const app = express();

app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

export default app;