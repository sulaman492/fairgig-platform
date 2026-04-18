import express from 'express';
import { getCityMedian } from '../controllers/analytics.controller.js';

const router = express.Router();

router.get('/city-median', getCityMedian);

export default router;