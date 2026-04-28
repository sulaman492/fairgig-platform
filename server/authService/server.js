import app from './app.js';
import { testConnection } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

// ============================================
// ENVIRONMENT VALIDATION - NO FALLBACKS!
// ============================================

const requiredEnvVars = [
    'PORT',
    'DATABASE_URL',
    'ACCESS_SECRET',
    'REFRESH_SECRET'
];

const optionalEnvVars = [
    'ACCESS_TOKEN_EXPIRY',
    'REFRESH_TOKEN_EXPIRY',
    'NODE_ENV',
    'FRONTEND_URL',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
];

// Check for missing required environment variables
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('\n❌ FATAL: Missing required environment variables:');
    missingEnvVars.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('\n   Please set these in your .env file');
    console.error('   Example:');
    console.error('   ACCESS_SECRET=your-secret-key-here');
    console.error('   REFRESH_SECRET=your-refresh-secret-key-here\n');
    process.exit(1);
}

// Validate secret length (minimum 32 characters for security)
if (process.env.ACCESS_SECRET && process.env.ACCESS_SECRET.length < 32) {
    console.error('\n❌ FATAL: ACCESS_SECRET must be at least 32 characters long');
    console.error('   Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
}

if (process.env.REFRESH_SECRET && process.env.REFRESH_SECRET.length < 32) {
    console.error('\n❌ FATAL: REFRESH_SECRET must be at least 32 characters long');
    console.error('   Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
    process.exit(1);
}

// Set default values for optional env vars (only for development)
// These are safe defaults, not security-critical
const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = process.env.PORT;  // No fallback - must be set
const ACCESS_TOKEN_EXPIRY = process.env.ACCESS_TOKEN_EXPIRY || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY || '7d';

// Log configuration (without exposing secrets)
console.log('\n📋 Auth Service Configuration:');
console.log(`   Environment: ${NODE_ENV}`);
console.log(`   Port: ${PORT}`);
console.log(`   Access Token Expiry: ${ACCESS_TOKEN_EXPIRY}`);
console.log(`   Refresh Token Expiry: ${REFRESH_TOKEN_EXPIRY}`);
console.log(`   Database: ${process.env.DATABASE_URL ? '✓ Configured' : '✗ Missing'}`);
console.log(`   Access Secret: ${process.env.ACCESS_SECRET ? '✓ Set (' + process.env.ACCESS_SECRET.length + ' chars)' : '✗ Missing'}`);
console.log(`   Refresh Secret: ${process.env.REFRESH_SECRET ? '✓ Set (' + process.env.REFRESH_SECRET.length + ' chars)' : '✗ Missing'}`);
console.log(`   Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? '✓ Configured' : '✗ Not configured (optional)'}\n`);

// Warn about missing optional env vars in production
if (NODE_ENV === 'production') {
    const missingOptional = optionalEnvVars.filter(envVar => !process.env[envVar]);
    if (missingOptional.length > 0) {
        console.warn('⚠️  Warning: Missing optional environment variables:');
        missingOptional.forEach(envVar => console.warn(`   - ${envVar}`));
        console.warn('   Some features may not work correctly\n');
    }
}

const startServer = async () => {
    console.log('🔌 Testing database connection...');
    
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('\n❌ Cannot start server without database');
        console.error('   Please check your DATABASE_URL environment variable\n');
        process.exit(1);
    }
    
    console.log('✅ Database connection successful\n');
    
    // Start server
    app.listen(PORT, () => {
        console.log(`🚀 Auth Service is running!`);
        console.log(`📍 URL: http://localhost:${PORT}`);
        console.log(`❤️  Health check: http://localhost:${PORT}/health`);
        console.log(`🔐 API endpoints: http://localhost:${PORT}/api/auth`);
        
        if (NODE_ENV === 'production') {
            console.log(`\n🌐 Production mode - ensure FRONTEND_URL is set correctly`);
            console.log(`   CORS origin: ${process.env.FRONTEND_URL || 'Not set'}`);
        }
        console.log('');
    });
};

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n⚠️  Received ${signal}, shutting down gracefully...`);
    
    // Close database connections
    const { closePool } = await import('./src/utils/db.js');
    await closePool();
    
    console.log('✅ Cleanup completed');
    process.exit(0);
};

// Listen for termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
});

startServer();