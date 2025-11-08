import express from 'express';
import auditLog from '../models/auditLog.js';
import { verifyToken } from '../middlewares/verifyToken.js';
import { authorizeRoles } from '../middlewares/authorizeRoles.js';

const auditRouter = express.Router();

/**
 * GET /api/audit/logs - Get all audit logs (Admin only)
 */
auditRouter.get('/logs', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 50, 
            userId, 
            method, 
            eventType,
            startDate,
            endDate 
        } = req.query;

        // Build filter query
        const filter = {};
        if (userId) filter.userId = userId;
        if (method) filter.method = method;
        if (eventType) filter.eventType = eventType;
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        // Pagination
        const skip = (page - 1) * limit;

        // Execute query
        const [logs, total] = await Promise.all([
            auditLog.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            auditLog.countDocuments(filter)
        ]);

        res.json({
            success: true,
            data: logs,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / limit),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch audit logs',
            error: error.message 
        });
    }
});

/**
 * GET /api/audit/user/:userId - Get logs for specific user
 */
auditRouter.get('/user/:userId', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50 } = req.query;

        const logs = await auditLog.find({ userId })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .lean();

        res.json({
            success: true,
            data: logs,
            count: logs.length
        });
    } catch (error) {
        console.error('Error fetching user audit logs:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch user logs',
            error: error.message 
        });
    }
});

/**
 * GET /api/audit/stats - Get audit statistics
 */
auditRouter.get('/stats', verifyToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const stats = await auditLog.aggregate([
            {
                $facet: {
                    byMethod: [
                        { $group: { _id: '$method', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byEventType: [
                        { $group: { _id: '$eventType', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    byStatusCode: [
                        { $group: { _id: '$statusCode', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    totalRequests: [
                        { $count: 'total' }
                    ],
                    avgResponseTime: [
                        { $group: { _id: null, avgTime: { $avg: '$responseTime' } } }
                    ]
                }
            }
        ]);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Error fetching audit stats:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch statistics',
            error: error.message 
        });
    }
});

export default auditRouter;
