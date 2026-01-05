import axios from 'axios';

// En desarrollo usa el proxy de React, en produccion usa variable de entorno
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Copilot API
export const copilotAPI = {
  chat: (message, conversationId = null) =>
    api.post('/copilot/chat', { message, conversation_id: conversationId }),
  getConversations: () => api.get('/copilot/conversations'),
  getConversation: (id) => api.get(`/copilot/conversations/${id}`),
  deleteConversation: (id) => api.delete(`/copilot/conversations/${id}`),
  generateMessage: (clientId, messageType) =>
    api.post('/copilot/generate-message', { client_id: clientId, message_type: messageType }),
  analyzeOpportunity: (clientId) =>
    api.post('/copilot/analyze-opportunity', { client_id: clientId }),
};

// Clients API
export const clientsAPI = {
  getAll: (status = null) => api.get('/clients', { params: { status } }),
  get: (id) => api.get(`/clients/${id}`),
  create: (data) => api.post('/clients', data),
  update: (id, data) => api.put(`/clients/${id}`, data),
  delete: (id) => api.delete(`/clients/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
};

export default api;
