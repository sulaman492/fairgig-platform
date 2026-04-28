// server/earningService/src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import shiftRoutes from './src/routes/shifts.route.js';
import analyticsRoutes from './src/routes/shifts.analytics.route.js';
import { authenticate } from './src/middleware/auth.middleware.js';

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

console.log(`🔐 Earnings Service CORS Configuration:`);
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Allowed Origin: ${NODE_ENV === 'production' ? API_GATEWAY_URL : 'http://localhost:5000'}`);
console.log(`   Frontend CANNOT call this service directly!`);

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors(corsOptions));

// Apply authentication middleware to ALL routes
app.use('/api/shifts', authenticate, shiftRoutes);
app.use('/api/analytics', authenticate, analyticsRoutes);

// Public health check (no auth needed - for API Gateway)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'earnings-service',
        note: 'This service is only accessible via API Gateway'
    });
});

export default app;