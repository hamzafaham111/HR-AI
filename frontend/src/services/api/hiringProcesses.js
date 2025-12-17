/**
 * Hiring Processes API Service
 * 
 * All hiring process-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const hiringProcessesAPI = {
  /**
   * Get all hiring processes
   * @param {Object} params - Query parameters (search, status, limit, etc.)
   */
  getHiringProcesses: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString 
      ? `${API_ENDPOINTS.HIRING_PROCESSES.LIST}?${queryString}`
      : API_ENDPOINTS.HIRING_PROCESSES.LIST;
    return apiClient.get(endpoint);
  },

  /**
   * Get hiring process statistics
   */
  getStats: async () => {
    return apiClient.get(API_ENDPOINTS.HIRING_PROCESSES.STATS);
  },

  /**
   * Get a specific hiring process by ID
   */
  getHiringProcess: async (id) => {
    return apiClient.get(API_ENDPOINTS.HIRING_PROCESSES.DETAIL(id));
  },

  /**
   * Create a new hiring process
   */
  createHiringProcess: async (processData) => {
    return apiClient.post(API_ENDPOINTS.HIRING_PROCESSES.CREATE, processData);
  },

  /**
   * Update a hiring process
   */
  updateHiringProcess: async (id, processData) => {
    return apiClient.put(API_ENDPOINTS.HIRING_PROCESSES.UPDATE(id), processData);
  },

  /**
   * Delete a hiring process
   */
  deleteHiringProcess: async (id) => {
    return apiClient.delete(API_ENDPOINTS.HIRING_PROCESSES.DELETE(id));
  },

  /**
   * Add a candidate to a hiring process
   */
  addCandidate: async (processId, candidateData) => {
    return apiClient.post(API_ENDPOINTS.HIRING_PROCESSES.ADD_CANDIDATE(processId), candidateData);
  },

  /**
   * Move a candidate to a different stage
   */
  moveCandidate: async (processId, candidateId, moveData) => {
    return apiClient.post(
      API_ENDPOINTS.HIRING_PROCESSES.MOVE_CANDIDATE(processId, candidateId),
      moveData
    );
  },

  /**
   * Remove a candidate from a hiring process
   */
  removeCandidate: async (processId, candidateId) => {
    return apiClient.delete(
      API_ENDPOINTS.HIRING_PROCESSES.REMOVE_CANDIDATE(processId, candidateId)
    );
  },
};

export default hiringProcessesAPI;

