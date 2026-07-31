import axios from 'axios';

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl && envUrl.trim() !== '') {
    // Ensure URL has /api/v1 suffix if omitted
    const cleanUrl = envUrl.trim().replace(/\/+$/, '');
    return cleanUrl.endsWith('/api/v1') ? cleanUrl : `${cleanUrl}/api/v1`;
  }
  return '/api/v1';
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale token on 401 if not logging in
      if (!error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
