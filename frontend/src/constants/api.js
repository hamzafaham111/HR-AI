export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
};

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: '/api/v1/auth/login',
  REGISTER: '/api/v1/auth/register',
  LOGOUT: '/api/v1/auth/logout',
  REFRESH_TOKEN: '/api/v1/auth/refresh',
  FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
  RESET_PASSWORD: '/api/v1/auth/reset-password',
  
  // Resume endpoints
  UPLOAD_RESUME: '/api/v1/resumes/upload',
  GET_RESUMES: '/api/v1/resumes',
  GET_RESUME: '/api/v1/resumes/:id',
  UPDATE_RESUME: '/api/v1/resumes/:id',
  DELETE_RESUME: '/api/v1/resumes/:id',
  ANALYZE_RESUME: '/api/v1/resumes/:id/analyze',
  
  // Job endpoints
  GET_JOBS: '/api/v1/jobs',
  CREATE_JOB: '/api/v1/jobs',
  GET_JOB: '/api/v1/jobs/:id',
  UPDATE_JOB: '/api/v1/jobs/:id',
  DELETE_JOB: '/api/v1/jobs/:id',
  
  // Meeting endpoints
  GET_MEETINGS: '/api/v1/meetings',
  CREATE_MEETING: '/api/v1/meetings',
  GET_MEETING: '/api/v1/meetings/:id',
  UPDATE_MEETING: '/api/v1/meetings/:id',
  DELETE_MEETING: '/api/v1/meetings/:id',
  GET_PUBLIC_MEETING: '/api/v1/meetings/public/:meetingLink',
  BOOK_PUBLIC_MEETING: '/api/v1/meetings/public/:meetingLink/book',
  GET_MEETING_TEMPLATES: '/api/v1/meetings/templates',
  CREATE_MEETING_TEMPLATE: '/api/v1/meetings/templates',
  DELETE_MEETING_TEMPLATE: '/api/v1/meetings/templates/:id',
  
  // Analysis endpoints removed - functionality moved to resume bank
  
  // Search endpoints
  SEARCH_CANDIDATES: '/api/v1/search/candidates',
};

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
}; 