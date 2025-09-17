import { API_CONFIG, HTTP_METHODS, HTTP_STATUS } from '../constants/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const apiRequest = async (url, method = 'GET', body = null, headers = {}) => {
  const token = localStorage.getItem('accessToken');
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);
    console.log("this is the response")
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const result = await response.json();
      return result;
    } else {
      return null;
    }
  } catch (error) {
    throw error;
  }
};

export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        // Handle unauthorized - redirect to login
        handleTokenExpiry();
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
  // Get a valid token (with refresh if needed)
  const token = await getValidToken();
  
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
        const refreshResponse = await fetch('http://localhost:8000/api/v1/auth/refresh', {
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
        } else {
          // Refresh token is also invalid, redirect to login
          handleTokenExpiry();
          throw new Error('Session expired. Please login again.');
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        handleTokenExpiry();
        throw new Error('Session expired. Please login again.');
      }
    } else {
      // No refresh token available, redirect to login
      handleTokenExpiry();
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
};

// Helper function to handle token expiry consistently
export const handleTokenExpiry = () => {
  // Clear all auth-related data
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('tokenExpiresAt');
  localStorage.removeItem('user');
  
  // Redirect to login page
  window.location.href = '/login';
};

// Helper function to check if token is expired or about to expire
export const isTokenExpired = () => {
  const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
  if (!tokenExpiresAt) return true;
  
  // Check if token expires in the next 30 seconds (buffer time)
  const bufferTime = 30 * 1000; // 30 seconds
  return Date.now() > (parseInt(tokenExpiresAt) - bufferTime);
};

// Helper function to get a valid token (with refresh if needed)
export const getValidToken = async () => {
  const accessToken = localStorage.getItem('accessToken');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!accessToken || !refreshToken) {
    handleTokenExpiry();
    return null;
  }
  
  // If token is expired, try to refresh it
  if (isTokenExpired()) {
    try {
      const refreshResponse = await fetch('http://localhost:8000/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        localStorage.setItem('accessToken', refreshData.access_token);
        localStorage.setItem('tokenExpiresAt', Date.now() + (refreshData.expires_in * 1000));
        return refreshData.access_token;
      } else {
        handleTokenExpiry();
        return null;
      }
    } catch (error) {
      handleTokenExpiry();
      return null;
    }
  }
  
  return accessToken;
}; 