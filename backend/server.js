import express from 'express'
import dotenv from 'dotenv';
import { connectDB } from './src/config/connectDB.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5250;
const CONNECTION_URI = process.env.CONNECTION_URI;

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

//start server after DB connection
connectDB(CONNECTION_URI).then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) => {
    console.error("Failed to connect to the database:", error);
});