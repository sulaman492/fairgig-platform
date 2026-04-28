// server/certificateService/config/index.js
// NO dotenv - Render injects env vars directly!

export const config = {
    port: process.env.PORT || 3006,
    env: process.env.NODE_ENV || 'development'
};