/**
 * useFetch Hook
 * 
 * Fetches data from an API endpoint with automatic loading and error handling.
 * Supports refetching and dependency-based fetching.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * @param {string|Function} endpoint - API endpoint or function that returns endpoint
 * @param {Object} options - Configuration options
 * @param {boolean} options.immediate - Whether to fetch immediately (default: true)
 * @param {Object} options.fetchOptions - Options to pass to fetch
 * @param {Function} options.onSuccess - Callback on successful fetch
 * @param {Function} options.onError - Callback on error
 * @param {Array} options.dependencies - Dependencies array for re-fetching
 * @returns {Object} { data, loading, error, refetch }
 */
export const useFetch = (endpoint, options = {}) => {
  const {
    immediate = true,
    fetchOptions = {},
    onSuccess,
    onError,
    dependencies = [],
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Support both string endpoints and functions
      const url = typeof endpoint === 'function' ? endpoint() : endpoint;
      
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      setError(err);
      if (onError) {
        onError(err);
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError, ...dependencies]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};

export default useFetch;

