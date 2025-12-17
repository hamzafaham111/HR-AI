/**
 * Jobs API Service
 * 
 * All job-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const jobsAPI = {
  /**
   * Get all jobs
   */
  getJobs: async () => {
    return apiClient.get(API_ENDPOINTS.JOBS.LIST);
  },

  /**
   * Get a specific job by ID
   */
  getJob: async (id) => {
    return apiClient.get(API_ENDPOINTS.JOBS.DETAIL(id));
  },

  /**
   * Get public job details (no auth required)
   */
  getPublicJob: async (id) => {
    return apiClient.get(API_ENDPOINTS.JOBS.PUBLIC_DETAIL(id), { skipAuth: true });
  },

  /**
   * Create a new job
   */
  createJob: async (jobData) => {
    return apiClient.post(API_ENDPOINTS.JOBS.CREATE, jobData);
  },

  /**
   * Update a job
   */
  updateJob: async (id, jobData) => {
    return apiClient.put(API_ENDPOINTS.JOBS.UPDATE(id), jobData);
  },

  /**
   * Delete a job
   */
  deleteJob: async (id) => {
    return apiClient.delete(API_ENDPOINTS.JOBS.DELETE(id));
  },

  /**
   * Parse job document
   */
  parseDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(API_ENDPOINTS.JOBS.PARSE_DOCUMENT, formData);
  },

  /**
   * Parse job text
   */
  parseText: async (text) => {
    return apiClient.post(API_ENDPOINTS.JOBS.PARSE_TEXT, { text });
  },
};

export default jobsAPI;

