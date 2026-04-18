import express from 'express';
import { signUp, login, verifyToken } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/verify', verifyToken);  // ← ADD THIS LINE

export default router;