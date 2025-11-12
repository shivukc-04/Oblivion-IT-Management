// src/utils/sendAlertEmail.js
import User from '../models/user.js'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
dotenv.config()

// Mailtrap transporter (reuse your existing config)
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASSWORD
    }
});

// Helper to send alert/warning email to all admins
export async function sendAlertEmail(type, metricObj) {
    // Find all admins
    const adminUsers = await User.find({ role: "admin" });
    if (!adminUsers || adminUsers.length === 0) return; // No admins, abort

    const { cpu, memory, disk } = metricObj;
    let subject = `[${type}] Server Metric Alert`;
    let levelText = type === "SERIOUS" ? "Serious Alert" : "Warning";
    let message = `${levelText}: One or more server metrics exceeded the threshold.

CPU: ${cpu}%
Memory: ${memory}%
Disk: ${disk}%

Please check the server health.`;

    // Send email
    const mailOptions = {
        from: "alerts@oblivion-itim.com",
        to: adminUsers.map(admin => admin.email).join(','),
        subject,
        text: message,
    };

    await transporter.sendMail(mailOptions);
}
