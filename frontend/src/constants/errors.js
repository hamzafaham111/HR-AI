/**
 * Error Constants
 * 
 * Centralized error messages and codes for consistent error handling.
 */

export const ERROR_MESSAGES = {
  NETWORK: {
    CONNECTION_FAILED: 'Network error: Could not connect to server. Please check your connection and ensure the backend is running.',
    TIMEOUT: 'Request timed out. Please try again.',
    OFFLINE: 'You are currently offline. Please check your internet connection.',
  },
  AUTH: {
    UNAUTHORIZED: 'Your session has expired. Please login again.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    INVALID_CREDENTIALS: 'Invalid email or password. Please try again.',
    TOKEN_EXPIRED: 'Your session has expired. Please login again.',
  },
  VALIDATION: {
    REQUIRED: 'This field is required.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    INVALID_PHONE: 'Please enter a valid phone number.',
    MIN_LENGTH: (min) => `Must be at least ${min} characters.`,
    MAX_LENGTH: (max) => `Must be no more than ${max} characters.`,
    INVALID_FORMAT: 'Invalid format. Please check your input.',
  },
  NOT_FOUND: {
    RESOURCE: 'The requested resource was not found.',
    PAGE: 'The page you are looking for does not exist.',
  },
  SERVER: {
    INTERNAL_ERROR: 'Server error. Please try again later.',
    BAD_REQUEST: 'Invalid request. Please check your input and try again.',
  },
  GENERAL: {
    UNEXPECTED: 'An unexpected error occurred. Please try again.',
    RETRY: 'Something went wrong. Please try again.',
  },
};

export const ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

