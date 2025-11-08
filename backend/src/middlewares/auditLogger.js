import auditLog from '../models/auditLog.js';

/**
 * Middleware to log all HTTP requests to MongoDB
 * Captures: method, path, IP, userId, timestamp, response status
 */
export const auditLogger = async (req, res, next) => {
    console.log('🔍 Audit logger middleware called:', req.method, req.path);
    
    const startTime = Date.now();

    // Capture request details immediately
    const logData = {
        method: req.method,
        path: req.originalUrl || req.url,
        ip: getClientIp(req),
        userAgent: req.get('user-agent') || null,
        deviceInfo: extractDeviceInfo(req.get('user-agent')),
        queryParams: req.query || {},
    };

    console.log('📋 Log data prepared:', JSON.stringify(logData, null, 2));

    // Capture userId if user is authenticated (from verifyToken middleware)
    if (req.user) {
        logData.userId = req.user.userId || req.user.id;
        logData.userEmail = req.user.email;
        console.log('✅ User authenticated:', logData.userId);
    } else {
        console.log('❌ No user authenticated');
    }

    // Determine event type based on path and method
    logData.eventType = determineEventType(req.path, req.method);

    // Capture request body (sanitize sensitive data)
    if (req.body && Object.keys(req.body).length > 0) {
        logData.requestBody = sanitizeBody(req.body);
    }

    // Listen for response finish event
    res.on('finish', async () => {
        try {
            logData.statusCode = res.statusCode;
            logData.responseTime = Date.now() - startTime;

            console.log('💾 Attempting to save audit log...');
            console.log('Data to save:', JSON.stringify(logData, null, 2));

            // Save to MongoDB (non-blocking)
            const savedLog = await auditLog.create(logData);
            console.log('✅ Audit log saved successfully! ID:', savedLog._id);
        } catch (error) {
            // Log error but don't break the application
            console.error('❌ Audit logging error:', error.message);
            console.error('Full error:', error);
        }
    });

    // Handle errors in the response
    res.on('error', async (error) => {
        try {
            logData.errorMessage = error.message;
            logData.statusCode = res.statusCode || 500;
            logData.responseTime = Date.now() - startTime;

            await auditLog.create(logData);
            console.log('✅ Error audit log saved');
        } catch (err) {
            console.error('❌ Audit logging error on error handler:', err.message);
        }
    });

    next();
};

/**
 * Get client IP address (handles proxies and load balancers)
 */
function getClientIp(req) {
    return (
        req.headers['x-forwarded-for']?.split(',')[0].trim() ||
        req.headers['x-real-ip'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown'
    );
}

/**
 * Extract device information from user agent
 */
function extractDeviceInfo(userAgent) {
    if (!userAgent) return 'Unknown';
    
    // Simple device detection
    if (/mobile/i.test(userAgent)) return 'Mobile';
    if (/tablet/i.test(userAgent)) return 'Tablet';
    if (/windows/i.test(userAgent)) return 'Windows Desktop';
    if (/mac/i.test(userAgent)) return 'Mac Desktop';
    if (/linux/i.test(userAgent)) return 'Linux Desktop';
    
    return 'Unknown';
}

/**
 * Determine event type based on path and method
 */
function determineEventType(path, method) {
    // Login/Logout detection
    if (path.includes('/login')) return 'Login';
    if (path.includes('/logout')) return 'Logout';
    
    // CRUD operations
    if (method === 'POST') return 'Create';
    if (method === 'PUT' || method === 'PATCH') return 'Update';
    if (method === 'DELETE') return 'Delete';
    if (method === 'GET') return 'View';
    
    return 'Other';
}

/**
 * Sanitize request body to remove sensitive information
 */
function sanitizeBody(body) {
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'cvv'];
    const sanitized = { ...body };

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '***REDACTED***';
        }
    });

    return sanitized;
}
