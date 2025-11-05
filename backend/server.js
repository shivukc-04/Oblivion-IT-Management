import express from 'express'
import dotenv from 'dotenv';
import { connectDB } from './src/config/connectDB.js';
import authRouter from './src/routes/authRouter.js';
import usersRouter from './src/routes/usersRouter.js'
import incidentRouter from './src/routes/incidentRouter.js';
import cors from 'cors'
import { verifyToken } from './src/middlewares/verifyToken.js';
import { authorizeRoles } from './src/middlewares/authorizeRoles.js';
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['CONNECTION_URI', 'JWT_SECRET_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars);
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5250;
const CONNECTION_URI = process.env.CONNECTION_URI;

//middlewares
app.use(cors({origin: "http://localhost:5173"}))
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use("/api/auth", authRouter)
app.use("/api/users", verifyToken, authorizeRoles("admin"), usersRouter)
app.use("/api/incidents", verifyToken, incidentRouter)

//start server after DB connection
connectDB(CONNECTION_URI).then(() => {
    // createFirstAdmin()
    // console.log("First Admin Created")
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});