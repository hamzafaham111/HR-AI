import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Link as LinkIcon, 
  Edit,
  Trash2,
  Copy,
  CheckCircle,
  XCircle,
  Play,
  Square,
  AlertCircle,
  Filter,
  Search,
  Eye,
  MoreHorizontal
} from 'lucide-react';
import { meetingsAPI } from '../services/api/api';
import { ROUTES } from '../constants/routes';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Toast from '../components/ui/Toast';

const Meetings = () => {
  const navigate = useNavigate();
  
  const [meetings, setMeetings] = useState([]);
  const [filteredMeetings, setFilteredMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Meetings', color: 'bg-gray-100 text-gray-800' },
    { value: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { value: 'open', label: 'Open for Bookings', color: 'bg-green-100 text-green-800' },
    { value: 'closed', label: 'Closed', color: 'bg-red-100 text-red-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];

  const fetchMeetings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await meetingsAPI.getMeetings();
      setMeetings(response.data || []);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      setToast({
        type: 'error',
        message: 'Failed to fetch meetings'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const filterMeetings = useCallback(() => {
    let filtered = meetings;

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(meeting => meeting.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  useEffect(() => {
    filterMeetings();
  }, [filterMeetings]);

  const handleDeleteMeeting = async () => {
    try {
      await meetingsAPI.deleteMeeting(meetingToDelete.id);
      setToast({
        type: 'success',
        message: 'Meeting deleted successfully'
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error deleting meeting:', error);
      setToast({
        type: 'error',
        message: 'Failed to delete meeting'
      });
    } finally {
      setShowDeleteModal(false);
      setMeetingToDelete(null);
    }
  };

  const handleOpenMeeting = async (meetingId) => {
    try {
      await meetingsAPI.openMeeting(meetingId);
      setToast({
        type: 'success',
        message: 'Meeting opened successfully!'
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error opening meeting:', error);
      setToast({
        type: 'error',
        message: 'Failed to open meeting'
      });
    }
  };

  const handleCloseMeeting = async (meetingId) => {
    try {
      await meetingsAPI.closeMeeting(meetingId);
      setToast({
        type: 'success',
        message: 'Meeting closed successfully!'
      });
      fetchMeetings();
    } catch (error) {
      console.error('Error closing meeting:', error);
      setToast({
        type: 'error',
        message: 'Failed to close meeting'
      });
    }
  };

  const copyMeetingLink = async (meetingId) => {
    if (meetingId) {
      let fullLink = ''; // Declare fullLink at function level
      try {
        // Generate public link using meeting ID - this should be the frontend route
        fullLink = `${window.location.origin}/meeting/${meetingId}`;
        
        // Simple fallback method that always works
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
          setToast({
            type: 'success',
            message: 'Meeting link copied to clipboard!'
          });
        } else {
          // Try modern method as backup
          if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(fullLink);
          } else {
            throw new Error('Copy command failed');
          }
        }
        
        document.body.removeChild(textArea);
        
      } catch (error) {
        setToast({
          type: 'error',
          message: 'Automatic copy failed. Use the manual copy option.'
        });
      }
    } else {
      setToast({
        type: 'error',
        message: 'No meeting ID available'
      });
    }
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(option => option.value === status);
    return statusOption ? statusOption.color : 'bg-gray-100 text-gray-800';
  };

  const getDisplayStatus = (meetingStatus) => {
    if (!meetingStatus) return 'Unknown';
    
    const status = meetingStatus.toLowerCase();
    
    // Map legacy statuses to new ones
    if (status === 'scheduled' || status === 'published') return 'draft';
    if (status === 'in_progress') return 'open';
    if (status === 'completed') return 'closed';
    
    // Handle the case where backend sends 'open' directly
    if (status === 'open') return 'open';
    
    return status;
  };

  const getStatusIcon = (status) => {
    const displayStatus = getDisplayStatus(status);
    
    switch (displayStatus) {
      case 'draft':
        return <Edit className="w-4 h-4" />;
      case 'open':
        return <LinkIcon className="w-4 h-4" />;
      case 'closed':
        return <XCircle className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Meetings</h1>
            <p className="mt-2 text-gray-600">Manage your meetings and track their progress</p>
          </div>
          <button
            onClick={() => navigate(ROUTES.CREATE_MEETING)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Meeting
          </button>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Status Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Meetings
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Meeting Overview</h3>
              <p className="text-sm text-gray-600">Total meetings and their current status</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary-600">{meetings.length}</p>
              <p className="text-sm text-gray-500">Total Meetings</p>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {statusOptions.slice(1).map((status) => {
              const count = meetings.filter(meeting => {
                const meetingStatus = meeting.status?.toLowerCase() || '';
                const expectedStatus = status.value.toLowerCase();
                
                if (meetingStatus === expectedStatus) return true;
                if (meetingStatus.includes(expectedStatus)) return true;
                
                // Handle legacy status mappings
                if (expectedStatus === 'draft' && (meetingStatus === 'scheduled' || meetingStatus === 'published')) return true;
                if (expectedStatus === 'open' && meetingStatus === 'published') return true;
                
                return false;
              }).length;
              
              return (
                <div key={status.value} className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-xs text-gray-500">{status.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statusOptions.slice(1).map((status) => {
            // Count meetings by status, handling both exact matches and partial matches
            const count = meetings.filter(meeting => {
              const meetingStatus = meeting.status?.toLowerCase() || '';
              const expectedStatus = status.value.toLowerCase();
              
              // Handle different status formats
              if (meetingStatus === expectedStatus) return true;
              if (meetingStatus.includes(expectedStatus)) return true;
              
              // Handle legacy status mappings
              if (expectedStatus === 'draft' && (meetingStatus === 'scheduled' || meetingStatus === 'published')) return true;
              if (expectedStatus === 'open' && meetingStatus === 'published') return true;
              
              return false;
            }).length;
            
            return (
              <div key={status.value} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${status.color}`}>
                    {getStatusIcon(status.value)}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{status.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Meetings List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedStatus === 'all' ? 'All Meetings' : statusOptions.find(s => s.value === selectedStatus)?.label}
              <span className="ml-2 text-sm text-gray-500">({filteredMeetings.length})</span>
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredMeetings.length > 0 ? (
              filteredMeetings.map((meeting) => (
                <div key={meeting.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {meeting.title}
                          </h3>
                          <p className="text-gray-600 mb-3">{meeting.description || 'No description'}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {meeting.duration || meeting.duration_minutes || 0} min
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {formatDate(meeting.created_at)}
                            </div>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {meeting.total_bookings || 0} bookings
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(getDisplayStatus(meeting.status))}`}>
                            {getStatusIcon(meeting.status)}
                            <span className="ml-1 capitalize">
                              {getDisplayStatus(meeting.status).replace('_', ' ')}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4 lg:mt-0 lg:ml-4">
                      {/* Show Copy Link button for all open meetings */}
                      {getDisplayStatus(meeting.status) === 'open' && (
                        <button
                          onClick={() => copyMeetingLink(meeting.id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                          title="Copy meeting link"
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          Copy Link
                        </button>
                      )}
                      
                      {getDisplayStatus(meeting.status) === 'draft' && (
                        <button
                          onClick={() => handleOpenMeeting(meeting.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          title="Open meeting"
                        >
                          <LinkIcon className="w-4 h-4 mr-1" />
                          Open
                        </button>
                      )}
                      
                      {getDisplayStatus(meeting.status) === 'open' && (
                        <button
                          onClick={() => handleCloseMeeting(meeting.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          title="Close meeting"
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Close
                        </button>
                      )}
                      
                      <button
                        onClick={() => navigate(`${ROUTES.MEETINGS}/${meeting.id}`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => navigate(`${ROUTES.MEETINGS}/${meeting.id}/edit`)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        title="Edit meeting"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          setMeetingToDelete(meeting);
                          setShowDeleteModal(true);
                        }}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Delete meeting"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No meetings found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery || selectedStatus !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by creating your first meeting.'
                  }
                </p>
                {!searchQuery && selectedStatus === 'all' && (
                  <div className="mt-6">
                    <button
                      onClick={() => navigate(ROUTES.CREATE_MEETING)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Meeting
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteMeeting}
        title="Delete Meeting"
        message={`Are you sure you want to delete "${meetingToDelete?.title || 'this meeting'}"? This action cannot be undone and will also delete all associated slots and bookings.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

      {/* Manual Copy Modal */}
      {/* Removed manual copy modal state and related code */}
      
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

export default Meetings;
