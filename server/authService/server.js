// backend/auth-service/server.js
import app from './app.js';
import { testConnection } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;

const startServer = async () => {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ Cannot start server without database');
        process.exit(1);
    }
    
    app.listen(PORT, () => {
        console.log(`✅ Auth Service running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
};

startServer();