import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Users, Calendar, MapPin, Building, DollarSign, Copy, ExternalLink, FileText, Settings, EditIcon} from 'lucide-react';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import ApplicationFormBuilder from '../components/ApplicationFormBuilder';
import ApplicationsDataTable from '../components/ApplicationsDataTable';
import ApplicationDetailModal from '../components/ApplicationDetailModal';
import ProcessSelectionModal from '../components/ProcessSelectionModal';
import Toast from '../components/ui/Toast';
import { authenticatedFetch } from '../utils/api';
import { DetailPageSkeleton } from '../components/ui/SkeletonLoader';
import { API_ENDPOINTS } from '../config/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applicationForm, setApplicationForm] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [applications, setApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false
  });
  const [deletingJob, setDeletingJob] = useState(false);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });
  
  // Process selection modal state
  const [showProcessSelection, setShowProcessSelection] = useState(false);
  const [newlyCreatedProcess, setNewlyCreatedProcess] = useState(null);

  useEffect(() => {
    fetchJob();
    fetchApplicationForm();
    fetchApplications();
  }, [id]);

  // Check if we're returning from process creation
  useEffect(() => {
    if (location.state?.showProcessSelection && location.state?.newlyCreatedProcess) {
      setShowProcessSelection(true);
      setNewlyCreatedProcess(location.state.newlyCreatedProcess);
    }
  }, [location.state]);

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

  const fetchJob = async () => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/jobs/${id}`);
      if (response.ok) {
        const data = await response.json();
        setJob(data);
      } else {
        throw new Error('Failed to fetch job');
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      setError('Failed to load job details');
      showToast('Failed to load job details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationForm = async () => {
    try {
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/job-applications/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setApplicationForm(data.data);
      } else if (response.status === 404) {
        setApplicationForm(null);
      } else {
        throw new Error('Failed to fetch application form');
      }
    } catch (error) {
      console.error('Error fetching application form:', error);
      setApplicationForm(null);
    }
  };

  const deleteApplicationForm = async () => {
    try {
      const response = await authenticatedFetch(`${API_ENDPOINTS.JOB_APPLICATIONS.FORMS.DELETE(applicationForm.id)}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        showToast('Application form deleted successfully', 'success');
        setApplicationForm(null);
      } else {
        throw new Error('Failed to delete application form');
      }
    } catch (error) {
      console.error('Error deleting application form:', error);
      showToast('Failed to delete application form', 'error');
    }
  };

  const fetchApplications = async () => {
    try {
      setApplicationsLoading(true);
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/job-applications/${id}`);
      if (response.ok) {
        const data = await response.json();
        setApplications(data.data.applications || []);
      } else {
        console.error('Failed to fetch applications');
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setApplicationsLoading(false);
    }
  };

  const openDeleteModal = () => {
    setDeleteModal({
      isOpen: true
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false
    });
  };

  const deleteJob = async () => {
    try {
      setDeletingJob(true);
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/jobs/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast('Job posting deleted successfully', 'success');
        setTimeout(() => {
          navigate('/jobs');
        }, 1500);
      } else {
        throw new Error('Failed to delete job');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Failed to delete job posting', 'error');
    } finally {
      setDeletingJob(false);
    }
  };

  const copyApplicationLink = async () => {
    try {
      const applicationLink = `${window.location.origin}/job/${id}/apply`;
      await navigator.clipboard.writeText(applicationLink);
      showToast('Application link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Failed to copy link', 'error');
    }
  };

  const openApplicationForm = () => {
    const applicationLink = `${window.location.origin}/job/${id}/apply`;
    window.open(applicationLink, '_blank');
  };

  const handleSaveApplicationForm = async (formData) => {
    try {
      const url = applicationForm 
        ? `http://localhost:8000/api/v1/job-applications/forms/${applicationForm.id}`
        : `http://localhost:8000/api/v1/job-applications/forms/${id}`;
      
      const method = applicationForm ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setApplicationForm(data.data);
        setShowFormModal(false);
        showToast(
          applicationForm ? 'Application form updated successfully' : 'Application form created successfully',
          'success'
        );
      } else {
        throw new Error('Failed to save application form');
      }
    } catch (error) {
      console.error('Error saving application form:', error);
      showToast('Failed to save application form', 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  // Handle status updates
  const handleStatusUpdate = async (applicationId, newStatus, notes) => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/v1/job-applications/applications/${applicationId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: newStatus,
            notes: notes
          })
        }
      );

      if (response.ok) {
        showToast('Application status updated successfully', 'success');
        fetchApplications();
        setSelectedApplication(null);
      } else {
        throw new Error('Failed to update application status');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      showToast('Failed to update application status', 'error');
    }
  };

  const handleApproveApplication = (application) => {
    setSelectedApplication(application);
    setShowProcessSelection(true);
  };

  const handleProcessSelected = async (processId) => {
    try {
      const response = await authenticatedFetch(
        `http://localhost:8000/api/v1/job-applications/applications/${selectedApplication.id}/approve-and-add-to-process`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            hiring_process_id: processId,
            notes: `Approved and added to hiring process from job application`
          })
        }
      );

      if (response.ok) {
        showToast(`Candidate added to hiring process successfully!`, 'success');
        
        // Refresh applications list
        fetchApplications();
        
        // Note: Don't close the modal yet - user might want to add to more processes
        // Only close if this was the last process or user manually closes
        
      } else {
        throw new Error('Failed to approve application and add to process');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      showToast('Failed to approve application', 'error');
    }
  };

  const handleAllProcessesAssigned = () => {
    // Close modals after all processes are assigned
    setShowProcessSelection(false);
    setSelectedApplication(null);
    setNewlyCreatedProcess(null);
    
    // Clear navigation state
    navigate(location.pathname, { replace: true });
    
    showToast('All process assignments completed!', 'success');
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <DetailPageSkeleton title="Loading job details..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
          <p className="text-gray-600 mb-4">The job you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/jobs')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center">
                  <Building className="w-4 h-4 mr-1" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{job.location}</span>
                </div>
                {job.salary_range && (
                  <div className="flex items-center">
                    <DollarSign className="w-4 h-4 mr-1" />
                    <span>{job.salary_range}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/resume-bank/search-candidates/${job.id}`)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Users className="w-4 h-4 mr-2" />
                Find Candidates
              </button>
              <button
                onClick={() => navigate(`/jobs/${job.id}/edit`)}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </button>
              <button
                onClick={openDeleteModal}
                disabled={deletingJob}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingJob ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {deletingJob ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        {/* Job Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-semibold text-gray-900">Job Type</h3>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getJobTypeColor(job.job_type)}`}>
              {job.job_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-semibold text-gray-900">Experience Level</h3>
            </div>
            <span className="text-gray-700 capitalize">{job.experience_level}</span>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-2">
              <Calendar className="w-5 h-5 text-gray-400 mr-2" />
              <h3 className="font-semibold text-gray-900">Status</h3>
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${getStatusColor(job.status)}`}>
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Job Description */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
        </div>

        {/* Requirements */}
        {job.requirements && job.requirements.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
            <div className="space-y-3">
              {job.requirements.map((req, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{req.skill}</span>
                    <span className="text-gray-500 ml-2">({req.level})</span>
                    {req.is_required && (
                      <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                    )}
                  </div>
                  <span className="text-sm text-gray-600">Weight: {req.weight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {job.responsibilities && job.responsibilities.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
            <ul className="space-y-2">
              {job.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-blue-600 mr-2 mt-1">•</span>
                  <span className="text-gray-700">{resp}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {job.benefits && job.benefits.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
            <ul className="space-y-2">
              {job.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-600 mr-2 mt-1">•</span>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Job Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Posted on {formatDate(job.created_date)}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/jobs/${job.id}/applications`)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                View Applications
              </button>
            </div>
          </div>
        </div>

        {/* Application Form Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Application Form
            </h2>
      {applicationForm ?
          <button
          onClick={() => setShowFormModal(true)}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {applicationForm && <span><EditIcon className="w-4 h-4 mr-2" /> Edit Form</span>}
        </button>:<></>  
    }
          </div>

          {applicationForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <h3 className="font-semibold text-green-900">{applicationForm.title}</h3>
                  {applicationForm.description && (
                    <p className="text-green-700 text-sm mt-1">{applicationForm.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-sm text-green-600">
                    <span>Resume required: {applicationForm.requires_resume ? 'Yes' : 'No'}</span>
                    <span>Multiple files: {applicationForm.allow_multiple_files ? 'Yes' : 'No'}</span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={copyApplicationLink}
                    className="flex items-center px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    title="Copy application link"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </button>
                  <button
                    onClick={openApplicationForm}
                    className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    title="Open application form"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview
                  </button>
                  <button
                    onClick={deleteApplicationForm}
                    className="flex items-center px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    title="Delete application form"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Application Form</h3>
              <p className="text-gray-600 mb-4">
                Create a custom application form to collect information from job applicants.
              </p>
              <button
                onClick={() => setShowFormModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Settings className="w-4 h-4 mr-2" />
                Create Application Form
              </button>
            </div>
          )}
        </div>

        {/* Direct Applications */}
        <div className="mb-8">
          {applicationsLoading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading applications...</p>
            </div>
          ) : (
            <ApplicationsDataTable 
              applications={applications}
              onViewApplication={(application) => setSelectedApplication(application)}
              onApproveApplication={handleApproveApplication}
            />
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={deleteJob}
        title="Delete Job Posting"
        message={`Are you sure you want to delete the job posting "${job?.title}"? This action cannot be undone.`}
        confirmText={deletingJob ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        isLoading={deletingJob}
      />
      
      <ApplicationFormBuilder
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        onSave={handleSaveApplicationForm}
        existingForm={applicationForm}
      />
      
      <ApplicationDetailModal
        application={selectedApplication}
        isOpen={!!selectedApplication}
        onClose={() => setSelectedApplication(null)}
        onUpdateStatus={handleStatusUpdate}
      />
      
      <ProcessSelectionModal
        isOpen={showProcessSelection}
        onClose={() => setShowProcessSelection(false)}
        onProcessSelected={handleProcessSelected}
        onAllProcessesAssigned={handleAllProcessesAssigned}
        application={selectedApplication}
        newlyCreatedProcess={newlyCreatedProcess}
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

export default JobDetail; 