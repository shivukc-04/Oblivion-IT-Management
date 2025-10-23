import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 10,
        maxLength: 10,
    },
    username:{
        type: String,
        required: true,
        trim: true,
        maxLength: 30,
        match: /^[^0-9]*$/,
        trim: true,
    },
    password:{
        type: String,
        required: True,
    },
    salt:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ["viewer", "admin", "operator"],
        default: "viewer",
    },
    email:{
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
}, {timestamps: true})

const user = mongoose.model("user", userSchema)
export default user