import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderPlus,
  Search,
  Filter,
  MoreVertical,
  Users,
  Calendar,
  MapPin,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  Pause,
  Target,
  Eye,
  Trash2
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import Toast from '../components/ui/Toast';

const HiringProcesses = () => {
  const [processes, setProcesses] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });

  // Process status options
  const statusOptions = [
    { value: '', label: 'All Processes' },
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'coming_soon', label: 'Coming Soon' }
  ];

  // Status styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'coming_soon': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Play className="w-3 h-3" />;
      case 'paused': return <Pause className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'coming_soon': return <Clock className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  // Priority styling
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      
      const queryString = params.toString();
      const url = queryString ? `${API_ENDPOINTS.HIRING_PROCESSES.LIST}?${queryString}` : API_ENDPOINTS.HIRING_PROCESSES.LIST;
      
      const response = await authenticatedFetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setProcesses(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch processes:', response.status);
        setProcesses([]);
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      showToast('Failed to load hiring processes', 'error');
      setProcesses([]); // Ensure processes is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.STATS);
      if (response.ok) {
        const data = await response.json();
        setStats(data || {});
      } else {
        console.error('Stats API response not ok:', response.status);
        setStats({});
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats({});
    }
  };

  const deleteProcess = async (processId) => {
    if (!window.confirm('Are you sure you want to delete this hiring process? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.DELETE(processId), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToast('Hiring process deleted successfully');
        fetchProcesses();
        fetchStats();
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting process:', error);
      showToast('Failed to delete hiring process', 'error');
    }
  };

  useEffect(() => {
    fetchProcesses();
    fetchStats();
  }, []);

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchProcesses();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && processes.length === 0) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hiring Processes</h1>
          <p className="text-gray-600">Manage your recruitment pipelines and track candidates</p>
        </div>
        <Link
          to="/hiring-processes/create"
          className="mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
        >
          <FolderPlus className="w-5 h-5" />
          <span>Create Process</span>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FolderPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Processes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_processes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Processes</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active_processes || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total_candidates || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Candidates Hired</p>
              <p className="text-2xl font-bold text-gray-900">{stats.candidates_hired || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by process name, company, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Process List */}
      <div className="space-y-4">
        {!processes || processes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FolderPlus className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hiring processes found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first hiring process.'
              }
            </p>
            {!searchTerm && !statusFilter && (
              <Link
                to="/hiring-processes/create"
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <FolderPlus className="w-5 h-5" />
                <span>Create First Process</span>
              </Link>
            )}
          </div>
        ) : (
          (processes || []).map((process) => (
            <div key={process.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-primary-200 group">
              {/* Header Section */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-3">
                      <Link
                        to={`/hiring-processes/${process.id}`}
                        className="text-xl font-bold text-gray-900 hover:text-primary-600 transition-colors group-hover:text-primary-600"
                      >
                        {process.process_name}
                      </Link>
                      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(process.status)}`}>
                        {getStatusIcon(process.status)}
                        <span className="capitalize">{process.status.replace('_', ' ')}</span>
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(process.priority)}`}>
                        {process.priority.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-6 text-gray-600 mb-2">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-primary-500" />
                        <span className="font-medium">{process.company_name}</span>
                      </div>
                      <div className="font-medium text-gray-800">{process.position_title}</div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {process.location && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{process.location}</span>
                        </div>
                      )}
                      {process.deadline && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Due: {formatDate(process.deadline)}</span>
                        </div>
                      )}
                      {process.target_hires && (
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>Target: {process.target_hires} hires</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <Link
                      to={`/hiring-processes/${process.id}`}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all duration-200"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deleteProcess(process.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                      title="Delete Process"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Section */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{process.total_candidates}</div>
                    <div className="text-xs text-blue-600 font-medium">Total</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mx-auto mb-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">{process.active_candidates}</div>
                    <div className="text-xs text-yellow-600 font-medium">Active</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full mx-auto mb-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-600">{process.hired_candidates}</div>
                    <div className="text-xs text-green-600 font-medium">Hired</div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full mx-auto mb-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div className="text-2xl font-bold text-red-600">{process.rejected_candidates}</div>
                    <div className="text-xs text-red-600 font-medium">Rejected</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                {process.target_hires > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{process.hired_candidates}/{process.target_hires} hired</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((process.hired_candidates / process.target_hires) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Section */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Created {formatDate(process.created_at)}
                  </div>
                  <Link
                    to={`/hiring-processes/${process.id}`}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Details</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
    </div>
  );
};

export default HiringProcesses;
