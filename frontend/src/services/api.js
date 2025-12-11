import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// No auth interceptors needed - user provides token directly

// API endpoints (stateless - no jobs, just scan and return)
export const scanAPI = {
  scan: (data) => api.post('/api/scan', data),  // Scan and return results immediately
}

export const duplicatesAPI = {
  getAll: (params) => api.get('/api/duplicates', { params }),
  getById: (groupId) => api.get(`/api/duplicates/${groupId}`),
  approve: (groupId, data) => api.post(`/api/duplicates/${groupId}/approve`, data),
  reject: (groupId, reason) => api.post(`/api/duplicates/${groupId}/reject`, { reason }),
  deleteFiles: (data) => api.post('/api/approve', data),  // Delete files via approve endpoint
}

export const metricsAPI = {
  get: () => api.get('/api/metrics'),
}

export default api

