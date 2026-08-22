const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

import axios from 'axios';

// Create a pre-configured Axios instance
const api = axios.create({
  baseURL: `${VITE_API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic interceptor injecting the user's JWT from LocalStorage
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

// Response interceptor to intercept globally e.g. handle 401s (token expirations)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Token has expired or is invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Prevent browser redirect loops in non-browser envs
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
