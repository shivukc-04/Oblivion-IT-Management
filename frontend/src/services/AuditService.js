import api from './axiosConfig.js';

const auditService = {
  // Get all audit logs with optional filters
  getAllLogs: async (params = {}) => {
    try {
      const response = await api.get('/audit/logs', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get logs for specific user
  getUserLogs: async (userId, limit = 50) => {
    try {
      const response = await api.get(`/audit/user/${userId}`, {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get audit statistics
  getStats: async () => {
    try {
      const response = await api.get('/audit/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default auditService;
