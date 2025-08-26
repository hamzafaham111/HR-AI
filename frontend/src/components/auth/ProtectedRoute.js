import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { handleTokenExpiry } from '../../utils/api';

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  // Check if user has a valid access token
  const accessToken = localStorage.getItem('accessToken');
  const tokenExpiresAt = localStorage.getItem('tokenExpiresAt');
  const isTokenValid = accessToken && tokenExpiresAt && Date.now() < parseInt(tokenExpiresAt);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || !isTokenValid) {
    // Clear invalid tokens and redirect to login
    if (!isTokenValid) {
      handleTokenExpiry();
    }
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute; 