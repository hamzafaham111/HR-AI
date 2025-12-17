import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  Link as LinkIcon, 
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { meetingsAPI } from '../services/api';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { useToast } from '../hooks/useToast';
import logger from '../utils/logger';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { showToast } = useToast();

  const fetchMeetingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getMeeting(id);
      
      // Extract data from the response structure
      if (response && response.success && response.data) {
        setMeeting(response.data);
      } else {
        logger.error('Invalid response structure:', response);
        showToast('Invalid response format from server', 'error');
      }
    } catch (error) {
      logger.error('Error fetching meeting details:', error);
      showToast('Failed to fetch meeting details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMeetingDetails();
  }, [fetchMeetingDetails]);

  const handleDeleteMeeting = async () => {
    try {
      await meetingsAPI.deleteMeeting(id);
      showToast('Meeting deleted successfully', 'success');
      navigate('/meetings');
    } catch (error) {
      logger.error('Error deleting meeting:', error);
      showToast('Failed to delete meeting', 'error');
    } finally {
      setShowDeleteModal(false);
    }
  };

  const copyMeetingLink = async () => {
    if (meeting?.id) {
      let fullLink = '';
      try {
        // Generate public link using meeting ID - this should be the frontend route
        fullLink = `${window.location.origin}/meeting/${meeting.id}`;
        
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(fullLink);
          showToast('Meeting link copied to clipboard!', 'success');
        } else {
          // Fallback to old method
          const textArea = document.createElement('textarea');
          textArea.value = fullLink;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          textArea.style.opacity = '0';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          
          const successful = document.execCommand('copy');
          
          if (successful) {
            showToast('Meeting link copied to clipboard!', 'success');
          } else {
            throw new Error('Copy command failed');
          }
          
          document.body.removeChild(textArea);
        }
      } catch (error) {
        logger.error('Copy failed:', error);
        showToast(`Failed to copy link. Please copy manually: ${fullLink}`, 'error');
      }
    } else {
      showToast('No meeting ID available', 'error');
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      // Call API to approve booking
      const response = await fetch(`/api/v1/meetings/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        showToast('Booking approved successfully!', 'success');
        // Refresh meeting data
        fetchMeetingDetails();
      } else {
        throw new Error('Failed to approve booking');
      }
    } catch (error) {
      logger.error('Error approving booking:', error);
      showToast('Failed to approve booking', 'error');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      // Call API to reject booking
      const response = await fetch(`/api/v1/meetings/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        showToast('Booking rejected successfully!', 'success');
        // Refresh meeting data
        fetchMeetingDetails();
      } else {
        throw new Error('Failed to reject booking');
      }
    } catch (error) {
      logger.error('Error rejecting booking:', error);
      showToast('Failed to reject booking', 'error');
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      // Call API to complete booking
      const response = await fetch(`/api/v1/meetings/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        showToast('Booking marked as completed!', 'success');
        // Refresh meeting data
        fetchMeetingDetails();
      } else {
        throw new Error('Failed to complete booking');
      }
    } catch (error) {
      logger.error('Error completing booking:', error);
      showToast('Failed to complete booking', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-800';
    
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Meeting not found</h2>
        <p className="text-gray-600 mb-6">The meeting you're looking for doesn't exist or has been deleted.</p>
        <Link
          to="/meetings"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Back to Meetings
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/meetings')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{meeting.title || 'Untitled Meeting'}</h1>
          </div>
          
          <div className="flex space-x-3">
            <Link
              to={`/meetings/${id}/edit`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </button>
          </div>
        </div>

        {meeting.description && (
          <p className="text-lg text-gray-600 mb-6">{meeting.description}</p>
        )}

        <div className="flex flex-wrap gap-6 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            <span>{meeting.duration || meeting.duration_minutes || 0} minutes</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Users className="w-4 h-4 mr-2" />
            <span>Max {meeting.max_participants || 1} participants</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created {meeting.created_at ? formatDate(meeting.created_at) : 'Unknown'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(meeting.status)}`}>
            {meeting.status ? meeting.status.charAt(0).toUpperCase() + meeting.status.slice(1) : 'Unknown'}
          </span>
          
          <button
            onClick={copyMeetingLink}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copy Meeting Link
          </button>
        </div>
      </div>

      {/* Meeting Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-primary-600">
            {meeting.slots ? meeting.slots.length : 0}
          </div>
          <div className="text-sm text-gray-600">Total Slots</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {meeting.slots ? meeting.slots.filter(s => s.is_available).length : 0}
          </div>
          <div className="text-sm text-gray-600">Available</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-red-600">
            {meeting.slots ? meeting.slots.filter(s => !s.is_available).length : 0}
          </div>
          <div className="text-sm text-gray-600">Booked</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {meeting.bookings ? meeting.bookings.length : 0}
          </div>
          <div className="text-sm text-gray-600">Total Bookings</div>
        </div>
      </div>

      {/* Meeting Slots */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Meeting Slots</h2>
          <p className="text-sm text-gray-600">Available time slots for this meeting</p>
        </div>
        
        <div className="p-6">
          {meeting.slots && meeting.slots.length > 0 ? (
            <div className="space-y-4">
              {/* Calendar-style grid layout */}
              <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-3">
                <div className="text-center">Mon</div>
                <div className="text-center">Tue</div>
                <div className="text-center">Wed</div>
                <div className="text-center">Thu</div>
                <div className="text-center">Fri</div>
                <div className="text-center">Sat</div>
                <div className="text-center">Sun</div>
              </div>
              
              {/* Group slots by date */}
              {(() => {
                const slotsByDate = {};
                meeting.slots.forEach(slot => {
                  const date = new Date(slot.start_time);
                  const dateKey = date.toISOString().split('T')[0];
                  if (!slotsByDate[dateKey]) {
                    slotsByDate[dateKey] = [];
                  }
                  slotsByDate[dateKey].push(slot);
                });
                
                const sortedDates = Object.keys(slotsByDate).sort();
                
                return (
                  <div className="space-y-4">
                    {sortedDates.map(dateKey => {
                      const date = new Date(dateKey);
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNumber = date.getDate();
                      const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                      const daySlots = slotsByDate[dateKey];
                      
                      return (
                        <div key={dateKey} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{dayNumber}</div>
                                <div className="text-xs text-gray-500">{monthName}</div>
                              </div>
                              <div className="text-sm font-medium text-gray-700">{dayName}</div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {daySlots.filter(s => s.is_available).length} available
                            </div>
                          </div>
                          
                          {/* Time slots grid */}
                          <div className="grid grid-cols-8 gap-2">
                            {daySlots.map(slot => (
                              <div
                                key={slot.id}
                                className={`
                                  p-2 rounded text-xs text-center cursor-pointer transition-colors
                                  ${slot.is_available 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300' 
                                    : 'bg-red-100 text-red-800 border border-red-300'
                                  }
                                `}
                                title={slot.is_available ? 'Available' : 'Booked'}
                              >
                                {new Date(slot.start_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                })}
                                {slot.booking && (
                                  <div className="text-xs mt-1 font-medium">
                                    {slot.booking.participant_name}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No slots available for this meeting.</p>
          )}
        </div>
      </div>

      {/* Bookings */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bookings</h2>
          <p className="text-sm text-gray-600">Manage participant bookings for this meeting</p>
        </div>
        
        <div className="p-6">
          {meeting.bookings && meeting.bookings.length > 0 ? (
            <div className="space-y-3">
              {meeting.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-600 font-semibold text-sm">
                          {booking.participant_name?.charAt(0)?.toUpperCase() || '?'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {booking.participant_name || 'Unknown'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          booking.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800' // pending
                        }`}>
                          {booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : 'Unknown'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{booking.participant_email || 'No email'}</span>
                        {booking.participant_phone && (
                          <span>{booking.participant_phone}</span>
                        )}
                        <span>{booking.created_at ? formatDate(booking.created_at) : 'Unknown'}</span>
                      </div>
                      
                      {booking.notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">"{booking.notes}"</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Action buttons for pending bookings */}
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApproveBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    
                    {/* Action buttons for approved bookings */}
                    {booking.status === 'approved' && (
                      <>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleCompleteBooking(booking.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                          Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500">No bookings for this meeting yet.</p>
              <p className="text-sm text-gray-400 mt-1">Share the meeting link to get participants to book slots.</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeeting}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${meeting.title || 'this meeting'}"? This action cannot be undone and will also delete all associated slots and bookings.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

    </div>
  );
};

export default MeetingDetail;
