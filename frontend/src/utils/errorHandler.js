/**
 * Error Handler Utility
 * 
 * Provides standardized error handling and transformation.
 * Converts various error types into user-friendly messages.
 */

import { ApiError } from '../services/api/client';
import { HTTP_STATUS } from '../config/api';

/**
 * Error types/codes for consistent error handling
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK_ERROR',
  AUTH: 'AUTH_ERROR',
  VALIDATION: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER_ERROR',
  UNKNOWN: 'UNKNOWN_ERROR',
};

/**
 * Transform an error into a standardized format
 */
export const transformError = (error) => {
  // Handle ApiError
  if (error instanceof ApiError) {
    return {
      type: getErrorType(error.status),
      message: getUserFriendlyMessage(error),
      status: error.status,
      data: error.data,
      originalError: error,
    };
  }

  // Handle network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: ERROR_TYPES.NETWORK,
      message: 'Network error: Could not connect to server. Please check your connection and ensure the backend is running.',
      status: 0,
      originalError: error,
    };
  }

  // Handle validation errors
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return {
      type: ERROR_TYPES.VALIDATION,
      message: error.message || 'Validation error: Please check your input.',
      originalError: error,
    };
  }

  // Default unknown error
  return {
    type: ERROR_TYPES.UNKNOWN,
    message: error.message || 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
};

/**
 * Get error type from HTTP status code
 */
const getErrorType = (status) => {
  if (!status) return ERROR_TYPES.NETWORK;

  switch (status) {
    case HTTP_STATUS.UNAUTHORIZED:
    case HTTP_STATUS.FORBIDDEN:
      return ERROR_TYPES.AUTH;
    case HTTP_STATUS.NOT_FOUND:
      return ERROR_TYPES.NOT_FOUND;
    case HTTP_STATUS.BAD_REQUEST:
      return ERROR_TYPES.VALIDATION;
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
    default:
      return ERROR_TYPES.SERVER;
  }
};

/**
 * Get user-friendly error message
 */
const getUserFriendlyMessage = (error) => {
  if (error.data?.detail) {
    return error.data.detail;
  }

  if (error.data?.message) {
    return error.data.message;
  }

  switch (error.status) {
    case HTTP_STATUS.UNAUTHORIZED:
      return 'Your session has expired. Please login again.';
    case HTTP_STATUS.FORBIDDEN:
      return 'You do not have permission to perform this action.';
    case HTTP_STATUS.NOT_FOUND:
      return 'The requested resource was not found.';
    case HTTP_STATUS.BAD_REQUEST:
      return 'Invalid request. Please check your input and try again.';
    case HTTP_STATUS.INTERNAL_SERVER_ERROR:
      return 'Server error. Please try again later.';
    default:
      return error.message || 'An error occurred. Please try again.';
  }
};

/**
 * Check if error is a specific type
 */
export const isErrorType = (error, type) => {
  const transformed = transformError(error);
  return transformed.type === type;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error) => {
  return isErrorType(error, ERROR_TYPES.NETWORK);
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error) => {
  return isErrorType(error, ERROR_TYPES.AUTH);
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error) => {
  return isErrorType(error, ERROR_TYPES.VALIDATION);
};

/**
 * Handle error and return user-friendly message
 */
export const handleError = (error, options = {}) => {
  const { log = true, throw: shouldThrow = false } = options;
  const transformed = transformError(error);

  if (log && process.env.NODE_ENV === 'development') {
    console.error('Error handled:', transformed);
  }

  if (shouldThrow) {
    throw transformed;
  }

  return transformed;
};

const errorHandler = {
  transformError,
  handleError,
  isErrorType,
  isNetworkError,
  isAuthError,
  isValidationError,
  ERROR_TYPES,
};

export default errorHandler;

