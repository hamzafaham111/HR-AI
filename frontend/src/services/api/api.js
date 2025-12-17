/**
 * Legacy API Service
 * 
 * This file is kept for backward compatibility during migration.
 * New code should use the feature-specific API modules from './index.js'
 * 
 * @deprecated Use individual API modules (jobsAPI, resumesAPI, etc.) instead
 */

import { dashboardAPI } from './dashboard';
import apiClient from './client';

// Re-export dashboard API for backward compatibility
export { dashboardAPI };

// Health check API
export const healthAPI = {
  checkHealth: async () => {
    return apiClient.get('/health');
  },
};

// Re-export meetings API for backward compatibility
export { meetingsAPI } from './meetings';

// Default export for backward compatibility (legacy axios instance removed)
// Use apiClient from './client' instead
const api = {
  // This is a placeholder for backward compatibility
  // New code should use apiClient or feature-specific APIs
};

export default api; 