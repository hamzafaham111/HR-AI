/**
 * Resume Bank API Service
 * 
 * All resume-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const resumesAPI = {
  /**
   * Get all resumes
   */
  getResumes: async () => {
    return apiClient.get(API_ENDPOINTS.RESUME_BANK.LIST);
  },

  /**
   * Get resume statistics
   */
  getStats: async () => {
    return apiClient.get(API_ENDPOINTS.RESUME_BANK.STATS);
  },

  /**
   * Get a specific resume by ID
   */
  getResume: async (id) => {
    return apiClient.get(API_ENDPOINTS.RESUME_BANK.DETAIL(id));
  },

  /**
   * Upload a resume
   */
  uploadResume: async (file, candidateInfo = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    
    // Append candidate info if provided
    Object.keys(candidateInfo).forEach(key => {
      if (candidateInfo[key] !== null && candidateInfo[key] !== undefined) {
        formData.append(key, candidateInfo[key]);
      }
    });

    return apiClient.post(API_ENDPOINTS.RESUME_BANK.UPLOAD, formData);
  },

  /**
   * Update a resume
   */
  updateResume: async (id, resumeData) => {
    return apiClient.put(API_ENDPOINTS.RESUME_BANK.UPDATE(id), resumeData);
  },

  /**
   * Delete a resume
   */
  deleteResume: async (id) => {
    return apiClient.delete(API_ENDPOINTS.RESUME_BANK.DELETE(id));
  },

  /**
   * Search candidates for a job
   */
  searchCandidates: async (jobId) => {
    return apiClient.get(API_ENDPOINTS.RESUME_BANK.SEARCH_CANDIDATES(jobId));
  },

  /**
   * Find candidates
   */
  findCandidates: async (criteria) => {
    return apiClient.post(API_ENDPOINTS.RESUME_BANK.FIND_CANDIDATES, criteria);
  },

  /**
   * Get candidate details (with processes and history)
   */
  getCandidateDetails: async (candidateId) => {
    return apiClient.get(`${API_ENDPOINTS.RESUME_BANK.LIST}candidate/${candidateId}`);
  },

  /**
   * Update candidate status
   */
  updateCandidateStatus: async (candidateId, status) => {
    return apiClient.put(`${API_ENDPOINTS.RESUME_BANK.LIST}candidate/${candidateId}/status`, {
      candidate_status: status,
    });
  },
};

export default resumesAPI;

