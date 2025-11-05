import api from './axiosConfig.js'

const endpoint = '/incidents'

const getAllIncidents = async () => {
  try {
    const res = await api.get(endpoint)
    return res.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch incidents')
    }
    throw error
  }
}

const getIncidentById = async (id) => {
  try {
    const res = await api.get(`${endpoint}/${id}`)
    return res.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to fetch incident')
    }
    throw error
  }
}

const createIncident = async (payload) => {
  const res = await api.post(endpoint, payload)
  return res.data
}

const updateIncident = async (id, payload) => {
  try {
    const res = await api.put(`${endpoint}/${id}`, payload)
    return res.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to update incident')
    }
    throw error
  }
}

const deleteIncident = async (id) => {
  try {
    const res = await api.delete(`${endpoint}/${id}`)
    return res.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to delete incident')
    }
    throw error
  }
}

export default {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
}
