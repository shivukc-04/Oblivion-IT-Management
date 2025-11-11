import mongoose from 'mongoose';
const incidentSchema = new mongoose.Schema({
    ticketId:{
        type: String,
        required: true,
        unique: true,
    },
    title:{
        type: String,
        required: true,
        maxLength: 40
    },
    description:{
        type: String,
        maxLength: 120
    },
    status:{
        type: String,
        required: true,
        enum: ['open', 'inProgress', 'resolved'],
    },
    priority:{
        type: String,
        enum: ['lowest', 'low', 'medium', 'high', 'highest'],
        default: 'medium',
    },
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    assignedTo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    resolvedAt:{
        type: Date,
    },
}, {timestamps: true});

const incident = mongoose.model('incident', incidentSchema);
export default incident;