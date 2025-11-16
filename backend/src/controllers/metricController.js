import Metric from '../models/metric.js';
import Server from '../models/server.js';
import { sendAlertEmail } from '../utils/sendAlertEmail.js'

// Helper: generate random metrics for a given serverId
const generateRandomMetricsForServer = (serverId) => ({
    serverId,
    cpu: 30 + Math.round(Math.random() * 40),
    memory: 50 + Math.round(Math.random() * 30),
    disk: 70 + Math.round(Math.random() * 20)
});

// const generateRandomMetrics = () => ({
//     serverId: 'main-server',
//     cpu: 100,      
//     memory: 96,
//     disk: 95
// });

export const getCurrentMetrics = async (req, res) => {
    try {
        // Pick a random active server from DB (if none, fallback to main-server)
        const activeServers = await Server.find({ status: 'active' }).limit(50);
        let selectedServerId = 'main-server';
        if (activeServers && activeServers.length > 0) {
            const chosen = activeServers[Math.floor(Math.random() * activeServers.length)];
            selectedServerId = chosen.serverId;
        }

        // Generate new metrics
        const newMetrics = generateRandomMetricsForServer(selectedServerId);

        // ALERT LOGIC: Check thresholds and send alerts if needed
        if (newMetrics.cpu >= 100 || newMetrics.memory >= 100 || newMetrics.disk >= 100) {
            await sendAlertEmail("SERIOUS", newMetrics);
        } else if (newMetrics.cpu > 95 || newMetrics.memory > 95 || newMetrics.disk > 95) {
            await sendAlertEmail("WARNING", newMetrics);
        }

        // Save to database
        const metric = new Metric(newMetrics);
        await metric.save();

        console.log('Current metrics generated and saved:', newMetrics);
        res.json(newMetrics);
    } catch (error) {
        res.status(500).json({ message: "Error fetching metrics", error: error.message });
    }
};


export const getMetricHistory = async (req, res) => {
    try {
        // Allow client to request history for a specific serverId via query param
        const serverId = req.query.serverId || 'main-server';
        // Get last 20 metrics for the requested server
        const metrics = await Metric.find({ serverId })
            .sort({ createdAt: -1 })
            .limit(20);

        console.log(`Fetched metric history for ${serverId}, count:`, metrics.length);
        res.json(metrics.reverse()); // Reverse to get chronological order
    } catch (error) {
        res.status(500).json({ message: "Error fetching metric history", error: error.message });
    }
};
export const getAllMetricHistory = async (req, res) => {
    try {
        // Allow client to request history for a specific serverId via query param
        const serverId = req.query.serverId || 'main-server';
        // Get last 160 metrics for the requested server
        const metrics = await Metric.find({ serverId })
            .sort({ createdAt: -1 })
            .limit(160);

        console.log(`Fetched metric history for ${serverId}, count:`, metrics.length);
        res.json(metrics.reverse()); // Reverse to get chronological order
    } catch (error) {
        res.status(500).json({ message: "Error fetching metric history", error: error.message });
    }
};