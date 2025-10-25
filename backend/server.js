import express from 'express'
import dotenv from 'dotenv';
import { connectDB } from './src/config/connectDB.js';
import authRouter from './src/routes/authRouter.js';
import usersRouter from './src/routes/usersRouter.js'
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5250;
const CONNECTION_URI = process.env.CONNECTION_URI;

//middlewares
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use("/api/auth", authRouter)
app.use("/api/users", usersRouter)
//start server after DB connection
connectDB(CONNECTION_URI).then(() => {
    // createFirstAdmin()
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});