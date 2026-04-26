import express from 'express';
import { signUp, login, verifyToken, getMe, refreshAccessToken, logout } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/signup', signUp);
router.post('/login', login);
router.get('/verify', verifyToken);
router.get('/me', getMe);        // ← ADD THIS LINE
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

export default router;