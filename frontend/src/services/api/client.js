/**
 * Unified API Client
 * 
 * This is the single source of truth for all API requests.
 * It handles authentication, token refresh, error handling, and request/response transformation.
 */

import { API_ENDPOINTS, API_URL, HTTP_STATUS } from '../../config/api';

class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor(baseURL = API_URL) {
    this.baseURL = baseURL;
    this.interceptors = {
      request: [],
      response: []
    };
  }

  /**
   * Add a request interceptor
   */
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  /**
   * Add a response interceptor
   */
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  /**
   * Get a valid access token (with automatic refresh if needed)
   */
  async getValidToken() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!accessToken || !refreshToken) {
        return null;
      }
      
      // Check if token is expired
      const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
      if (tokenExpiresAt) {
        const bufferTime = 30 * 1000; // 30 seconds
        const isExpired = Date.now() > (parseInt(tokenExpiresAt) - bufferTime);
        
        if (isExpired) {
          // Try to refresh the token
          try {
            const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
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
              return null;
            }
          } catch (error) {
            console.error('Token refresh error:', error);
            return null;
          }
        }
      }
      
      return accessToken;
    } catch (error) {
      console.error('Error getting valid token:', error);
      return null;
    }
  }

  /**
   * Handle token expiry - clear storage and redirect
   */
  handleTokenExpiry() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  /**
   * Build request headers
   */
  async buildHeaders(customHeaders = {}, body) {
    const headers = { ...customHeaders };

    // Set Content-Type only if not FormData and not already set
    if (!(body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Add authentication token
    const token = await this.getValidToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    } else if (!localStorage.getItem('refreshToken')) {
      // No token and no refresh token - might be a public endpoint
      // Don't throw here, let the request proceed
    }

    return headers;
  }

  /**
   * Transform error to ApiError
   */
  transformError(error, response = null) {
    if (error instanceof ApiError) {
      return error;
    }

    if (response) {
      return new ApiError(
        error.message || `HTTP error! status: ${response.status}`,
        response.status,
        error.data
      );
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new ApiError(
        'Network error: Could not connect to server. Please check your connection and ensure the backend is running.',
        0,
        null
      );
    }

    return new ApiError(error.message || 'An unexpected error occurred', 0, null);
  }

  /**
   * Main request method
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers: customHeaders = {},
      skipAuth = false,
      ...restOptions
    } = options;

    try {
      // Build full URL
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;

      // Build headers
      let headers;
      if (skipAuth) {
        // For public endpoints, still need to set Content-Type for JSON
        headers = { ...customHeaders };
        if (!(body instanceof FormData) && !headers['Content-Type'] && body) {
          headers['Content-Type'] = 'application/json';
        }
      } else {
        headers = await this.buildHeaders(customHeaders, body);
      }

      // Apply request interceptors
      let requestConfig = {
        method,
        headers,
        ...restOptions
      };

      if (body) {
        if (body instanceof FormData) {
          requestConfig.body = body;
        } else {
          requestConfig.body = JSON.stringify(body);
        }
      }

      for (const interceptor of this.interceptors.request) {
        requestConfig = await interceptor(requestConfig);
      }

      // Make the request
      let response;
      try {
        response = await fetch(url, requestConfig);
      } catch (networkError) {
        throw this.transformError(networkError);
      }

      // Handle 401 Unauthorized (token expired)
      if (response.status === HTTP_STATUS.UNAUTHORIZED && !skipAuth) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
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
              
              // Retry the original request with new token
              const retryHeaders = await this.buildHeaders(customHeaders, body);
              retryHeaders.Authorization = `Bearer ${refreshData.access_token}`;
              
              const retryConfig = {
                method,
                headers: retryHeaders,
                ...restOptions
              };

              if (body) {
                if (body instanceof FormData) {
                  retryConfig.body = body;
                } else {
                  retryConfig.body = JSON.stringify(body);
                }
              }

              try {
                response = await fetch(url, retryConfig);
              } catch (retryError) {
                throw this.transformError(retryError);
              }
            } else {
              this.handleTokenExpiry();
              throw new ApiError('Session expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);
            }
          } catch (refreshError) {
            if (refreshError instanceof ApiError) {
              throw refreshError;
            }
            if (refreshError.name === 'TypeError' && refreshError.message.includes('fetch')) {
              throw this.transformError(refreshError);
            }
            this.handleTokenExpiry();
            throw new ApiError('Session expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);
          }
        } else {
          this.handleTokenExpiry();
          throw new ApiError('Session expired. Please login again.', HTTP_STATUS.UNAUTHORIZED);
        }
      }

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.interceptors.response) {
        processedResponse = await interceptor(processedResponse);
      }

      // Handle error responses
      if (!processedResponse.ok) {
        let errorData = null;
        try {
          const contentType = processedResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            errorData = await processedResponse.json();
          } else {
            errorData = await processedResponse.text();
          }
        } catch (e) {
          // Ignore parsing errors
        }

        const error = new ApiError(
          errorData?.detail || errorData?.message || `HTTP error! status: ${processedResponse.status}`,
          processedResponse.status,
          errorData
        );
        throw error;
      }

      // Parse response
      const contentType = processedResponse.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await processedResponse.json();
      } else {
        return await processedResponse.text();
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw this.transformError(error);
    }
  }

  /**
   * Convenience methods
   */
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  async put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  async patch(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PATCH', body });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiClient, ApiError };

