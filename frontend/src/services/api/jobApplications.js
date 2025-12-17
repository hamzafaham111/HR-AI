/**
 * Job Applications API Service
 * 
 * All job application-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const jobApplicationsAPI = {
  /**
   * Get application forms for a job
   */
  getForms: async (jobId) => {
    return apiClient.get(API_ENDPOINTS.JOB_APPLICATIONS.FORMS.DETAIL(jobId));
  },

  /**
   * Create an application form for a job
   */
  createForm: async (jobId, formData) => {
    return apiClient.post(API_ENDPOINTS.JOB_APPLICATIONS.FORMS.CREATE(jobId), formData);
  },

  /**
   * Update an application form
   */
  updateForm: async (formId, formData) => {
    return apiClient.put(API_ENDPOINTS.JOB_APPLICATIONS.FORMS.UPDATE(formId), formData);
  },

  /**
   * Delete an application form
   */
  deleteForm: async (formId) => {
    return apiClient.delete(API_ENDPOINTS.JOB_APPLICATIONS.FORMS.DELETE(formId));
  },

  /**
   * Get public application form (no auth required)
   */
  getPublicForm: async (jobId) => {
    return apiClient.get(
      API_ENDPOINTS.JOB_APPLICATIONS.FORMS.PUBLIC_FORM(jobId),
      { skipAuth: true }
    );
  },

  /**
   * Get applications for a job
   */
  getApplications: async (jobId) => {
    return apiClient.get(API_ENDPOINTS.JOB_APPLICATIONS.APPLICATIONS.LIST(jobId));
  },

  /**
   * Submit a job application (public, no auth required)
   */
  submitApplication: async (jobId, applicationData) => {
    return apiClient.post(
      API_ENDPOINTS.JOB_APPLICATIONS.APPLICATIONS.PUBLIC_APPLY(jobId),
      applicationData,
      { skipAuth: true }
    );
  },

  /**
   * Get applications with scores
   */
  getApplicationsWithScores: async (jobId) => {
    return apiClient.get(API_ENDPOINTS.JOB_APPLICATIONS.APPLICATIONS.WITH_SCORES(jobId));
  },

  /**
   * Update application status
   */
  updateApplicationStatus: async (applicationId, status, notes) => {
    return apiClient.put(
      API_ENDPOINTS.JOB_APPLICATIONS.APPLICATIONS.UPDATE_STATUS(applicationId),
      { status, notes }
    );
  },

  /**
   * Approve application and add to hiring process
   */
  approveAndAddToProcess: async (applicationId, processId, notes) => {
    return apiClient.post(
      API_ENDPOINTS.JOB_APPLICATIONS.APPLICATIONS.APPROVE_AND_ADD_TO_PROCESS(applicationId),
      {
        hiring_process_id: processId,
        notes: notes || 'Approved and added to hiring process from job application',
      }
    );
  },
};

export default jobApplicationsAPI;

