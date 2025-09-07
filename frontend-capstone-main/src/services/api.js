import axios from "axios";

// Backend API base URL (Laravel). Override with REACT_APP_API_URL in .env
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// --- Interceptors ---
// Attach JWT automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // 🔥 auto redirect if unauthorized
    }
    return Promise.reject(error);
  }
);

// --- API Services ---
// Authentication (JWT)
export const authAPI = {
  login: async (credentials) => {
    const res = await api.post("/login", credentials);
    if (res.data?.token) {
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    }
    return res;
  },

  register: (userData) => api.post("/register", userData),
  changePassword: (data) => api.post("/change-password", data),

  logout: async () => {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },

  resendVerification: () => {
    const email = JSON.parse(localStorage.getItem("user"))?.email;
    return api.post("/email/resend", { email });
  },

  forgotPassword: (email) => api.post("/forgot-password", { email }),
  resetPassword: (data) => api.post("/reset-password", data),
};

// Waste logs/monitoring
export const monitoringAPI = {
  getDailyBreakdown: (params) =>
    api.get("/waste-logs/daily-breakdown", { params }),
  getWeeklySummary: () => api.get("/waste-logs/weekly-summary"),
  getMonthlySummary: (month) =>
    api.get("/waste-logs/monthly-summary", { params: { month } }),
  getTotals: () => api.get("/waste-logs/total"),
};

// Waste levels (bins)
export const wasteLevelAPI = {
  getLatestLevels: () => api.get("/waste-levels/latest"),
  storeWasteLevel: (data) => api.post("/waste-levels", data),
};

export default api;
