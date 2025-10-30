import mongoose from "mongoose";
export async function connectDB(CONNECTION_URI){
    try {
        await mongoose.connect(CONNECTION_URI);
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}