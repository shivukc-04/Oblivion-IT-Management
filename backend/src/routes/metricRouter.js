import express from 'express';
import { getCurrentMetrics, getMetricHistory , getAllMetricHistory} from '../controllers/metricController.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();

router.get('/current', verifyToken, getCurrentMetrics);
router.get('/history/all', getAllMetricHistory);  // More specific route first
router.get('/history', getMetricHistory);         // Less specific route second

export default router;