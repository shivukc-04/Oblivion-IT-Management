import Metric from '../models/metric.js';

// Function to generate random metrics (simulating real server metrics for now)
const generateRandomMetrics = () => ({
    serverId: 'main-server',  // You can make this dynamic later
    cpu: 30 + Math.round(Math.random() * 40),
    memory: 50 + Math.round(Math.random() * 30),
    disk: 70 + Math.round(Math.random() * 20)
});

export const getCurrentMetrics = async (req, res) => {
    try {
        // Generate new metrics
        const newMetrics = generateRandomMetrics();
        
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
        // Get last 20 metrics
        const metrics = await Metric.find({ serverId: 'main-server' })
            .sort({ createdAt: -1 })
            .limit(20);

        console.log('Fetched metric history, count:', metrics.length);
        res.json(metrics.reverse()); // Reverse to get chronological order
    } catch (error) {
        res.status(500).json({ message: "Error fetching metric history", error: error.message });
    }
};