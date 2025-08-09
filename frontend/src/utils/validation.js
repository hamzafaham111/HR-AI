export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  
  return {
    minLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber
  };
};

export const validateRequired = (value) => {
  return value && value.trim().length > 0;
};

export const validateFileSize = (file, maxSizeMB = 10) => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateFileType = (file, allowedTypes = ['application/pdf']) => {
  return allowedTypes.includes(file.type);
};

export const validatePhoneNumber = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const getValidationError = (field, value, rules = {}) => {
  const {
    required = false,
    email = false,
    password = false,
    minLength = 0,
    maxLength = Infinity,
    custom = null
  } = rules;

  // Required validation
  if (required && !validateRequired(value)) {
    return `${field} is required`;
  }

  // Email validation
  if (email && value && !validateEmail(value)) {
    return 'Please enter a valid email address';
  }

  // Password validation
  if (password && value) {
    const passwordValidation = validatePassword(value);
    if (!passwordValidation.isValid) {
      return 'Password must be at least 8 characters with uppercase, lowercase, and number';
    }
  }

  // Length validation
  if (value && value.length < minLength) {
    return `${field} must be at least ${minLength} characters`;
  }

  if (value && value.length > maxLength) {
    return `${field} must be no more than ${maxLength} characters`;
  }

  // Custom validation
  if (custom && typeof custom === 'function') {
    const customError = custom(value);
    if (customError) {
      return customError;
    }
  }

  return null;
}; 