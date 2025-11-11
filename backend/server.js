import express from 'express'
import dotenv from 'dotenv';
import { connectDB } from './src/config/connectDB.js';
import authRouter from './src/routes/authRouter.js';
import usersRouter from './src/routes/usersRouter.js'
import incidentRouter from './src/routes/incidentRouter.js';
import auditRouter from './src/routes/auditRouter.js';  // ADD THIS
import cors from 'cors'
import { verifyToken } from './src/middlewares/verifyToken.js';
import { authorizeRoles } from './src/middlewares/authorizeRoles.js';
import { auditLogger } from './src/middlewares/auditLogger.js';
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

// ADD AUDIT LOGGER MIDDLEWARE HERE
app.use(auditLogger);

// Routes
app.use("/api/auth", authRouter)
app.use("/api/users", verifyToken, authorizeRoles("admin", "operator") , usersRouter)
app.use("/api/incidents", verifyToken, incidentRouter)
app.use("/api/audit", auditRouter)  // ADD THIS LINE

//start server after DB connection
connectDB(CONNECTION_URI).then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Audit logging is enabled`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});
