import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  // In local dev, use Vite proxy via "/api" to avoid CORS/network issues.
  baseURL: configuredBaseUrl && configuredBaseUrl.trim() ? configuredBaseUrl : '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
