/**
 * Authentication API Service
 * 
 * All authentication-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const authAPI = {
  /**
   * Login
   */
  login: async (email, password) => {
    return apiClient.post(API_ENDPOINTS.AUTH.LOGIN, { email, password }, { skipAuth: true });
  },

  /**
   * Register
   */
  register: async (userData) => {
    return apiClient.post(API_ENDPOINTS.AUTH.REGISTER, userData, { skipAuth: true });
  },

  /**
   * Refresh token
   */
  refreshToken: async (refreshToken) => {
    return apiClient.post(
      API_ENDPOINTS.AUTH.REFRESH,
      { refresh_token: refreshToken },
      { skipAuth: true }
    );
  },

  /**
   * Get current user
   */
  getCurrentUser: async () => {
    return apiClient.get(API_ENDPOINTS.AUTH.ME);
  },

  /**
   * Forgot password
   */
  forgotPassword: async (email) => {
    return apiClient.post(
      API_ENDPOINTS.AUTH.FORGOT_PASSWORD,
      { email },
      { skipAuth: true }
    );
  },

  /**
   * Update profile
   */
  updateProfile: async (profileData) => {
    return apiClient.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, profileData);
  },

  /**
   * Change password
   */
  changePassword: async (oldPassword, newPassword) => {
    return apiClient.post(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default authAPI;

