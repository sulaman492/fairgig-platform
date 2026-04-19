// src/routes/shifts.route.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { 
    createShift, 
    getMyShifts, 
    getPendingShifts, 
    verifyShift,
    getIncomeSummary,
    getShiftsByDateRange,
    updateShift,
    deleteShift,
    getVerifiedShifts,   // ← ADD THIS
    getFlaggedShifts 
} from '../controllers/shift.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
        // Ensure uploads directory exists
        const fs = require('fs');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `screenshot-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only images are allowed'));
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

const router = express.Router();

// Worker routes
router.post('/', 
    verifyToken, 
    requireRole(['worker']), 
    (req, res, next) => {
        console.log('Request headers:', req.headers);
        console.log('Content-Type:', req.headers['content-type']);
        next();
    },
    upload.single('screenshot'),
    (req, res, next) => {
        console.log('req.body after multer:', req.body);
        console.log('req.file after multer:', req.file);
        next();
    },
    createShift
);router.get('/my', verifyToken, requireRole(['worker']), getMyShifts);
router.get('/summary', verifyToken, requireRole(['worker']), getIncomeSummary);
router.get('/range', verifyToken, requireRole(['worker']), getShiftsByDateRange);
router.put('/:shift_id', verifyToken, requireRole(['worker']), updateShift);
router.delete('/:shift_id', verifyToken, requireRole(['worker']), deleteShift);

// Verifier routes
// Verifier routes
router.get('/pending', verifyToken, requireRole(['verifier']), getPendingShifts);
router.get('/verified', verifyToken, requireRole(['verifier']), getVerifiedShifts);
router.get('/flagged', verifyToken, requireRole(['verifier']), getFlaggedShifts);
router.put('/:shift_id/verify', verifyToken, requireRole(['verifier']), verifyShift);
export default router;