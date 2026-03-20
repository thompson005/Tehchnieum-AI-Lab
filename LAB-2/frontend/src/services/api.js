import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
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

export const authAPI = {
  login: (username, password) =>
    api.post('/api/auth/login', new URLSearchParams({ username, password }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  getCurrentUser: () => api.get('/api/auth/me'),
};

export const accountsAPI = {
  getAccounts: () => api.get('/api/accounts'),
  getBalance: (accountNumber) => api.get(`/api/accounts/${accountNumber}/balance`),
};

export const transactionsAPI = {
  getTransactions: (limit = 10) => api.get(`/api/transactions?limit=${limit}`),
  smartTransfer: (message) => api.post('/api/transactions/transfer', { message }),
  analyzeTransactions: (limit = 5) => api.post('/api/transactions/analyze', { limit }),
};

export const chatAPI = {
  sendMessage: (message, sessionId = null) =>
    api.post('/api/chat/support', sessionId ? { message, session_id: sessionId } : { message }),
  getHistory: (sessionId) => api.get(`/api/chat/history/${sessionId}`),
};

export const loansAPI = {
  applyForLoan: (formData) => api.post('/api/loans/apply', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export default api;
