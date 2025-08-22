import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle, 
  XCircle,
  Copy,
  MapPin,
  ChevronRight,
  Shield,
  CalendarDays
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { apiRequest } from '../utils/api';
import Toast from '../components/ui/Toast';

const PublicMeeting = () => {
  const { meetingLink } = useParams();
  
  const [meeting, setMeeting] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [bookingForm, setBookingForm] = useState({
    participant_name: '',
    participant_email: '',
    participant_phone: '',
    notes: ''
  });

  const fetchMeetingInfo = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest(API_ENDPOINTS.MEETINGS.PUBLIC_INFO(meetingLink));
      
      if (response && response.success) {
        setMeeting(response.data.meeting);
        setAvailableSlots(response.data.available_slots);
      } else {
        throw new Error('Failed to fetch meeting info');
      }
    } catch (error) {
      console.error('Error fetching meeting info:', error);
      setToast({
        type: 'error',
        message: 'Meeting not found or no longer available'
      });
    } finally {
      setLoading(false);
    }
  }, [meetingLink]);

  useEffect(() => {
    fetchMeetingInfo();
    
    // Update current time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, [fetchMeetingInfo]);

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowBookingForm(true);
  };

  const handleInputChange = (field, value) => {
    setBookingForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!bookingForm.participant_name || !bookingForm.participant_email) {
      setToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setBookingLoading(true);
      
      // Prepare the booking data in the correct format
      const bookingData = {
        slot_id: selectedSlot.id,
        participant_name: bookingForm.participant_name,
        participant_email: bookingForm.participant_email,
        participant_phone: bookingForm.participant_phone || null,
        notes: bookingForm.notes || null
      };
      
      console.log('Booking data being sent:', bookingData);
      console.log('API endpoint:', API_ENDPOINTS.MEETINGS.BOOK_PUBLIC(meetingLink));
      
      let response;
      try {
        // Try the apiRequest function first
        response = await apiRequest(API_ENDPOINTS.MEETINGS.BOOK_PUBLIC(meetingLink), 'POST', bookingData);
      } catch (apiError) {
        console.log('apiRequest failed, trying direct fetch:', apiError);
        
        // Fallback to direct fetch
        const fetchResponse = await fetch(API_ENDPOINTS.MEETINGS.BOOK_PUBLIC(meetingLink), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        });
        
        if (!fetchResponse.ok) {
          const errorData = await fetchResponse.json().catch(() => ({}));
          throw new Error(errorData.detail || `HTTP error! status: ${fetchResponse.status}`);
        }
        
        response = await fetchResponse.json();
      }
      
      console.log('Booking response:', response);
      
      if (response && response.success) {
        setToast({
          type: 'success',
          message: 'Slot booked successfully! Check your email for confirmation.'
        });
        
        // Reset form and hide booking form
        setShowBookingForm(false);
        setSelectedSlot(null);
        setBookingForm({
          participant_name: '',
          participant_email: '',
          participant_phone: '',
          notes: ''
        });
        
        // Refresh available slots
        fetchMeetingInfo();
      } else {
        throw new Error(response?.message || 'Failed to book slot');
      }
    } catch (error) {
      console.error('Error booking slot:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to book slot'
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setToast({
        type: 'success',
        message: 'Meeting link copied to clipboard!'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to copy link'
      });
    }
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatShortDate = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrentTime = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrentDate = () => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const groupSlotsByDate = (slots) => {
    const grouped = {};
    slots.forEach(slot => {
      const date = formatDate(slot.start_time);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading meeting details...</p>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Meeting Not Found</h3>
          <p className="text-gray-600 mb-6">
            This meeting link is invalid or the meeting has been removed.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const groupedSlots = groupSlotsByDate(availableSlots);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Live Meeting</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{meeting.title}</h1>
              {meeting.description && (
                <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">{meeting.description}</p>
              )}
            </div>
            
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <button
                onClick={copyMeetingLink}
                className={`inline-flex items-center px-6 py-3 border-2 font-semibold rounded-xl transition-all duration-200 ${
                  copied 
                    ? 'border-green-500 text-green-600 bg-green-50' 
                    : 'border-blue-500 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-600'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Meeting Details Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">{meeting.duration_minutes} minutes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Participants</p>
                  <p className="text-lg font-semibold text-gray-900">Max {meeting.max_participants}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Timezone</p>
                  <p className="text-lg font-semibold text-gray-900">{meeting.timezone}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Booking Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {meeting.slot_selection_type === 'single' ? 'Single Slot' : 'Multiple Slots'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        {availableSlots.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="bg-white rounded-full p-6 w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 flex items-center justify-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No Available Slots</h3>
            <p className="text-gray-600 max-w-md mx-auto px-4">
              All time slots for this meeting have been booked. Please check back later or contact the meeting organizer.
            </p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Header with count and current time */}
            <div className="text-center px-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Available Time Slots</h2>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                {availableSlots.length} slot{availableSlots.length !== 1 ? 's' : ''} available • Click on a time to book
              </p>
              
              {/* Progress Bar */}
              <div className="max-w-md mx-auto mb-6">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Available Slots</span>
                  <span className="font-semibold">{availableSlots.length}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min((availableSlots.length / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Current Time Display */}
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-white rounded-full shadow-sm border border-gray-200">
                <Clock className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-xs sm:text-sm font-medium text-gray-700">
                  {formatCurrentDate()} • {formatCurrentTime()}
                </span>
              </div>
            </div>
            
            {/* Slots by Date */}
            {Object.entries(groupedSlots).map(([date, slots]) => (
              <div key={date} className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 shadow-lg overflow-hidden mx-2 sm:mx-0">
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
                    {date}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">{slots.length} slot{slots.length !== 1 ? 's' : ''} available</p>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
                    {slots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => handleSlotSelect(slot)}
                        className="group relative p-3 sm:p-4 text-center rounded-lg sm:rounded-xl border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-md hover:scale-105 transform"
                      >
                        <div className="text-sm sm:text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {formatTime(slot.start_time)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 group-hover:text-blue-600 transition-colors">
                          {formatShortDate(slot.start_time)}
                        </div>
                        <div className="absolute top-1 sm:top-2 right-1 sm:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                        </div>
                        
                        {/* Hover indicator */}
                        <div className="absolute inset-0 bg-blue-500 opacity-0 group-hover:opacity-5 rounded-lg sm:rounded-xl transition-opacity duration-200"></div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Enhanced Booking Form Modal */}
        {showBookingForm && selectedSlot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-4 sm:top-10 mx-auto p-4 sm:p-6 border w-full max-w-md shadow-2xl rounded-2xl bg-white mx-4 sm:mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Book Your Slot</h3>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
              
              {/* Selected Slot Info */}
              <div className="mb-6 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm font-medium text-blue-800">Selected Time</p>
                    <p className="text-sm sm:text-lg font-semibold text-blue-900">
                      {formatDate(selectedSlot.start_time)}
                    </p>
                    <p className="text-xs sm:text-sm text-blue-700">
                      {formatTime(selectedSlot.start_time)} ({meeting.duration_minutes} minutes)
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Booking Form */}
              <form onSubmit={handleBookingSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bookingForm.participant_name}
                    onChange={(e) => handleInputChange('participant_name', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={bookingForm.participant_email}
                    onChange={(e) => handleInputChange('participant_email', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={bookingForm.participant_phone}
                    onChange={(e) => handleInputChange('participant_phone', e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your phone number (optional)"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={bookingForm.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
                    placeholder="Any additional information or questions..."
                  />
                </div>
                
                {/* Security Note */}
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-600">
                    Your information is secure and will only be shared with the meeting organizer.
                  </p>
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-all duration-200 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg sm:rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl text-sm sm:text-base"
                  >
                    {bookingLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 h-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                        Booking...
                      </div>
                    ) : (
                      'Book Slot'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Floating Action Button */}
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
        <button
          onClick={copyMeetingLink}
          className={`group relative p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 ${
            copied 
              ? 'bg-green-500 hover:bg-green-600' 
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          title="Copy meeting link"
        >
          {copied ? (
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          ) : (
            <Copy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          )}
          
          {/* Tooltip - Hidden on mobile */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block">
            {copied ? 'Link copied!' : 'Copy meeting link'}
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default PublicMeeting;
