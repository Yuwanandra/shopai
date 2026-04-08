import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout:         15000,
});

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopai_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Session ID for anonymous recommendation tracking
  let sessionId = sessionStorage.getItem('shopai_session');
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('shopai_session', sessionId);
  }
  config.headers['x-session-id'] = sessionId;
  return config;
});

// Auto-refresh / logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('shopai_token');
      localStorage.removeItem('shopai_user');
      // Redirect to login if on protected page
      if (window.location.pathname.startsWith('/account') ||
          window.location.pathname.startsWith('/admin')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
