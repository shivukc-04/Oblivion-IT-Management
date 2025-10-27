import User from '../models/user.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()

export async function createNewUser(req, res){
    try {
            const body = req.body
            const newUser = new User({
                userId: body.userId,
                username: body.username,
                password: body.password,
                role: body.role,
                email: body.email
            })
            await newUser.save()
            return res.status(201).json({"message": "new User created"})
        } catch (error) {
            console.error(error)
            if (error.code === 11000){
                return res.status(409).json({"message": "user already exists"}) 
            }
            return res.status(400).json({"message": "user was NOT created"})
        }
} 

export async function handleUserLogin(req, res){
    try {
        const {userId, password} = req.body
        //find vs findOne, find returns array so !user is always false
        const user = await User.findOne({userId: userId})
        if(!user){
            return res.status(404).json({"message": "user NOT found"})
        }
        //compare plain-text password with hashed password
        console.log(userId, password)
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch){
            //401 - unauthorised
            return res.status(401).json({"message": "username or password is wrong"})
        }
        const payload = {userId: user.userId, role: user.role, email: user.email}
        const jwt_secret_key = process.env.JWT_SECRET_KEY
        const jwt_token = jwt.sign(payload, jwt_secret_key,{ expiresIn: process.env.JWT_TOKEN_TTL})
        return res.status(200).json({token: jwt_token, user: payload})
    } catch (error) {
        console.error(error)
        return res.status(500).json({"message": "error finding the user"})
    }
}