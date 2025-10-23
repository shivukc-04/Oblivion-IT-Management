import mongoose from "mongoose";
const auditLogSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 10,
        maxLength: 10,
    },
    eventType:{
        type: String,
        required: true,
        enum: ["Login", "Logout"],
    },
    ip:{
        type: String,
        required: true
    },
    deviceInfo:{
        type: String,
    },
}, {timestamps: true})

const auditLog = mongoose.model("auditLog", auditLogSchema)
export default auditLog