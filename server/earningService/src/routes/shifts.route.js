import express from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';
import { 
    createShift, 
    getMyShifts, 
    getPendingShifts, 
    verifyShift,
    getIncomeSummary,
    getShiftsByDateRange,
    updateShift,     // ← ADD THIS
    deleteShift      // ← ADD THIS
} from '../controllers/shift.controller.js';

const router = express.Router();

// Worker routes
router.post('/', verifyToken, requireRole(['worker']), createShift);
router.get('/my', verifyToken, requireRole(['worker']), getMyShifts);
router.get('/summary', verifyToken, requireRole(['worker']), getIncomeSummary);
router.get('/range', verifyToken, requireRole(['worker']), getShiftsByDateRange);
router.put('/:shift_id', verifyToken, requireRole(['worker']), updateShift);      // ← ADD THIS
router.delete('/:shift_id', verifyToken, requireRole(['worker']), deleteShift);   // ← ADD THIS

// Verifier routes
router.get('/pending', verifyToken, requireRole(['verifier']), getPendingShifts);
router.put('/:shift_id/verify', verifyToken, requireRole(['verifier']), verifyShift);

export default router;