/**
 * API Services Index
 * 
 * Central export point for all API services
 */

export { default as apiClient, ApiClient, ApiError } from './client';
export { default as authAPI } from './auth';
export { default as dashboardAPI } from './dashboard';
export { default as jobsAPI } from './jobs';
export { default as resumesAPI } from './resumes';
export { default as hiringProcessesAPI } from './hiringProcesses';
export { default as meetingsAPI } from './meetings';
export { default as jobApplicationsAPI } from './jobApplications';

// Legacy exports for backward compatibility during migration
export { default as api } from './api';

