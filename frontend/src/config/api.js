/**
 * API Configuration for Frontend
 * 
 * This file centralizes all API-related configuration.
 * It uses environment variables to make the app flexible across different environments.
 * 
 * EXPLANATION FOR REACT DEVELOPERS:
 * ================================
 * - process.env variables are injected at build time
 * - Only REACT_APP_ prefixed variables are available in the browser
 * - This prevents accidental exposure of sensitive backend secrets
 * - Default values provide fallbacks for development
 */

// Base API URL - can be changed for different environments
// In development, use relative URL to take advantage of proxy in package.json
// In production, use absolute URL
const isDevelopment = process.env.NODE_ENV === 'development';
export const API_BASE_URL = process.env.REACT_APP_API_URL || (isDevelopment ? '' : 'http://localhost:8000');

// API path prefix
export const API_BASE_PATH = process.env.REACT_APP_API_BASE_PATH || '/api/v1';

// Complete API URL
export const API_URL = `${API_BASE_URL}${API_BASE_PATH}`;

// API Endpoints - organized by feature
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    REFRESH: `${API_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${API_URL}/auth/forgot-password`,
    ME: `${API_URL}/auth/me`,
    UPDATE_PROFILE: `${API_URL}/auth/profile`,
    CHANGE_PASSWORD: `${API_URL}/auth/change-password`,
  },
  
  // Resume Bank
  RESUME_BANK: {
    LIST: `${API_URL}/resume-bank/`,
    UPLOAD: `${API_URL}/resume-bank/upload`,
    STATS: `${API_URL}/resume-bank/stats`,
    SEARCH_CANDIDATES: (jobId) => `${API_URL}/resume-bank/search-candidates/${jobId}`,
    FIND_CANDIDATES: `${API_URL}/resume-bank/find-candidates`,
    DETAIL: (id) => `${API_URL}/resume-bank/${id}`,
    UPDATE: (id) => `${API_URL}/resume-bank/${id}`,
    DELETE: (id) => `${API_URL}/resume-bank/${id}`,
  },
  
  // Jobs
  JOBS: {
    LIST: `${API_URL}/jobs/`,
    CREATE: `${API_URL}/jobs/`,
    DETAIL: (id) => `${API_URL}/jobs/${id}`,
    PUBLIC_DETAIL: (id) => `${API_URL}/jobs/public/${id}`,
    UPDATE: (id) => `${API_URL}/jobs/${id}`,
    DELETE: (id) => `${API_URL}/jobs/${id}`,
    PARSE_DOCUMENT: `${API_URL}/jobs/parse-document`,
    PARSE_TEXT: `${API_URL}/jobs/parse-text`,
  },
  
  // Dashboard
  DASHBOARD: {
    OVERVIEW: `${API_URL}/dashboard/overview`,
    STATS: `${API_URL}/dashboard/stats`,
  },
  
  // Hiring Processes
  HIRING_PROCESSES: {
    LIST: `${API_URL}/hiring-processes/`,
    CREATE: `${API_URL}/hiring-processes/`,
    DETAIL: (id) => `${API_URL}/hiring-processes/${id}`,
    UPDATE: (id) => `${API_URL}/hiring-processes/${id}`,
    DELETE: (id) => `${API_URL}/hiring-processes/${id}`,
    STATS: `${API_URL}/hiring-processes/stats`,
    ADD_CANDIDATE: (id) => `${API_URL}/hiring-processes/${id}/candidates`,
    MOVE_CANDIDATE: (processId, candidateId) => `${API_URL}/hiring-processes/${processId}/candidates/${candidateId}/move`,
    REMOVE_CANDIDATE: (processId, candidateId) => `${API_URL}/hiring-processes/${processId}/candidates/${candidateId}/remove`
  },
  
  // Meetings
  MEETINGS: {
    LIST: `${API_URL}/meetings/`,
    CREATE: `${API_URL}/meetings/`,
    DETAIL: (id) => `${API_URL}/meetings/${id}`,
    UPDATE: (id) => `${API_URL}/meetings/${id}`,
    DELETE: (id) => `${API_URL}/meetings/${id}`,
    PUBLIC_INFO: (meetingLink) => `${API_URL}/meetings/public/${meetingLink}`,
    BOOK_PUBLIC: (meetingLink) => `${API_URL}/meetings/public/${meetingLink}/book`,
    TEMPLATES: `${API_URL}/meetings/templates/`,
    CREATE_TEMPLATE: `${API_URL}/meetings/templates/`,
    DELETE_TEMPLATE: (id) => `${API_URL}/meetings/templates/${id}`,
    
    // New workflow endpoints
    OPEN: (id) => `${API_URL}/meetings/${id}/open`,
    CLOSE: (id) => `${API_URL}/meetings/${id}/close`,
    APPROVE_BOOKING: (id) => `${API_URL}/meetings/bookings/${id}/approve`,
    REJECT_BOOKING: (id) => `${API_URL}/meetings/bookings/${id}/reject`,
    START: (id) => `${API_URL}/meetings/${id}/start`,
    COMPLETE: (id) => `${API_URL}/meetings/${id}/complete`,
    CANCEL: (id) => `${API_URL}/meetings/${id}/cancel`,
    BY_STATUS: (status) => `${API_URL}/meetings/status/${status}`,
    PENDING_BOOKINGS: `${API_URL}/meetings/bookings/pending`,
  },
  
  // Job Applications
  JOB_APPLICATIONS: {
    FORMS: {
      LIST: `${API_URL}/job-applications/forms/`,
      CREATE: (jobId) => `${API_URL}/job-applications/forms/${jobId}`,
      DETAIL: (formId) => `${API_URL}/job-applications/forms/${formId}`,
      UPDATE: (formId) => `${API_URL}/job-applications/forms/${formId}`,
      DELETE: (formId) => `${API_URL}/job-applications/forms/${formId}`,
      PUBLIC_FORM: (jobId) => `${API_URL}/job-applications/public/forms/${jobId}`,
    },
    APPLICATIONS: {
      LIST: (jobId) => `${API_URL}/job-applications/${jobId}`,
      APPLY: (jobId) => `${API_URL}/job-applications/public/apply/${jobId}`,
      PUBLIC_APPLY: (jobId) => `${API_URL}/job-applications/public/apply/${jobId}`,
      WITH_SCORES: (jobId) => `${API_URL}/job-applications/${jobId}/applications-with-scores`,
      UPDATE_STATUS: (applicationId) => `${API_URL}/job-applications/applications/${applicationId}/status`,
      APPROVE_AND_ADD_TO_PROCESS: (applicationId) => `${API_URL}/job-applications/applications/${applicationId}/approve-and-add-to-process`,
    }
  },
};

// Application Configuration
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_NAME || 'HR',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  ENV: process.env.REACT_APP_ENV || 'development',
  DEBUG: process.env.REACT_APP_ENABLE_DEBUG === 'true',
  ANALYTICS: process.env.REACT_APP_ENABLE_ANALYTICS === 'true',
};

// Upload Configuration
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES || '.pdf',
  ALLOWED_MIME_TYPES: ['application/pdf'],
};

// UI Configuration
export const UI_CONFIG = {
  ITEMS_PER_PAGE: parseInt(process.env.REACT_APP_ITEMS_PER_PAGE) || 10,
  DEFAULT_THEME: process.env.REACT_APP_DEFAULT_THEME || 'light',
};

// HTTP Constants (moved from constants/api.js for consolidation)
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

// Log configuration for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  // Configuration is ready
}
