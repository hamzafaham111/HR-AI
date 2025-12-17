/**
 * useForm Hook
 * 
 * Manages form state, validation, and submission.
 * Provides a clean API for form handling.
 */

import { useState, useCallback } from 'react';

/**
 * @param {Object} initialValues - Initial form values
 * @param {Function} validate - Validation function
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form utilities
 */
export const useForm = (initialValues = {}, validate, onSubmit) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle input change
   */
  const handleChange = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Handle input blur (mark field as touched)
   */
  const handleBlur = useCallback((name) => {
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }));

    // Validate on blur if validation function provided
    if (validate) {
      const validationErrors = validate(values);
      if (validationErrors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: validationErrors[name],
        }));
      }
    }
  }, [validate, values]);

  /**
   * Set field value programmatically
   */
  const setValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  /**
   * Set multiple values at once
   */
  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({
      ...prev,
      ...newValues,
    }));
  }, []);

  /**
   * Reset form to initial values
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    if (e) {
      e.preventDefault();
    }

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);

    // Validate
    if (validate) {
      const validationErrors = validate(values);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }
    }

    // Submit
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } catch (error) {
        setErrors({ submit: error.message || 'An error occurred' });
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validate, onSubmit]);

  /**
   * Get field props for easy binding
   */
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: (e) => handleChange(name, e.target.value),
      onBlur: () => handleBlur(name),
      error: touched[name] && errors[name],
    };
  }, [values, errors, touched, handleChange, handleBlur]);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setValue,
    setMultipleValues,
    reset,
    getFieldProps,
  };
};

export default useForm;

