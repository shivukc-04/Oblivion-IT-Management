import Metric from '../models/metric.js';
import { sendAlertEmail } from '../utils/sendAlertEmail.js'


// List of servers to monitor
const SERVERS = ['server-1', 'server-2', 'server-3'];

// Function to generate random metrics for a specific server
const generateRandomMetrics = (serverId) => ({
    serverId: serverId || 'server-1',
    cpu: 30 + Math.round(Math.random() * 40),
    memory: 50 + Math.round(Math.random() * 30),
    disk: 70 + Math.round(Math.random() * 20)
});

export const getCurrentMetrics = async (req, res) => {
    try {
        const { serverId } = req.query;
        // If serverId provided, get current for that server; else get for all servers
        const serverIds = serverId ? [serverId] : SERVERS;
        
        const metricsArray = [];
        
        for (const id of serverIds) {
            const newMetrics = generateRandomMetrics(id);
            
            // ALERT LOGIC: Check thresholds and send alerts if needed
            if (newMetrics.cpu >= 100 || newMetrics.memory >= 100 || newMetrics.disk >= 100) {
                await sendAlertEmail("SERIOUS", newMetrics);
            } else if (newMetrics.cpu > 95 || newMetrics.memory > 95 || newMetrics.disk > 95) {
                await sendAlertEmail("WARNING", newMetrics);
            }
            
            // Save to database
            const metric = new Metric(newMetrics);
            await metric.save();
            metricsArray.push(newMetrics);
        }
        
        console.log('Current metrics generated and saved:', metricsArray);
        // Return array if multiple, object if single
        res.json(serverIds.length === 1 ? metricsArray[0] : metricsArray);
    } catch (error) {
        res.status(500).json({ message: "Error fetching metrics", error: error.message });
    }
};


export const getMetricHistory = async (req, res) => {
    try {
        const { serverId } = req.query;
        // If serverId provided, get history for that server; else get for all servers
        const serverIds = serverId ? [serverId] : SERVERS;
        
        const historyMap = {};
        
        for (const id of serverIds) {
            const metrics = await Metric.find({ serverId: id })
                .sort({ createdAt: -1 })
                .limit(20);
            historyMap[id] = metrics.reverse(); // Reverse to get chronological order
        }
        
        console.log('Fetched metric history for servers:', serverIds);
        // Return map if multiple, array if single
        res.json(serverIds.length === 1 ? historyMap[serverIds[0]] : historyMap);
    } catch (error) {
        res.status(500).json({ message: "Error fetching metric history", error: error.message });
    }
};