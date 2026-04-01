import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden');
    }
    
    if (error.response?.status === 404) {
      console.error('Resource not found');
    }
    
    if (error.response?.status >= 500) {
      console.error('Server error');
    }
    
    return Promise.reject(error);
  }
);

// Export API methods
export const analyticsAPI = {
  // Dashboard overview
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  
  // Adherence analytics
  getAdherence: (params) => api.get('/analytics/adherence', { params }),
  
  // Consumption trends
  getTrends: (params) => api.get('/analytics/trends', { params }),
  
  // Side effects analytics
  getSideEffects: (params) => api.get('/analytics/side-effects', { params }),
  
  // Comparison analytics
  getComparison: (params) => api.get('/analytics/comparison', { params }),
  
  // Predictive insights
  getInsights: () => api.get('/analytics/insights'),
  
  // Export analytics
  exportData: (params) => api.get('/analytics/export', { 
    params,
    responseType: 'blob' // Important for file download
  }),
};

// Generic API methods
export default api;