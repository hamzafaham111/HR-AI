import { useState, useCallback } from 'react';
import apiClient from '../services/api/client';
import { handleError } from '../utils/errorHandler';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeRequest = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.request(endpoint, options);
      return { success: true, data: result };
    } catch (err) {
      const transformedError = handleError(err);
      setError(transformedError.message);
      return { success: false, error: transformedError.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    executeRequest,
    clearError,
  };
}; 