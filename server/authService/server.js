// backend/auth-service/server.js
import app from './app.js';
import { testConnection } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'ACCESS_SECRET',
    'REFRESH_SECRET',
    'API_GATEWAY_URL'  // ← Now required instead of FRONTEND_URL
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n   This service must only be accessible via API Gateway');
    console.error('   Set API_GATEWAY_URL to your API Gateway URL\n');
    process.exit(1);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT;

console.log('\n📋 Auth Service Configuration:');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Port: ${PORT}`);
console.log(`   API Gateway URL: ${process.env.API_GATEWAY_URL}`);
console.log(`   Database: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
console.log(`   Access Secret: ${process.env.ACCESS_SECRET ? '✓ Set' : '✗ Missing'}\n`);

const startServer = async () => {
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('\n❌ Cannot start server without database\n');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`🚀 Auth Service is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🔒 Only accessible via API Gateway: ${process.env.API_GATEWAY_URL}`);
        console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
    });
};

const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    const { closePool } = await import('./src/utils/db.js');
    await closePool();
    console.log('✅ Cleanup completed');
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

startServer();