// src/routes/grievance.route.js
import express from 'express';
import { verifyToken, requireRole } from '../middlewares/auth.middleware.js';  // ← Fix path (singular 'middleware')
import {
    createComplaint,
    getMyComplaints,
    getAllComplaints,
    getComplaintById,
    updateComplaint,
    deleteComplaint,
    upvoteComplaint,
    getTrending,
    getCommunityBulletin
} from '../controllers/grievance.controller.js';

const router = express.Router();

// Worker routes
router.post('/', verifyToken, requireRole(['worker']), createComplaint);
router.get('/my', verifyToken, requireRole(['worker']), getMyComplaints);
router.post('/:id/upvote', verifyToken, requireRole(['worker']), upvoteComplaint);
router.get('/community', verifyToken, requireRole(['worker']), getCommunityBulletin);

// Advocate routes
router.get('/', verifyToken, requireRole(['advocate']), getAllComplaints);
router.get('/trending', verifyToken, requireRole(['advocate']), getTrending);
router.get('/:id', verifyToken, requireRole(['advocate']), getComplaintById);
router.put('/:id', verifyToken, requireRole(['advocate']), updateComplaint);
router.delete('/:id', verifyToken, requireRole(['advocate']), deleteComplaint);

export default router;