import mongoose from "mongoose";
const alertSchema = new mongoose.Schema({
    serverId:{
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    resourceType:{
        type: String,
        required: true,
        enum: ["cpu", "memory", "disk"]
    },
    usage:{
        type: Number,
        required: true,
    },
    threshold:{
        type: Number,
        required: true,
    },
    notified:{
        type: Boolean,
        required: true,
    },
    incidentId:{
        type: String,
        required: true,
        unique: true,
    },
}, {timestamps: true})

const alert = mongoose.model("alert", alertSchema)
export default alert