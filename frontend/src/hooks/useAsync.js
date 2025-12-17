/**
 * useAsync Hook
 * 
 * Handles async operations with loading, error, and data states.
 * Useful for API calls and other asynchronous operations.
 */

import { useState, useCallback } from 'react';

/**
 * @param {Function} asyncFunction - The async function to execute
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to execute immediately on mount
 * @param {Array} options.dependencies - Dependencies array for the async function
 * @returns {Object} { execute, data, loading, error, reset }
 */
export const useAsync = (asyncFunction, options = {}) => {
  const { immediate = false, dependencies = [] } = options;
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction(...args);
      setData(result);
      return { success: true, data: result };
    } catch (err) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, dependencies);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    execute,
    data,
    loading,
    error,
    reset,
  };
};

export default useAsync;

