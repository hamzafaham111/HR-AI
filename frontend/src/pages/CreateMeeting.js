import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../constants/routes';
import { meetingsAPI } from '../services/api/api';
import Toast from '../components/ui/Toast';

const CreateMeeting = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: 30,
    meeting_type: 'meeting',
    timezone: 'UTC',
    max_participants: 1,
    is_public: true,
    requires_approval: false,
    allow_cancellation: true,
    start_date: '',
    end_date: '',
    buffer_time_before: 0,
    buffer_time_after: 0
  });

  const meetingTypeOptions = [
    { value: 'interview', label: 'Interview' },
    { value: 'call', label: 'Call' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'other', label: 'Other' }
  ];

  const durationOptions = [
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' }
  ];

  const timezoneOptions = [
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'Eastern Time' },
    { value: 'America/Chicago', label: 'Central Time' },
    { value: 'America/Denver', label: 'Mountain Time' },
    { value: 'America/Los_Angeles', label: 'Pacific Time' },
    { value: 'Europe/London', label: 'London' },
    { value: 'Europe/Paris', label: 'Paris' },
    { value: 'Asia/Tokyo', label: 'Tokyo' },
    { value: 'Asia/Shanghai', label: 'Shanghai' },
    { value: 'Australia/Sydney', label: 'Sydney' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start_date || !formData.end_date) {
      setToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    if (new Date(formData.start_date) > new Date(formData.end_date)) {
      setToast({
        type: 'error',
        message: 'End date must be after start date'
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await meetingsAPI.createMeeting(formData);
      
      // Check if response has the expected structure
      if (response && response.message) {
        setToast({
          type: 'success',
          message: 'Meeting created successfully!'
        });
        
        // Redirect to meetings list after a short delay
        setTimeout(() => {
          navigate(ROUTES.MEETINGS);
        }, 1500);
      } else {
        // Handle unexpected response format
        setToast({
          type: 'success',
          message: 'Meeting created successfully!'
        });
        
        setTimeout(() => {
          navigate(ROUTES.MEETINGS);
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating meeting:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to create meeting'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(ROUTES.MEETINGS)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Meeting</h1>
          <p className="text-gray-600">Set up a new meeting with available time slots</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter meeting title"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Type
              </label>
              <select
                value={formData.meeting_type}
                onChange={(e) => handleInputChange('meeting_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {meetingTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {durationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter meeting description (optional)"
            />
          </div>
        </div>

        {/* Time Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Time Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => handleInputChange('start_date', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => handleInputChange('end_date', e.target.value)}
                min={formData.start_date || new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {timezoneOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buffer Time Before (minutes)
              </label>
              <input
                type="number"
                value={formData.buffer_time_before}
                onChange={(e) => handleInputChange('buffer_time_before', parseInt(e.target.value))}
                min="0"
                max="60"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buffer Time After (minutes)
            </label>
            <input
              type="number"
              value={formData.buffer_time_after}
              onChange={(e) => handleInputChange('buffer_time_after', parseInt(e.target.value))}
              min="0"
              max="60"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Booking Settings
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Participants per Slot
              </label>
              <input
                type="number"
                value={formData.max_participants}
                onChange={(e) => handleInputChange('max_participants', parseInt(e.target.value))}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-6 space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.is_public}
                onChange={(e) => handleInputChange('is_public', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Make meeting publicly bookable</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.requires_approval}
                onChange={(e) => handleInputChange('requires_approval', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Require approval for bookings</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.allow_cancellation}
                onChange={(e) => handleInputChange('allow_cancellation', e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">Allow participants to cancel</span>
            </label>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700 font-medium">Meeting Type:</span>
              <span className="ml-2 text-blue-900">{meetingTypeOptions.find(opt => opt.value === formData.meeting_type)?.label}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Duration:</span>
              <span className="ml-2 text-blue-900">{formData.duration} minutes</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Timezone:</span>
              <span className="ml-2 text-blue-900">{formData.timezone}</span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(ROUTES.MEETINGS)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Meeting'}
          </button>
        </div>
      </form>

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

export default CreateMeeting;
