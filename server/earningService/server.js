import app from './app.js';
import { query } from './src/utils/db.js';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3002;

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
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Shifts table ready');
    } catch (error) {
        console.error('❌ Database init error:', error.message);
    }
};

const startServer = async () => {
    await initDB();
    
    app.listen(PORT, () => {
        console.log(`✅ Earnings Service running on port ${PORT}`);
        console.log(`📍 http://localhost:${PORT}`);
    });
};

startServer();