import express from 'express';
import { signUp } from '../controllers/auth.controller.js';  // ← ADD login here

const router = express.Router();

// Sign up route
router.post('/signup', signUp);
//router.post('/login', login);  // ← Now login is defined

export default router;