import mongoose from "mongoose"; // <-- UNCOMMENT THIS LINE
const metricSchema = new mongoose.Schema({
    serverId:{
        type: String,
        required: true,
    },
    cpu:{
        type: Number,
        default: null
    },
    memory:{
        type: Number,
        default: null
    },
    disk:{
        type: Number,
        default: null
    },
}, {timestamps: true})

const Metric = mongoose.model("Metric", metricSchema) // Renamed to 'Metric' for standard convention
export default Metric // Export the model with default