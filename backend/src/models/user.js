import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
const userSchema = new mongoose.Schema({
    userId:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        minLength: 3,
        maxLength: 16,
    },
    username:{
        type: String,
        required: true,
        trim: true,
        maxLength: 30,
        match: /^[^0-9]*$/,
    },
    password:{
        type: String,
        required: true,
    },
    role:{
        type: String,
        enum: ['viewer', 'admin', 'operator'],
        default: 'viewer',
    },
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,  //match regex is wrong 
        match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/  
    }
}, {timestamps: true});

//pre-save hook - similar to trigger in SQL
userSchema.pre('save', async function(next){
    if(this.isModified('password')){
        this.password = await bcrypt.hash(this.password, 10);
    }
    next();
});
const User = mongoose.model('user', userSchema);
export default User;