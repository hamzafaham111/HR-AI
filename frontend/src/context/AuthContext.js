import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    // Check if user is logged in on app start
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('accessToken', data.access_token);
        localStorage.setItem('refreshToken', data.refresh_token);
        localStorage.setItem('tokenExpiresAt', Date.now() + (data.expires_in * 1000));
        return { success: true };
      } else {
        return { success: false, error: data.detail || 'Login failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful, try to auto-login
        try {
          const loginResponse = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: userData.email,
              password: userData.password,
            }),
          });

          const loginData = await loginResponse.json();

          if (loginResponse.ok && loginData.access_token) {
            // Store tokens and user data
            localStorage.setItem('accessToken', loginData.access_token);
            localStorage.setItem('refreshToken', loginData.refresh_token);
            localStorage.setItem('tokenExpiresAt', Date.now() + (loginData.expires_in * 1000));
            localStorage.setItem('user', JSON.stringify(loginData.user));
            
            setUser(loginData.user);
            setToken(loginData.access_token);
            setAuthenticated(true);
            navigate('/dashboard');
          } else {
            // Auto-login failed, user needs to login manually
            setMessage('Registration successful! Please log in.');
            navigate('/login');
          }
        } catch (loginError) {
          // Auto-login failed, user needs to login manually
          setMessage('Registration successful! Please log in.');
          navigate('/login');
        }
      } else {
        setError(data.detail || 'Registration failed');
      }
    } catch (error) {
      setError('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiresAt');
  };

  const forgotPassword = async (email) => {
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
  };

  const refreshAccessToken = async () => {
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
      logout();
      return { success: false, error: 'Failed to refresh token.' };
    }
  };

  const getValidAccessToken = async () => {
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
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    forgotPassword,
    refreshAccessToken,
    getValidAccessToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 