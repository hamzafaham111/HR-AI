export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  
  // Protected routes
  DASHBOARD: '/dashboard',
  // ANALYSIS: '/analysis/:id', // Removed - functionality moved to resume bank
  JOBS: '/jobs',
  CREATE_JOB: '/jobs/create',
  JOB_DETAIL: '/jobs/:id',
  RESUME_BANK: '/resume-bank',
  ADD_RESUME: '/resume-bank/add',
  EDIT_RESUME: '/resume-bank/:id/edit',
  SEARCH_CANDIDATES: '/resume-bank/search-candidates/:jobId',
  SETTINGS: '/settings',
};

export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
];

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  // ROUTES.ANALYSIS, // Removed - functionality moved to resume bank
  ROUTES.JOBS,
  ROUTES.CREATE_JOB,
  ROUTES.JOB_DETAIL,
  ROUTES.RESUME_BANK,
  ROUTES.ADD_RESUME,
  ROUTES.EDIT_RESUME,
  ROUTES.SEARCH_CANDIDATES,
  ROUTES.SETTINGS,
]; 