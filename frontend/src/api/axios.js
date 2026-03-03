import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    // Handle network errors (no response from server)
    if (!err.response) {
      console.error('Network error:', err.message);
      // Don't show toast here - let individual components handle it
      return Promise.reject(err);
    }

    const { status, data } = err.response;
    const errorMessage = data?.error?.message || data?.message;

    // Handle 401 Unauthorized - Try to refresh token or redirect to login
    if (status === 401 && !err.config._retry) {
      err.config._retry = true;
      const refresh = localStorage.getItem('refreshToken');
      
      if (refresh) {
        try {
          const { data } = await axios.post(baseURL + '/auth/refresh-token', { refreshToken: refresh });
          localStorage.setItem('token', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(err.config);
        } catch (refreshError) {
          // Refresh failed - clear storage and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // Handle 403 Forbidden - Permission denied
    if (status === 403) {
      console.error('Permission denied:', errorMessage);
      // Error message will be shown by individual components
    }

    // Handle 404 Not Found
    if (status === 404) {
      console.error('Resource not found:', errorMessage);
      // Error message will be shown by individual components
    }

    // Handle 500 Server Error
    if (status === 500) {
      console.error('Server error:', errorMessage);
      // Error message will be shown by individual components
    }

    return Promise.reject(err);
  }
);

export default api;
