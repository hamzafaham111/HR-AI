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

// Base API URL - automatically detects environment
export const API_BASE_URL = (() => {
  // If we're in production (Vercel), use the same domain
  if (process.env.NODE_ENV === 'production') {
    // Get the current domain from window.location
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    // Fallback for server-side rendering
    return process.env.REACT_APP_VERCEL_URL || 'https://your-project.vercel.app';
  }
  // Development environment
  return process.env.REACT_APP_API_URL || 'http://localhost:8000';
})();

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
    MOVE_CANDIDATE: (processId, candidateId) => `${API_URL}/hiring-processes/${processId}/candidates/${candidateId}/move`
  }
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

// Development helpers
if (APP_CONFIG.DEBUG) {
  console.log('🔧 API Configuration:', {
    API_BASE_URL,
    API_BASE_PATH,
    API_URL,
    APP_CONFIG,
    UPLOAD_CONFIG,
    UI_CONFIG
  });
}
