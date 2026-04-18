import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false,  // ← CHANGE THIS
});

export const query = (text, params) => pool.query(text, params);

export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

export default pool;