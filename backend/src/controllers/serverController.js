import Server from '../models/server.js';

// Create a new server (admin only)
export const createServer = async (req, res) => {
  try {
    const { serverId, ip, status } = req.body;
    if (!serverId || !ip) {
      return res.status(400).json({ message: 'serverId and ip are required' });
    }

    const exists = await Server.findOne({ $or: [{ serverId }, { ip }] });
    if (exists) {
      return res.status(409).json({ message: 'Server with same id or ip already exists' });
    }

    const addedBy = req.user?.userId || req.user?.email || 'unknown';
    const server = new Server({ serverId, ip, status: status || 'active', addedBy });
    await server.save();
    res.status(201).json(server);
  } catch (error) {
    res.status(500).json({ message: 'Error creating server', error: error.message });
  }
};

// Delete a server by id (admin only)
export const deleteServer = async (req, res) => {
  try {
    const { id } = req.params;
    const server = await Server.findByIdAndDelete(id);
    if (!server) return res.status(404).json({ message: 'Server not found' });
    res.json({ message: 'Server deleted', server });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting server', error: error.message });
  }
};

// List all servers
export const listServers = async (req, res) => {
  try {
    const servers = await Server.find().sort({ createdAt: -1 });
    res.json(servers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching servers', error: error.message });
  }
};
