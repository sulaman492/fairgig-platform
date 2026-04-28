// src/routes/shifts.route.js
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';  // ← PATH FIXED
import { 
    createShift, 
    getMyShifts, 
    getPendingShifts, 
    verifyShift,
    getIncomeSummary,
    getShiftsByDateRange,
    updateShift,
    deleteShift,
    getVerifiedShifts,
    getFlaggedShifts 
} from '../controllers/shift.controller.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../../uploads');
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
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

const router = express.Router();

// Worker routes - Replace verifyToken with authenticate
router.post('/', 
    authenticate,  // ← Changed
    requireRole(['worker']), 
    upload.single('screenshot'),
    createShift
);

router.get('/my', authenticate, requireRole(['worker']), getMyShifts);  // ← Changed
router.get('/summary', authenticate, requireRole(['worker']), getIncomeSummary);  // ← Changed
router.get('/range', authenticate, requireRole(['worker']), getShiftsByDateRange);  // ← Changed
router.put('/:shift_id', authenticate, requireRole(['worker']), updateShift);  // ← Changed
router.delete('/:shift_id', authenticate, requireRole(['worker']), deleteShift);  // ← Changed

// Verifier routes
router.get('/pending', authenticate, requireRole(['verifier']), getPendingShifts);  // ← Changed
router.get('/verified', authenticate, requireRole(['verifier']), getVerifiedShifts);  // ← Changed
router.get('/flagged', authenticate, requireRole(['verifier']), getFlaggedShifts);  // ← Changed
router.put('/:shift_id/verify', authenticate, requireRole(['verifier']), verifyShift);  // ← Changed

export default router;