// config/index.js
import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 3006,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    env: process.env.NODE_ENV || 'development'
};