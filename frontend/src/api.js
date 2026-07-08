import axios from 'axios';

// All calls go through the Vite proxy to the Express backend at /api.
const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('ipow_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export default api;
