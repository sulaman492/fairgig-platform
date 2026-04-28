// backend/auth-service/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/auth.route.js';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Get allowed origin from environment (NO FALLBACK!)
const FRONTEND_URL = process.env.FRONTEND_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate CORS origin in production
if (NODE_ENV === 'production' && !FRONTEND_URL) {
    console.error('❌ FATAL: FRONTEND_URL must be set in production');
    process.exit(1);
}

// CORS configuration
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? FRONTEND_URL  // No fallback - must be set
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
};

console.log(`🔧 CORS origin: ${NODE_ENV === 'production' ? FRONTEND_URL : 'localhost:5173, localhost:3000'}`);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'auth-service',
        environment: NODE_ENV,
        timestamp: new Date().toISOString()
    });
});

export default app;