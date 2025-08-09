import { API_CONFIG, HTTP_METHODS, HTTP_STATUS } from '../constants/api';
import { API_ENDPOINTS } from '../config/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = HTTP_METHODS.GET,
    body = null,
    headers = {},
    timeout = API_CONFIG.TIMEOUT,
  } = options;

  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const requestOptions = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...(body && { body: JSON.stringify(body) }),
  };

  // Add auth token if available
  const token = localStorage.getItem('accessToken');
  if (token) {
    requestOptions.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      ...requestOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.detail || `HTTP ${response.status}`,
        response.status,
        errorData
      );
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new ApiError('Request timeout', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error.message);
  }
};

export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        // Handle unauthorized - redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      case HTTP_STATUS.FORBIDDEN:
        // Handle forbidden
        console.error('Access forbidden:', error.message);
        break;
      case HTTP_STATUS.NOT_FOUND:
        // Handle not found
        console.error('Resource not found:', error.message);
        break;
      default:
        console.error('API Error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
  
  return error.message || 'An unexpected error occurred';
};

export const isNetworkError = (error) => {
  return error.status === 0 || error.message.includes('Network error');
};

export const isAuthError = (error) => {
  return error.status === HTTP_STATUS.UNAUTHORIZED || error.status === HTTP_STATUS.FORBIDDEN;
}; 

// Utility function to add authentication headers to fetch calls
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('accessToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized errors (token expired)
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        // Try to refresh the token
        const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          
          // Update the token in localStorage
          localStorage.setItem('accessToken', refreshData.access_token);
          localStorage.setItem('tokenExpiresAt', Date.now() + (refreshData.expires_in * 1000));
          
          // Retry the original request with the new token
          headers.Authorization = `Bearer ${refreshData.access_token}`;
          return fetch(url, {
            ...options,
            headers,
          });
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiresAt');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
    }
  }

  return response;
}; 