/**
 * Dashboard API Service
 * 
 * All dashboard-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const dashboardAPI = {
  /**
   * Get dashboard overview
   */
  getOverview: async () => {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.OVERVIEW);
  },

  /**
   * Get dashboard statistics
   */
  getStats: async () => {
    return apiClient.get(API_ENDPOINTS.DASHBOARD.STATS);
  },
};

export default dashboardAPI;

