import axios from 'axios';

// Create axios instance with base URL
const axiosInstance = axios.create({
  baseURL: 'http://localhost:4000/api',

  timeout: 10000,
});

// Request Interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // Add Authorization header if token exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add content-type header
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';

    console.log('📤 Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    // Handle specific status codes
    if (status === 401) {
      // Unauthorized - clear token and redirect to login
      console.warn('⚠️ Unauthorized (401) - Clearing token and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      return Promise.reject(error);
    }

    if (status === 403) {
      // Forbidden
      console.warn('⚠️ Access Forbidden (403)');
      return Promise.reject(error);
    }

    if (status === 404) {
      // Not Found
      console.warn('⚠️ Resource Not Found (404)');
      return Promise.reject(error);
    }

    if (status === 500) {
      // Server Error
      console.error('❌ Server Error (500):', message);
      return Promise.reject(error);
    }

    console.error('❌ Response Error:', status, message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
