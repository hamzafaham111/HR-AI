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
      console.log('Starting registration process...');
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
      console.log('Registration response:', response.status, data);

      if (response.ok) {
        console.log('Registration successful, attempting auto-login...');
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
        console.log('Auto-login response:', loginResponse.status, loginData);

        if (loginResponse.ok) {
          // Set user data and tokens
          setUser(loginData.user);
          localStorage.setItem('user', JSON.stringify(loginData.user));
          localStorage.setItem('accessToken', loginData.access_token);
          localStorage.setItem('refreshToken', loginData.refresh_token);
          localStorage.setItem('tokenExpiresAt', Date.now() + (loginData.expires_in * 1000));
          console.log('Auto-login successful, tokens stored');
          return { success: true, message: 'Registration successful! You are now logged in.' };
        } else {
          // Registration succeeded but auto-login failed
          console.log('Auto-login failed, user needs to login manually');
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
          return { success: true, message: 'Registration successful! Please log in to continue.' };
        }
      } else {
        console.log('Registration failed:', data.detail);
        return { success: false, error: data.detail || 'Registration failed' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Network error. Please try again.' };
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