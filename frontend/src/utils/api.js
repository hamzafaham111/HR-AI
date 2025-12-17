/**
 * API Utility Functions
 * 
 * This file contains utility functions for API operations.
 * For actual API calls, use the services/api modules.
 */

import { HTTP_STATUS } from '../config/api';

/**
 * ApiError class for consistent error handling
 * @deprecated Use ApiError from '../services/api/client' instead
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Handle API errors consistently
 * @deprecated Use error handling from apiClient instead
 */
export const handleApiError = (error) => {
  if (error instanceof ApiError) {
    switch (error.status) {
      case HTTP_STATUS.UNAUTHORIZED:
        handleTokenExpiry();
        break;
      case HTTP_STATUS.FORBIDDEN:
        console.error('Access forbidden:', error.message);
        break;
      case HTTP_STATUS.NOT_FOUND:
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

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return error.status === 0 || error.message.includes('Network error');
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
  return error.status === HTTP_STATUS.UNAUTHORIZED || error.status === HTTP_STATUS.FORBIDDEN;
};

/**
 * Authenticated fetch utility
 * @deprecated Use apiClient from '../services/api/client' instead
 * This is kept for backward compatibility during migration
 */
export const authenticatedFetch = async (url, options = {}) => {
  // Import apiClient dynamically to avoid circular dependencies
  const { default: apiClient } = await import('../services/api/client');
  
  // Use apiClient's request method but return Response object for backward compatibility
  try {
    const token = await apiClient.getValidToken();
    const headers = await apiClient.buildHeaders(options.headers || {}, options.body);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    // Handle 401 and token refresh (similar to apiClient)
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { API_ENDPOINTS } = await import('../config/api');
          const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            localStorage.setItem('accessToken', refreshData.access_token);
            localStorage.setItem('tokenExpiresAt', Date.now() + (refreshData.expires_in * 1000));
            
            headers.Authorization = `Bearer ${refreshData.access_token}`;
            return await fetch(url, { ...options, headers });
          }
        } catch (e) {
          // Fall through to handle token expiry
        }
      }
      apiClient.handleTokenExpiry();
      throw new Error('Session expired. Please login again.');
    }
    
    return response;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error: Could not connect to server. Please check your connection and ensure the backend is running.');
    }
    throw error;
  }
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

/**
 * Get a valid token (with refresh if needed)
 * @deprecated Use apiClient.getValidToken() instead
 */
export const getValidToken = async () => {
  const { default: apiClient } = await import('../services/api/client');
  return apiClient.getValidToken();
}; 