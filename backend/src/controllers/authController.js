import User from '../models/user.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import nodemailer from 'nodemailer'
dotenv.config()

// Configure nodemailer transporter with Mailtrap
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
    }
});

export async function createNewUser(req, res){
    try {
            const body = req.body;
            const newUser = new User({
                userId: body.userId,
                username: body.username,
                password: body.password,
                role: body.role,
                email: body.email
            });
            await newUser.save();
            return res.status(201).json({'message': 'new User created'});
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error(error);
            }
            if (error.code === 11000){
                return res.status(409).json({'message': 'user already exists'}); 
            }
            return res.status(400).json({'message': 'user was NOT created'});
        }
} 

export async function handleUserLogin(req, res){
    try {
        const {userId, password} = req.body;
        //find vs findOne, find returns array so !user is always false
        const user = await User.findOne({userId: userId});
        if(!user){
            return res.status(404).json({'message': 'user NOT found'});
        }
        //compare plain-text password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            //401 - unauthorised
            return res.status(401).json({'message': 'username or password is wrong'});
        }
        const payload = {
          _id: user._id,
          userId: user.userId,
          username: user.username,
          role: user.role,
          email: user.email
        };
        const jwt_secret_key = process.env.JWT_SECRET_KEY;
        const jwt_token = jwt.sign(payload, jwt_secret_key,{ expiresIn: process.env.JWT_TOKEN_TTL});
        return res.status(200).json({token: jwt_token, user: payload});
    } catch (error) {
        if (process.env.NODE_ENV !== 'test') {
            console.error(error);
        }
        return res.status(500).json({'message': 'error finding the user'});
    }
}

export async function handleForgotPassword(req, res) {
    try {
        const { userId, email } = req.body;
        
        // Verify the user exists and matches the email
        const user = await User.findOne({ userId: userId, email: email });
        if (!user) {
            return res.status(404).json({ "message": "User not found or email doesn't match" });
        }

        // Find all admin users
        const adminUsers = await User.find({ role: "admin" });
        if (!adminUsers || adminUsers.length === 0) {
            return res.status(500).json({ "message": "No admin users found in the system" });
        }

        // Prepare email content
        const mailOptions = {
            from: "noreply@oblivion-itim.com",
            to: adminUsers.map(admin => admin.email).join(','),
            subject: 'Password Reset Request',
            text: `A password reset has been requested for:
            User ID: ${userId}
            Username: ${user.username}
            Email: ${email}
            
            Please contact the user at ${email} to assist with their password reset request.
            
            This email was sent automatically by the system. Do not reply to this email.`
        };

        // Send email
        await transporter.sendMail(mailOptions);

        return res.status(200).json({ 
            "message": "Password reset request has been sent to administrators" 
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({ 
            "message": "Error processing forgot password request" 
        });
    }
}



