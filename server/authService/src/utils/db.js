import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool for Neon Cloud
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false }  // For production (Render/Neon)
        : false,  // For local development
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// Helper function for queries
export const query = async (text, params) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 100) {
            console.log(`⚠️ Slow query (${duration}ms):`, text);
        }
        return result;
    } catch (error) {
        console.error('Query error:', error.message);
        throw error;
    }
};

// Test database connection
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as time, current_database() as database');
        console.log('✅ Neon PostgreSQL connected successfully');
        console.log(`   Database: ${result.rows[0].database}`);
        console.log(`   Server time: ${result.rows[0].time}`);
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        return false;
    }
};

// Get pool stats
export const getPoolStats = () => {
    return {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
    };
};

// Close all connections
export const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (error) {
        console.error('Error closing pool:', error.message);
    }
};

// Handle unexpected errors
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
});

export default pool;