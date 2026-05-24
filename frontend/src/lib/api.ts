import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      // Signal the app that the session expired so the Shell can show a toast
      // before redirecting. A custom event keeps the Axios layer decoupled from
      // React's hook system.
      window.dispatchEvent(new CustomEvent('session:expired'));
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;