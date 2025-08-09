import React, { useEffect } from 'react';

const Toast = ({ 
  isVisible, 
  message, 
  type = 'info', // 'success', 'error', 'warning', 'info'
  duration = 3000,
  onClose 
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
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
    switch (type) {
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
    switch (type) {
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

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center p-4 rounded-lg shadow-lg border-l-4 ${getBorderColor()} ${getBackgroundColor()} text-white min-w-80 max-w-md`}>
        <span className="text-xl mr-3">{getIcon()}</span>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
      </div>
    </div>
  );
};

export default Toast; 