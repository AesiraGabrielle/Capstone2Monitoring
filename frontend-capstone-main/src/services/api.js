import axios from 'axios';

// Backend API base URL (Laravel). Override with REACT_APP_API_URL in .env
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Authentication (JWT)
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  changePassword: (data) => api.post('/change-password', data),
  logout: () => api.post('/logout'),
  resendVerification: () => api.post('/email/resend'),
  forgotPassword: (email) => api.post('/forgot-password', { email }),
  resetPassword: (data) => api.post('/reset-password', data),
};

// Waste logs/monitoring
export const monitoringAPI = {
  getDailyBreakdown: (params) => api.get('/waste-logs/daily-breakdown', { params }),
  getWeeklySummary: () => api.get('/waste-logs/weekly-summary'),
  getMonthlySummary: (month) => api.get('/waste-logs/monthly-summary', { params: { month } }),
  getTotals: () => api.get('/waste-logs/total'),
};

// Waste levels (bins)
export const wasteLevelAPI = {
  getLatestLevels: () => api.get('/waste-levels/latest'),
  storeWasteLevel: (data) => api.post('/waste-levels', data),
};

// Attach JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by clearing token
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  }
);

export default api;