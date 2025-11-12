import express from 'express';
import { getCurrentMetrics, getMetricHistory } from '../controllers/metricController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/current', verifyToken, getCurrentMetrics);
router.get('/history', verifyToken, getMetricHistory);

export default router;