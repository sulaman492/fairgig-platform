import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';  // ✅ ADD THIS
import authRoutes from './src/routes/auth.route.js';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',  // Frontend URL
    credentials: true  // ✅ Allow cookies to be sent
}));
app.use(cookieParser());  // ✅ ADD THIS

// Routes
app.use('/api/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'auth-service' });
});

export default app;