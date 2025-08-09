import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Users, Eye, Edit, Trash2, Plus, BarChart3, MapPin, Calendar, Star } from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

const ResumeBank = () => {
  const navigate = useNavigate();
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    skills: '',
    experience_level: '',
    location: '',
    status: ''
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    resumeId: null,
    resumeName: ''
  });

  useEffect(() => {
    fetchResumeBank();
    fetchStats();
  }, []);

  const fetchResumeBank = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.RESUME_BANK.LIST);
      if (response.ok) {
        const data = await response.json();
        setResumes(data);
      } else {
        throw new Error('Failed to fetch resume bank');
      }
    } catch (error) {
      console.error('Error fetching resume bank:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.RESUME_BANK.STATS);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const openDeleteModal = (resumeId, resumeName) => {
    setDeleteModal({
      isOpen: true,
      resumeId,
      resumeName
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      resumeId: null,
      resumeName: ''
    });
  };

  const deleteResume = async () => {
    const { resumeId } = deleteModal;
    
    try {
      const response = await authenticatedFetch(API_ENDPOINTS.RESUME_BANK.DELETE(resumeId), {
        method: 'DELETE',
      });

      if (response.ok) {
        setResumes(resumes.filter(resume => resume.id !== resumeId));
        fetchStats(); // Refresh stats
      } else {
        throw new Error('Failed to delete resume');
      }
    } catch (error) {
      console.error('Error deleting resume:', error);
      alert('Failed to delete resume from bank');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
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

  const filteredResumes = resumes.filter(resume => {
    const matchesSearch = 
      resume.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resume.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (resume.current_role && resume.current_role.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSkills = !filters.skills || 
      (resume.skills && resume.skills.some(skill => 
        skill.toLowerCase().includes(filters.skills.toLowerCase())
      ));
    
    const matchesLocation = !filters.location || 
      (resume.candidate_location && resume.candidate_location.toLowerCase().includes(filters.location.toLowerCase()));
    
    const matchesStatus = !filters.status || resume.status === filters.status;
    
    return matchesSearch && matchesSkills && matchesLocation && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading resume bank...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Resume Bank</h1>
          <p className="text-gray-600 mt-1">Manage and search your candidate database</p>
        </div>
        <button
          onClick={() => navigate('/resume-bank/add')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Resume
        </button>
      </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_resumes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_resumes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Shortlisted</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.shortlisted_resumes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Recent (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent_uploads}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, or role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Skills..."
                value={filters.skills}
                onChange={(e) => setFilters(prev => ({ ...prev, skills: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Location..."
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="archived">Archived</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Resumes Grid */}
        {filteredResumes.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Users className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
            <p className="text-gray-600 mb-6">
              {resumes.length === 0 
                ? "Your resume bank is empty. Start by adding some resumes."
                : "No resumes match your current filters."
              }
            </p>
            {resumes.length === 0 && (
              <button
                onClick={() => navigate('/resume-bank/add')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Resume
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredResumes.map((resume) => (
              <div key={resume.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Resume Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {resume.candidate_name}
                    </h3>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => navigate(`/resume-bank/${resume.id}`)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                        title="View resume"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => navigate(`/resume-bank/${resume.id}/edit`)}
                        className="p-1 text-gray-400 hover:text-green-600"
                        title="Edit resume"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(resume.id, resume.candidate_name)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete resume"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{resume.candidate_email}</p>
                  {resume.current_role && (
                    <p className="text-gray-500 text-sm mb-3">{resume.current_role}</p>
                  )}
                  
                  <div className="flex flex-wrap gap-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(resume.status)}`}>
                      {resume.status.charAt(0).toUpperCase() + resume.status.slice(1)}
                    </span>
                    {resume.years_experience && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {resume.years_experience} years
                      </span>
                    )}
                  </div>
                </div>

                {/* Resume Details */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                    {resume.summary || 'No summary available'}
                  </p>
                  
                  {/* Skills Display */}
                  {resume.skills && resume.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-medium text-gray-700 mb-2">Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {resume.skills.slice(0, 5).map((skill, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {skill}
                          </span>
                        ))}
                        {resume.skills.length > 5 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{resume.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{resume.candidate_location || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Added {formatDate(resume.created_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-700">📋</span>
                      <span className="ml-2">{resume.skills ? resume.skills.length : 0} skills</span>
                    </div>
                    {resume.experience_level && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 mr-2" />
                        <span>{resume.experience_level} Level</span>
                      </div>
                    )}
                    {resume.overall_assessment && (
                      <div className="flex items-center">
                        <span className="font-medium text-gray-700">🎯</span>
                        <span className="ml-2 text-xs">{resume.overall_assessment}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/resume-bank/${resume.id}`)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </button>
                    <button
                      onClick={() => navigate(`/jobs?search=${resume.candidate_name}`)}
                      className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Find Jobs
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteResume}
        title="Delete Resume"
        message={`Are you sure you want to delete "${deleteModal.resumeName}" from the resume bank? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default ResumeBank; 