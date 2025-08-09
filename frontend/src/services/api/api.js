import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResponse = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
            refresh_token: refreshToken
          });
          
          if (refreshResponse.data.access_token) {
            // Update the token in localStorage
            localStorage.setItem('accessToken', refreshResponse.data.access_token);
            localStorage.setItem('tokenExpiresAt', Date.now() + (refreshResponse.data.expires_in * 1000));
            
            // Retry the original request with the new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiresAt');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Resume Analysis API removed - functionality moved to resume bank

// Dashboard API
export const dashboardAPI = {
  // Get dashboard overview
  getOverview: async () => {
    const response = await api.get('/api/v1/dashboard/overview');
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/v1/dashboard/statistics');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

export default api; 