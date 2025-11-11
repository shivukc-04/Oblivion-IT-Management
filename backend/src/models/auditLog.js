import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    // User Information (NOT REQUIRED - can be null for unauthenticated requests)
    userId: {
        type: String,
        required: false,  // Changed to false
        default: null,
        trim: true,
    },
    userEmail: {
        type: String,
        required: false,
        default: null
    },
    
    // Request Information
    method: {
        type: String,
        required: true,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']
    },
    path: {
        type: String,
        required: true
    },
    
    // Event Type (for special events like Login/Logout)
    eventType: {
        type: String,
        enum: ['Login', 'Logout', 'Create', 'Update', 'Delete', 'View', 'Other'],
        default: 'Other'
    },
    
    // Network Information
    ip: {
        type: String,
        required: true
    },
    deviceInfo: {
        type: String,
        required: false,
        default: null
    },
    userAgent: {
        type: String,
        required: false,
        default: null
    },
    
    // Response Information
    statusCode: {
        type: Number,
        required: false,
        default: null
    },
    responseTime: {
        type: Number,  // milliseconds
        required: false,
        default: null
    },
    
    // Additional Request Data
    queryParams: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: {}
    },
    requestBody: {
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: {}
    },
    errorMessage: {
        type: String,
        required: false,
        default: null
    }
    
}, { timestamps: true });

// Indexes for better query performance
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ method: 1, createdAt: -1 });
auditLogSchema.index({ ip: 1, createdAt: -1 });
auditLogSchema.index({ eventType: 1, createdAt: -1 });

const auditLog = mongoose.model('auditLog', auditLogSchema);
export default auditLog;
