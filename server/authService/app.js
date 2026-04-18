import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';  // ✅ ADD THIS
import authRoutes from './src/routes/auth.route.js';

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',  // Frontend URL
    credentials: true  // ✅ Allow cookies to be sent
}));
app.use(cookieParser());  // ✅ ADD THIS

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

export default app;