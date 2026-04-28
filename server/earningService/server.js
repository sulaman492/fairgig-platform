// server/earningService/server.js
import app from './app.js';
import { query } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// ENVIRONMENT VALIDATION
// ============================================

const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'ACCESS_SECRET',
    'API_GATEWAY_URL'  // ← Required - only API Gateway can call this
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
const PORT = process.env.PORT || 3002;

console.log('\n📋 Earnings Service Configuration:');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Port: ${PORT}`);
console.log(`   API Gateway URL: ${process.env.API_GATEWAY_URL}`);
console.log(`   Database: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
console.log(`   ACCESS_SECRET: ${process.env.ACCESS_SECRET ? '✓ Set' : '✗ Missing'}\n`);

// Create shifts table if not exists
const initDB = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS shifts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                platform VARCHAR(100) NOT NULL,
                shift_date DATE NOT NULL,
                hours_worked DECIMAL(5,2) NOT NULL,
                gross_earned DECIMAL(10,2) NOT NULL,
                platform_deductions DECIMAL(10,2) NOT NULL,
                net_received DECIMAL(10,2) NOT NULL,
                verification_status VARCHAR(20) DEFAULT 'pending',
                screenshot_url TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Shifts table ready');
    } catch (error) {
        console.error('❌ Database init error:', error.message);
        process.exit(1);
    }
};

const startServer = async () => {
    await initDB();
    
    app.listen(PORT, () => {
        console.log(`🚀 Earnings Service is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`🔒 Only accessible via API Gateway: ${process.env.API_GATEWAY_URL}`);
        console.log(`❤️  Health check: http://localhost:${PORT}/health\n`);
    });
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();