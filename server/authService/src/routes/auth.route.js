import express from 'express';
import { signUp } from '../controllers/auth.controller.js';

const router = express.Router();

// Sign up route
router.post('/signup', signUp);

export default router;