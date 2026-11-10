import axios from 'axios';

const getApiBaseUrl = (): string => {
  // Si estamos en producción (o cualquier dominio/IP remota que no sea localhost)
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1') {
      return '/api/v1';
    }
  }
  // En desarrollo local (localhost:5173)
  return import.meta.env.VITE_API_URL || 'http://localhost:8001/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('sac_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sac_token');
      localStorage.removeItem('sac_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
