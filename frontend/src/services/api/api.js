import axios from 'axios';
import { authenticatedFetch } from '../../utils/api';
import { API_ENDPOINTS } from '../../config/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and logging
api.interceptors.request.use(
  (config) => {
    // Add authorization header if token exists
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    // Handle 401 Unauthorized errors (token expired)
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Try to refresh the token
          const refreshResponse = await axios.post('http://localhost:8000/api/v1/auth/refresh', {
            refresh_token: refreshToken
          });
          
          if (refreshResponse.data.access_token) {
            // Update the token in localStorage
            localStorage.setItem('accessToken', refreshResponse.data.access_token);
            localStorage.setItem('tokenExpiresAt', Date.now() + (refreshResponse.data.expires_in * 1000));
            
            // Retry the original request with the new token
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${refreshResponse.data.access_token}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('tokenExpiresAt');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Resume Analysis API removed - functionality moved to resume bank

// Dashboard API
export const dashboardAPI = {
  // Get dashboard overview
  getOverview: async () => {
    const response = await api.get('/api/v1/dashboard/overview');
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/api/v1/dashboard/statistics');
    return response.data;
  },
};

// Health check
export const healthAPI = {
  checkHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },
};

// Meetings API
export const meetingsAPI = {
  // Get all meetings for the current user
  getMeetings: async (limit = 100) => {
    const response = await authenticatedFetch(`${API_ENDPOINTS.MEETINGS.LIST}?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch meetings: ${response.status}`);
    }
    const result = await response.json();
    // Backend returns {success: true, data: [...]} structure
    return result;
  },

  // Create a new meeting
  createMeeting: async (meetingData) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.CREATE, {
      method: 'POST',
      body: JSON.stringify(meetingData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Get a specific meeting by ID
  getMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.DETAIL(meetingId));
    if (!response.ok) {
      throw new Error(`Failed to fetch meeting: ${response.status}`);
    }
    const result = await response.json();
    // Backend returns {success: true, data: {...}} structure
    return result;
  },

  // Update a meeting
  updateMeeting: async (meetingId, updateData) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.UPDATE(meetingId), {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to update meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Delete a meeting
  deleteMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.DELETE(meetingId), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete meeting: ${response.status}`);
    }
    
    return response.json();
  },

  // Open a meeting
  openMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.OPEN(meetingId), {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to open meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Close a meeting
  closeMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.CLOSE(meetingId), {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to close meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Get public meeting info
  getPublicMeetingInfo: async (meetingLink) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.PUBLIC_INFO(meetingLink));
    if (!response.ok) {
      throw new Error(`Failed to fetch public meeting info: ${response.status}`);
    }
    return response.json();
  },

  // Book a public meeting slot
  bookPublicMeeting: async (meetingLink, bookingData) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.BOOK_PUBLIC(meetingLink), {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to book meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Get meeting templates
  getMeetingTemplates: async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.TEMPLATES);
    if (!response.ok) {
      throw new Error(`Failed to fetch meeting templates: ${response.status}`);
    }
    return response.json();
  },

  // New workflow methods
  approveBooking: async (bookingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.APPROVE_BOOKING(bookingId), {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to approve booking: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  rejectBooking: async (bookingId, reason) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.REJECT_BOOKING(bookingId), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to reject booking: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  startMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.START(meetingId), {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to start meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  completeMeeting: async (meetingId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.COMPLETE(meetingId), {
      method: 'POST',
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to complete meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  cancelMeeting: async (meetingId, reason) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.CANCEL(meetingId), {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to cancel meeting: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  getMeetingsByStatus: async (status) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.BY_STATUS(status));
    if (!response.ok) {
      throw new Error(`Failed to fetch meetings by status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || result;
  },

  getPendingBookings: async () => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.PENDING_BOOKINGS);
    if (!response.ok) {
      throw new Error(`Failed to fetch pending bookings: ${response.status}`);
    }
    const result = await response.json();
    return result.data || result;
  },

  // Create a meeting template
  createMeetingTemplate: async (templateData) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.CREATE_TEMPLATE, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create meeting template: ${response.status} ${errorData}`);
    }
    
    return response.json();
  },

  // Delete a meeting template
  deleteMeetingTemplate: async (templateId) => {
    const response = await authenticatedFetch(API_ENDPOINTS.MEETINGS.DELETE_TEMPLATE(templateId), {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete meeting template: ${response.status}`);
    }
    
    return response.json();
  }
};

export default api; 