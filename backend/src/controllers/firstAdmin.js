import User from "../models/user.js"
export async function createFirstAdmin() {
    try {
        const newUser = new User({
            userId: "ADMIN001@PES",
            username: "Adminesh",
            password: "admin123",
            role: "admin",
            email: "admin123@gmail.com"
        })
        await newUser.save()
        console.log("Admin was created Succesfully")
    } catch (error) {
        console.error(error)
    }
}