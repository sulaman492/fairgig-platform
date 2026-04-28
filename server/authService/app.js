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

// ============================================
// CORS - ONLY ALLOW API GATEWAY, NOT FRONTEND!
// ============================================

const API_GATEWAY_URL = process.env.API_GATEWAY_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Validate API Gateway URL in production
if (NODE_ENV === 'production' && !API_GATEWAY_URL) {
    console.error('❌ FATAL: API_GATEWAY_URL must be set in production');
    console.error('   This service should only be accessible via API Gateway');
    process.exit(1);
}

// CORS configuration - ONLY allow API Gateway
const corsOptions = {
    origin: NODE_ENV === 'production' 
        ? API_GATEWAY_URL  // ONLY API Gateway can call this service
        : ['http://localhost:5000'],  // Local API Gateway only
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
};

console.log(`🔐 Auth Service CORS Configuration:`);
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Allowed Origin: ${NODE_ENV === 'production' ? API_GATEWAY_URL : 'http://localhost:5000'}`);
console.log(`   Frontend CANNOT call this service directly!`);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.use(cors(corsOptions));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);

// Health check (internal - for API Gateway)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'auth-service',
        environment: NODE_ENV,
        note: 'This service is only accessible via API Gateway'
    });
});

export default app;