import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add API key to requests if available
apiClient.interceptors.request.use((config) => {
  const apiKey = localStorage.getItem('apiKey')
  if (apiKey) {
    config.headers['X-API-Key'] = apiKey
  }
  return config
})

// Events API
export const eventsAPI = {
  getAll: () => apiClient.get('/api/events'),
  getById: (id) => apiClient.get(`/api/events/${id}`),
  getByCharacter: (name) => apiClient.get(`/api/events/character/${name}`),
  create: (event) => apiClient.post('/api/events', event),
  update: (id, event) => apiClient.put(`/api/events/${id}`, event),
  delete: (id) => apiClient.delete(`/api/events/${id}`),
  getHistory: (id) => apiClient.get(`/api/events/${id}/history`),
  revert: (id, version) => apiClient.post(`/api/events/${id}/revert/${version}`),
}

// Characters API
export const charactersAPI = {
  getAll: () => apiClient.get('/api/characters'),
  getById: (id) => apiClient.get(`/api/characters/${id}`),
  search: (query) => apiClient.get(`/api/characters/search/${query}`),
  getAliveAtDate: (date) => apiClient.get(`/api/characters/alive-at/${date}`),
  create: (character) => apiClient.post('/api/characters', character),
  update: (id, character) => apiClient.put(`/api/characters/${id}`, character),
  delete: (id) => apiClient.delete(`/api/characters/${id}`),
}

// Arcs API
export const arcsAPI = {
  getAll: () => apiClient.get('/api/arcs'),
  getById: (id) => apiClient.get(`/api/arcs/${id}`),
  getBySagaId: (sagaId) => apiClient.get(`/api/arcs/saga/${sagaId}`),
  create: (arc) => apiClient.post('/api/arcs', arc),
  update: (id, arc) => apiClient.put(`/api/arcs/${id}`, arc),
  delete: (id) => apiClient.delete(`/api/arcs/${id}`),
}

// Sagas API
export const sagasAPI = {
  getAll: () => apiClient.get('/api/sagas'),
  getById: (id) => apiClient.get(`/api/sagas/${id}`),
  create: (saga) => apiClient.post('/api/sagas', saga),
  update: (id, saga) => apiClient.put(`/api/sagas/${id}`, saga),
  delete: (id) => apiClient.delete(`/api/sagas/${id}`),
}

// Users API
export const usersAPI = {
  getMe: () => apiClient.get('/api/users/me'),
  getAll: () => apiClient.get('/api/users'),
  create: (username, role) => apiClient.post('/api/users', { username, role }),
  updateRole: (id, role) => apiClient.put(`/api/users/${id}/role`, { role }),
  deactivate: (id) => apiClient.delete(`/api/users/${id}`),
}

export default apiClient
