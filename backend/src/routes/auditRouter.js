import express from 'express';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';
import { getAllLogs, getAuditStats, getUserLogs } from '../controllers/auditController.js';

const auditRouter = express.Router();

/**
 * GET /api/audit/logs - Get all audit logs (Admin only)
 */
auditRouter.get('/logs', verifyToken, authorizeRoles('admin'), getAllLogs);

/**
 * GET /api/audit/user/:userId - Get logs for specific user
 */
auditRouter.get('/user/:userId', verifyToken, authorizeRoles('admin'), getUserLogs);

/**
 * GET /api/audit/stats - Get audit statistics
 */
auditRouter.get('/stats', verifyToken, authorizeRoles('admin'), getAuditStats);

export default auditRouter;
