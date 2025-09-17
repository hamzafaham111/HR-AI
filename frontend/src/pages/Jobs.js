import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, Trash2, Users, Calendar } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Toast from '../components/ui/Toast';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import { JobsSkeleton } from '../components/ui/SkeletonLoader';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    jobId: null,
    jobTitle: ''
  });
  const [deletingJobId, setDeletingJobId] = useState(null);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({
      isVisible: true,
      message,
      type
    });
  };

  const hideToast = () => {
    setToast({
      isVisible: false,
      message: '',
      type: 'info'
    });
  };

  const fetchJobs = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.JOBS.LIST);
      if (response.ok) {
        const data = await response.json();
        // Backend returns { success: true, data: [...] }
        setJobs(data.data || []);
      } else {
        throw new Error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      showToast('Failed to fetch jobs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (jobId, jobTitle) => {
    setDeleteModal({
      isOpen: true,
      jobId,
      jobTitle
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      jobId: null,
      jobTitle: ''
    });
  };

  const deleteJob = async () => {
    const { jobId } = deleteModal;
    
    try {
      setDeletingJobId(jobId);
      const response = await authenticatedFetch(API_ENDPOINTS.JOBS.DELETE(jobId), {
        method: 'DELETE',
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
        showToast('Job posting deleted successfully', 'success');
        closeDeleteModal();
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Failed to delete job posting', 'error');
    } finally {
      setDeletingJobId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getJobTypeColor = (type) => {
    switch (type) {
      case 'full_time':
        return 'bg-blue-100 text-blue-800';
      case 'part_time':
        return 'bg-purple-100 text-purple-800';
      case 'contract':
        return 'bg-orange-100 text-orange-800';
      case 'internship':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = (job.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (job.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                         (job.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <JobsSkeleton />;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Job Postings</h1>
            <p className="text-gray-600 mt-1">Manage your job postings and applications</p>
          </div>
          <button
            onClick={() => navigate('/jobs/create')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search jobs by title, company, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-600 mb-6">
              {jobs.length === 0 
                ? "You haven't created any job postings yet."
                : "No jobs match your current filters."
              }
            </p>
            {jobs.length === 0 && (
              <button
                onClick={() => navigate('/jobs/create')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Job Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {job.title}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View job"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/jobs/${job.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Edit job"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(job.id, job.title)}
                        disabled={deletingJobId === job.id}
                        className="p-1 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete job"
                      >
                        {deletingJobId === job.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{job.company}</p>
                  <p className="text-gray-500 text-sm mb-3">{job.location}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getJobTypeColor(job.jobType)}`}>
                      {job.jobType?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {job.description}
                  </p>
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Posted {formatDate(job.createdAt)}</span>
                    </div>
                    {job.salaryRange && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">💰</span>
                        <span className="ml-2">{job.salaryRange}</span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">📋</span>
                      <span className="ml-2">{job.requirements?.length || 0} requirements</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/jobs/${job.id}/applications`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Applications
                    </button>
                    <button
                      onClick={() => navigate(`/jobs/${job.id}`)}
                      className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteJob}
        title="Delete Job Posting"
        message={`Are you sure you want to delete the job posting "${deleteModal.jobTitle}"? This action cannot be undone.`}
        confirmText={deletingJobId ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        isLoading={!!deletingJobId}
      />
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};

export default Jobs; 