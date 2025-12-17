import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { routes, renderRoute } from './config/routes';
import './styles/App.css';

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {routes.map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={renderRoute(route)}
                  />
                ))}
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 