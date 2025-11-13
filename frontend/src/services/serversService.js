import api from './axiosConfig.js';

const getServers = async () => {
  const res = await api.get('/servers');
  return res.data;
};

const createServer = async (payload) => {
  const res = await api.post('/servers', payload);
  return res.data;
};

const deleteServer = async (id) => {
  const res = await api.delete(`/servers/${id}`);
  return res.data;
};

export default { getServers, createServer, deleteServer };
