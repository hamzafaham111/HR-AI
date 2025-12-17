/**
 * Error Fallback Component
 * 
 * Displays a user-friendly error message when an error boundary catches an error.
 */

import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ErrorFallback = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate();
  const isDevelopment = process.env.NODE_ENV === 'development';

  const handleGoHome = () => {
    navigate('/');
    onReset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertCircle className="w-16 h-16 text-red-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Something went wrong
        </h1>
        
        <p className="text-gray-600 mb-6">
          We're sorry, but something unexpected happened. Please try refreshing the page or go back to the home page.
        </p>

        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-semibold text-red-800 mb-2">Error Details (Development Only):</p>
            <p className="text-xs text-red-700 font-mono break-all mb-2">
              {error.toString()}
            </p>
            {errorInfo && errorInfo.componentStack && (
              <details className="text-xs text-red-600">
                <summary className="cursor-pointer font-semibold mb-1">Stack Trace</summary>
                <pre className="whitespace-pre-wrap break-all mt-2">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorFallback;

