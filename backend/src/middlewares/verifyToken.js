import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config()
export function verifyToken(req, res, next){
    const authHeader = req.headers["authorization"]
    //get the token is authHeader exists
    const token = authHeader && authHeader.split(" ")[1]
    if(!token){
        return res.status(401).json({message: "no token found"})
    }
    try{
        //decode the info inside the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY)
        //add the info to the req
        req.user = decoded
        next()
    }catch(error){
        console.error(error)
        return res.status(403).json({"message": "Invalid or expired token"})
    }
}