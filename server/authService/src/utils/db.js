import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Create connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'fairgig_auth',
    max: 20, // Maximum number of clients in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
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

// Get a client from pool (for transactions)
export const getClient = async () => {
    const client = await pool.connect();
    const query = client.query.bind(client);
    const release = client.release.bind(client);
    
    // Set timeout to release client after 5 seconds
    const timeout = setTimeout(() => {
        console.error('A client has been checked out for more than 5 seconds');
    }, 5000);
    
    client.release = () => {
        clearTimeout(timeout);
        release();
    };
    
    return { client, query, release: client.release };
};

// Test database connection
export const testConnection = async () => {
    try {
        const result = await query('SELECT NOW() as time, current_database() as database');
        console.log('✅ PostgreSQL connected successfully');
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

// Close all connections (for graceful shutdown)
export const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Database pool closed');
    } catch (error) {
        console.error('Error closing pool:', error.message);
    }
};

// Handle unexpected errors on idle clients
pool.on('error', (err, client) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

export default pool;