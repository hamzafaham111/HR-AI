import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { meetingsAPI } from '../services/api/api';
import { ROUTES } from '../constants/routes';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Toast from '../components/ui/Toast';

const PendingApprovals = () => {
  const navigate = useNavigate();
  
  const [pendingBookings, setPendingBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMeeting, setSelectedMeeting] = useState('all');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [bookingToReject, setBookingToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  const fetchPendingBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getPendingBookings();
      setPendingBookings(response.data?.bookings || []);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      setToast({
        type: 'error',
        message: 'Failed to fetch pending bookings'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const filterBookings = useCallback(() => {
    let filtered = pendingBookings;

    // Filter by meeting
    if (selectedMeeting !== 'all') {
      filtered = filtered.filter(booking => 
        booking.meeting?.id === selectedMeeting
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(booking => 
        booking.participant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.participant_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.meeting?.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredBookings(filtered);
  }, [pendingBookings, searchQuery, selectedMeeting]);

  useEffect(() => {
    fetchPendingBookings();
  }, [fetchPendingBookings]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const handleApprove = async (bookingId) => {
    try {
      await meetingsAPI.approveBooking(bookingId);
      setToast({
        type: 'success',
        message: 'Booking approved successfully!'
      });
      fetchPendingBookings(); // Refresh the list
    } catch (error) {
      console.error('Error approving booking:', error);
      setToast({
        type: 'error',
        message: 'Failed to approve booking'
      });
    }
  };

  const handleReject = async () => {
    try {
      await meetingsAPI.rejectBooking(bookingToReject.id, rejectReason);
      setToast({
        type: 'success',
        message: 'Booking rejected successfully!'
      });
      fetchPendingBookings(); // Refresh the list
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setToast({
        type: 'error',
        message: 'Failed to reject booking'
      });
    } finally {
      setShowRejectModal(false);
      setBookingToReject(null);
      setRejectReason('');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
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
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Time';
    }
  };

  const getUniqueMeetings = () => {
    const meetings = pendingBookings
      .map(booking => booking.meeting)
      .filter(meeting => meeting)
      .filter((meeting, index, self) => 
        index === self.findIndex(m => m.id === meeting.id)
      );
    return meetings;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
          <p className="mt-2 text-gray-600">Review and manage candidate meeting requests</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingBookings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Meetings</p>
                <p className="text-2xl font-bold text-gray-900">{getUniqueMeetings().length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-green-100 text-green-800">
                <Clock className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Today's Requests</p>
                <p className="text-2xl font-gray-900">
                  {pendingBookings.filter(booking => {
                    const today = new Date().toDateString();
                    const bookingDate = new Date(booking.created_at).toDateString();
                    return today === bookingDate;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Meeting Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Meeting
              </label>
              <select
                value={selectedMeeting}
                onChange={(e) => setSelectedMeeting(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Meetings</option>
                {getUniqueMeetings().map((meeting) => (
                  <option key={meeting.id} value={meeting.id}>
                    {meeting.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Candidates
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or meeting title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pending Bookings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Pending Approvals
              <span className="ml-2 text-sm text-gray-500">({filteredBookings.length})</span>
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => (
                <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      {/* Meeting Info */}
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {booking.meeting?.title || 'Unknown Meeting'}
                        </h3>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {booking.meeting?.duration || 0} minutes
                          </div>
                          {booking.slot && (
                            <>
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {formatDate(booking.slot.start_time)}
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {formatTime(booking.slot.start_time)} - {formatTime(booking.slot.end_time)}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Candidate Info */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-gray-900 mb-3">Candidate Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{booking.participant_name}</span>
                          </div>
                          <div className="flex items-center">
                            <Mail className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">{booking.participant_email}</span>
                          </div>
                          {booking.participant_phone && (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-600">{booking.participant_phone}</span>
                            </div>
                          )}
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-600">
                              Requested {formatDate(booking.created_at)}
                            </span>
                          </div>
                        </div>
                        
                        {booking.notes && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-start">
                              <MessageSquare className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                              <span className="text-sm text-gray-600">{booking.notes}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 lg:mt-0 lg:ml-4">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </button>
                      
                      <button
                        onClick={() => {
                          setBookingToReject(booking);
                          setShowRejectModal(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                      
                      <button
                        onClick={() => navigate(`${ROUTES.MEETINGS}/${booking.meeting?.id}`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="View meeting details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No pending approvals</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || selectedMeeting !== 'all' 
                    ? 'No bookings match your current filters.'
                    : 'All candidate requests have been processed!'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        onConfirm={handleReject}
        title="Reject Booking"
        message={
          <div>
            <p className="mb-4">Are you sure you want to reject this booking request?</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={3}
              />
            </div>
          </div>
        }
        confirmText="Reject"
        confirmVariant="danger"
      />

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default PendingApprovals;
