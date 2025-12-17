/**
 * Route Configuration
 * 
 * Centralized route definitions for the application.
 * This makes it easier to manage routes, add route guards, and implement lazy loading.
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import ProtectedRoute from '../components/auth/ProtectedRoute';

// Lazy load pages for code splitting
const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const Register = React.lazy(() => import('../pages/Register'));
const ForgotPassword = React.lazy(() => import('../pages/ForgotPassword'));
const Dashboard = React.lazy(() => import('../pages/Dashboard'));
const Jobs = React.lazy(() => import('../pages/Jobs'));
const CreateJob = React.lazy(() => import('../pages/CreateJob'));
const JobDetail = React.lazy(() => import('../pages/JobDetail'));
const ResumeBank = React.lazy(() => import('../pages/ResumeBank'));
const AddResume = React.lazy(() => import('../pages/AddResume'));
const EditResume = React.lazy(() => import('../pages/EditResume'));
const CandidateDetail = React.lazy(() => import('../pages/CandidateDetail'));
const SearchCandidates = React.lazy(() => import('../pages/SearchCandidates'));
const Settings = React.lazy(() => import('../pages/Settings'));
const HiringProcesses = React.lazy(() => import('../pages/HiringProcesses'));
const CreateHiringProcess = React.lazy(() => import('../pages/CreateHiringProcess'));
const HiringProcessDetail = React.lazy(() => import('../pages/HiringProcessDetail'));
const Meetings = React.lazy(() => import('../pages/Meetings'));
const CreateMeeting = React.lazy(() => import('../pages/CreateMeeting'));
const PublicMeeting = React.lazy(() => import('../pages/PublicMeeting'));
const PublicJobApplication = React.lazy(() => import('../pages/PublicJobApplication'));
const MeetingDetail = React.lazy(() => import('../pages/MeetingDetail'));

/**
 * Route configuration object
 * Each route can have:
 * - path: URL path
 * - element: React component to render
 * - requiresAuth: Whether authentication is required
 * - showSidebar: Whether to show the sidebar layout
 * - isPublic: Whether this is a public route (no auth required)
 */
export const routes = [
  // Public routes
  {
    path: '/',
    element: <Home />,
    isPublic: true,
  },
  {
    path: '/login',
    element: <Login />,
    isPublic: true,
  },
  {
    path: '/register',
    element: <Register />,
    isPublic: true,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
    isPublic: true,
  },
  {
    path: '/meeting/:meetingLink',
    element: <PublicMeeting />,
    isPublic: true,
  },
  {
    path: '/job/:jobId/apply',
    element: <PublicJobApplication />,
    isPublic: true,
  },

  // Protected routes with sidebar
  {
    path: '/dashboard',
    element: <Dashboard />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/jobs',
    element: <Jobs />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/jobs/create',
    element: <CreateJob />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/jobs/:id',
    element: <JobDetail />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/resume-bank',
    element: <ResumeBank />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/resume-bank/add',
    element: <AddResume />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/resume-bank/:id/edit',
    element: <EditResume />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/resume-bank/:candidateId',
    element: <CandidateDetail />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/resume-bank/search-candidates/:jobId',
    element: <SearchCandidates />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/settings',
    element: <Settings />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/hiring-processes',
    element: <HiringProcesses />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/hiring-processes/create',
    element: <CreateHiringProcess />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/hiring-processes/:id',
    element: <HiringProcessDetail />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/meetings',
    element: <Meetings />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/meetings/create',
    element: <CreateMeeting />,
    requiresAuth: true,
    showSidebar: true,
  },
  {
    path: '/meetings/:id',
    element: <MeetingDetail />,
    requiresAuth: true,
    showSidebar: true,
  },

  // Catch-all route - redirect to home
  {
    path: '*',
    element: <Navigate to="/" replace />,
    isPublic: true,
  },
];

/**
 * Helper function to render a route with proper wrappers
 */
export const renderRoute = (route) => {
  const { element, requiresAuth, showSidebar, isPublic } = route;

  // Public routes don't need protection
  if (isPublic) {
    return element;
  }

  // Protected routes
  if (requiresAuth) {
    const wrappedElement = showSidebar ? (
      <Layout showSidebar={true}>{element}</Layout>
    ) : (
      element
    );

    return <ProtectedRoute>{wrappedElement}</ProtectedRoute>;
  }

  return element;
};

