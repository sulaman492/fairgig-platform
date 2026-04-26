// index.js
import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import certificateRoutes from './routes/certificate.js';

const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors({
    origin: config.corsOrigin,
    credentials: true
}));

// Routes
app.use('/api/certificate', certificateRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        service: 'certificate-service',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(config.port, () => {
    console.log(`✅ Certificate Service running on port ${config.port}`);
    console.log(`   Environment: ${config.env}`);
    console.log(`   CORS Origin: ${config.corsOrigin}`);
});