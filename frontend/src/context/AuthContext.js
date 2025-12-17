import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('tokenExpiresAt', Date.now() + (data.expires_in * 1000));
        return { success: true, accessToken: data.access_token };
      } else {
        // Refresh token is invalid, logout user
        logout();
        return { success: false, error: 'Session expired. Please login again.' };
      }
    } catch (error) {
      // Don't logout on network errors - let the next request handle it
      console.error('Token refresh error:', error);
      return { success: false, error: 'Failed to refresh token.' };
    }
  }, [logout]);

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  // Set up periodic token refresh separately to avoid dependency issues
  useEffect(() => {
    // Set up periodic token refresh to prevent expiration
    const refreshInterval = setInterval(async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const expiresAt = localStorage.getItem('tokenExpiresAt');

      // Only refresh if we have tokens and user is logged in
      if (accessToken && refreshToken && expiresAt) {
        // Refresh if token expires in less than 5 minutes
        const timeUntilExpiry = parseInt(expiresAt) - Date.now();
        if (timeUntilExpiry < 5 * 60 * 1000) {
          try {
            await refreshAccessToken();
            console.log('Token refreshed automatically');
          } catch (error) {
            console.error('Automatic token refresh failed:', error);
            // If refresh fails, don't clear tokens immediately - let the next request handle it
          }
        }
      } else {
        // No tokens, clear interval
        clearInterval(refreshInterval);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes

    // Cleanup on unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshAccessToken]);

  const login = useCallback(async (email, password) => {
    try {
      console.log('🔐 Attempting login to:', API_ENDPOINTS.AUTH.LOGIN);
      console.log('📧 Email:', email);
      
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response ok:', response.ok);

      // Check if response has content before trying to parse JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('📦 Response data:', data);
      } else {
        const text = await response.text();
        console.log('📦 Response text:', text);
        return { success: false, error: `Unexpected response format: ${text}` };
      }

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        localStorage.setItem('tokenExpiresAt', Date.now() + (data.expires_in * 1000));
        console.log('✅ Login successful!');
        return { success: true };
      } else {
        console.error('❌ Login failed:', data);
        return { success: false, error: data.detail || data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('🚨 Network error:', error);
      console.error('🚨 Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // More specific error messages
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { 
          success: false, 
          error: 'Cannot connect to backend. Please ensure the backend server is running on http://localhost:8000' 
        };
      }
      
      return { 
        success: false, 
        error: `Network error: ${error.message}. Please check if the backend is running on http://localhost:8000` 
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
          role: 'user',
          company: userData.company || null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // After successful registration, automatically log the user in
        const loginResponse = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: userData.email, 
            password: userData.password 
          }),
        });

        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
          // Set user data and tokens
          setUser(loginData.user);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          localStorage.setItem('accessToken', loginData.access_token);
          localStorage.setItem('refreshToken', loginData.refresh_token);
          localStorage.setItem('tokenExpiresAt', Date.now() + (loginData.expires_in * 1000));
          return { success: true, message: 'Registration successful! You are now logged in.' };
        } else {
          // Registration succeeded but auto-login failed
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
          return { success: true, message: 'Registration successful! Please log in to continue.' };
        }
      } else {
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true, message: data.message };
      } else {
        return { success: false, error: data.detail || 'Password reset request failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  }, []);

  const getValidAccessToken = useCallback(async () => {
    const accessToken = localStorage.getItem('accessToken');
    const expiresAt = localStorage.getItem('tokenExpiresAt');
    
    if (!accessToken || !expiresAt) {
      return null;
    }

    // Check if token is expired (with 30 second buffer)
    if (Date.now() > expiresAt - 30000) {
      const result = await refreshAccessToken();
      return result.success ? result.accessToken : null;
    }

    return accessToken;
  }, [refreshAccessToken]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    refreshAccessToken,
    getValidAccessToken,
  }), [user, loading, login, register, logout, forgotPassword, refreshAccessToken, getValidAccessToken]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 