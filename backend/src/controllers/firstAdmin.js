import User from "../models/user.js"
import bcrypt from 'bcrypt'
export async function createFirstAdmin() {
    try {
        const hashedPassword = await bcrypt.hash("admin123", 10);
        const newUser = new User({
            userId: "ADMIN001@PES",
            username: "Adminesh",
            password: hashedPassword,
            role: "admin",
            email: "admin123@gmail.com"
        })
        await newUser.save()
        console.log("Admin was created Succesfully")
    } catch (error) {
        console.error(error)
    }
}