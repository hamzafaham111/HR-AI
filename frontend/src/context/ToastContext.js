/**
 * Toast Context
 * 
 * Global toast/notification system for the application.
 * Provides a centralized way to show notifications across all components.
 */

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Show a toast notification
   * @param {string} message - The message to display
   * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
   * @param {number} duration - Duration in milliseconds (0 = no auto-dismiss)
   */
  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      type,
      duration,
      isVisible: true,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss if duration is set
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }

    return id;
  }, []);

  /**
   * Hide a specific toast
   */
  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  /**
   * Hide all toasts
   */
  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * Convenience methods for different toast types
   */
  const success = useCallback((message, duration) => {
    return showToast(message, 'success', duration);
  }, [showToast]);

  const error = useCallback((message, duration) => {
    return showToast(message, 'error', duration);
  }, [showToast]);

  const warning = useCallback((message, duration) => {
    return showToast(message, 'warning', duration);
  }, [showToast]);

  const info = useCallback((message, duration) => {
    return showToast(message, 'info', duration);
  }, [showToast]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    toasts,
    showToast,
    hideToast,
    hideAllToasts,
    success,
    error,
    warning,
    info,
  }), [toasts, showToast, hideToast, hideAllToasts, success, error, warning, info]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
};

/**
 * Toast Container Component
 * Renders all active toasts
 */
const ToastContainer = React.memo(({ toasts, onHide }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
});

ToastContainer.displayName = 'ToastContainer';

/**
 * Individual Toast Item Component
 */
const ToastItem = React.memo(({ toast, onHide }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return 'ℹ️';
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'info':
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getBorderColor = () => {
    switch (toast.type) {
      case 'success':
        return 'border-green-600';
      case 'error':
        return 'border-red-600';
      case 'warning':
        return 'border-yellow-600';
      case 'info':
        return 'border-blue-600';
      default:
        return 'border-blue-600';
    }
  };

  if (!toast.isVisible) return null;

  return (
    <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${getBorderColor()} ${getBackgroundColor()} text-white min-w-80 max-w-md animate-slide-in`}>
      <span className="text-xl mr-3">{getIcon()}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{toast.message}</p>
      </div>
      <button
        onClick={() => onHide(toast.id)}
        className="ml-3 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        <span className="text-xl">&times;</span>
      </button>
    </div>
  );
});

ToastItem.displayName = 'ToastItem';

export default ToastProvider;

