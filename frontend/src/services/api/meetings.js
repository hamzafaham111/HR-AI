/**
 * Meetings API Service
 * 
 * All meeting-related API calls
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../../config/api';

export const meetingsAPI = {
  /**
   * Get all meetings
   */
  getMeetings: async (limit = 100) => {
    return apiClient.get(`${API_ENDPOINTS.MEETINGS.LIST}?limit=${limit}`);
  },

  /**
   * Get a specific meeting by ID
   */
  getMeeting: async (meetingId) => {
    return apiClient.get(API_ENDPOINTS.MEETINGS.DETAIL(meetingId));
  },

  /**
   * Create a new meeting
   */
  createMeeting: async (meetingData) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.CREATE, meetingData);
  },

  /**
   * Update a meeting
   */
  updateMeeting: async (meetingId, updateData) => {
    return apiClient.put(API_ENDPOINTS.MEETINGS.UPDATE(meetingId), updateData);
  },

  /**
   * Delete a meeting
   */
  deleteMeeting: async (meetingId) => {
    return apiClient.delete(API_ENDPOINTS.MEETINGS.DELETE(meetingId));
  },

  /**
   * Get public meeting info (no auth required)
   */
  getPublicMeetingInfo: async (meetingLink) => {
    return apiClient.get(API_ENDPOINTS.MEETINGS.PUBLIC_INFO(meetingLink), { skipAuth: true });
  },

  /**
   * Book a public meeting slot (no auth required)
   */
  bookPublicMeeting: async (meetingLink, bookingData) => {
    return apiClient.post(
      API_ENDPOINTS.MEETINGS.BOOK_PUBLIC(meetingLink),
      bookingData,
      { skipAuth: true }
    );
  },

  /**
   * Get meeting templates
   */
  getMeetingTemplates: async () => {
    return apiClient.get(API_ENDPOINTS.MEETINGS.TEMPLATES);
  },

  /**
   * Create a meeting template
   */
  createMeetingTemplate: async (templateData) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.CREATE_TEMPLATE, templateData);
  },

  /**
   * Delete a meeting template
   */
  deleteMeetingTemplate: async (templateId) => {
    return apiClient.delete(API_ENDPOINTS.MEETINGS.DELETE_TEMPLATE(templateId));
  },

  /**
   * Open a meeting
   */
  openMeeting: async (meetingId) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.OPEN(meetingId));
  },

  /**
   * Close a meeting
   */
  closeMeeting: async (meetingId) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.CLOSE(meetingId));
  },

  /**
   * Start a meeting
   */
  startMeeting: async (meetingId) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.START(meetingId));
  },

  /**
   * Complete a meeting
   */
  completeMeeting: async (meetingId) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.COMPLETE(meetingId));
  },

  /**
   * Cancel a meeting
   */
  cancelMeeting: async (meetingId, reason) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.CANCEL(meetingId), { reason });
  },

  /**
   * Approve a booking
   */
  approveBooking: async (bookingId) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.APPROVE_BOOKING(bookingId));
  },

  /**
   * Reject a booking
   */
  rejectBooking: async (bookingId, reason) => {
    return apiClient.post(API_ENDPOINTS.MEETINGS.REJECT_BOOKING(bookingId), { reason });
  },

  /**
   * Get meetings by status
   */
  getMeetingsByStatus: async (status) => {
    return apiClient.get(API_ENDPOINTS.MEETINGS.BY_STATUS(status));
  },

  /**
   * Get pending bookings
   */
  getPendingBookings: async () => {
    return apiClient.get(API_ENDPOINTS.MEETINGS.PENDING_BOOKINGS);
  },
};

export default meetingsAPI;

