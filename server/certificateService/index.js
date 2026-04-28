// server/certificateService/index.js
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import certificateRoutes from './routes/certificate.js';
import { authenticate } from './middleware/auth.middleware.js';

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
        ? API_GATEWAY_URL
        : ['http://localhost:5000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
};

console.log(`🔐 Certificate Service CORS Configuration:`);
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Allowed Origin: ${NODE_ENV === 'production' ? API_GATEWAY_URL : 'http://localhost:5000'}`);
console.log(`   Frontend CANNOT call this service directly!`);

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors(corsOptions));

// Apply authentication to ALL certificate routes
app.use('/api/certificate', authenticate, certificateRoutes);

// Health check (internal - for API Gateway)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'certificate-service',
        environment: NODE_ENV,
        note: 'This service is only accessible via API Gateway'
    });
});

// Start server
app.listen(config.port, () => {
    console.log(`✅ Certificate Service running on port ${config.port}`);
    console.log(`   Environment: ${config.env}`);
    console.log(`   API Gateway URL: ${API_GATEWAY_URL || 'Not set'}`);
    console.log(`   🔒 Only accessible via API Gateway`);
});