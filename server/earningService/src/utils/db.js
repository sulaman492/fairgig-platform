import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Use connection pooler URL for better performance
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },  // ← Enable SSL for Neon
    max: 20,  // Max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// ✅ Log slow queries
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        
        // Log queries slower than 500ms
        if (duration > 500) {
            console.warn(`⚠️ Slow query (${duration}ms):`, text.substring(0, 150));
        }
        
        return result;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
};

// ✅ Keep connection alive (prevents cold start)
let keepAliveInterval;

const startKeepAlive = () => {
    if (keepAliveInterval) clearInterval(keepAliveInterval);
    
    keepAliveInterval = setInterval(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('💓 Keep-alive ping at', new Date().toLocaleTimeString());
    } catch (err) {
        // Silent fail
    }
}, 15000); // Every 15 seconds
};

export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW()');
        console.log('✅ Database connected successfully');
        console.log(`   Server time: ${result.rows[0].now}`);
        
        // Start keep-alive after successful connection
        startKeepAlive();
        
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Graceful shutdown
export const closePool = async () => {
    if (keepAliveInterval) {
        clearInterval(keepAliveInterval);
    }
    await pool.end();
    console.log('✅ Database pool closed');
};

export default pool;