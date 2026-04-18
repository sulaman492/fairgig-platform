// server.js
import app from './src/app.js';
import { query } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3004;

const initDB = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS complaints (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL,
                platform VARCHAR(100) NOT NULL,
                category VARCHAR(100),
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                tags TEXT[],
                cluster_id INTEGER,
                upvotes INTEGER DEFAULT 0,
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Complaints table ready');
    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
};

const startServer = async () => {
    await initDB();
    
    app.listen(PORT, () => {
        console.log(`✅ Grievance Service running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
};

startServer();