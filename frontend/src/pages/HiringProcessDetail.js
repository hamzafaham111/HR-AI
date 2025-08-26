import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Building2, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  Target,
  User,
  Mail,
  Phone,
  FileText,
  Download,
  Eye,
  Trash2,
  Plus,
  GitBranch,
  Search,
  MoreVertical,
  ChevronRight
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import Toast from '../components/ui/Toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const HiringProcessDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [process, setProcess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [deleting, setDeleting] = useState(false);
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [resumes, setResumes] = useState([]);
  const [filteredResumes, setFilteredResumes] = useState([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingCandidates, setAddingCandidates] = useState({}); // Track loading state per candidate
  const [candidateMenus, setCandidateMenus] = useState({}); // Track which candidate menus are open
  const [movingCandidates, setMovingCandidates] = useState({}); // Track candidates being moved
  const [deletingCandidates, setDeletingCandidates] = useState({}); // Track candidates being deleted
  const [deleteCandidateModal, setDeleteCandidateModal] = useState({
    isOpen: false,
    candidateId: null,
    candidateName: ''
  });
  const [deleteProcessModal, setDeleteProcessModal] = useState({
    isOpen: false
  });

  const showToastMessage = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
  };

  const openDeleteProcessModal = () => {
    setDeleteProcessModal({ isOpen: true });
  };

  const closeDeleteProcessModal = () => {
    setDeleteProcessModal({ isOpen: false });
  };

  const deleteProcess = async () => {
    try {
      setDeleting(true);
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.DELETE(id), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        showToastMessage('Hiring process deleted successfully');
        closeDeleteProcessModal();
        setTimeout(() => {
          navigate('/hiring-processes');
        }, 1500);
      } else {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting process:', error);
      showToastMessage('Failed to delete hiring process', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const openAddCandidateModal = async () => {
    setShowAddCandidateModal(true);
    setSearchTerm(''); // Reset search when opening modal
    await fetchResumes();
  };

  const closeAddCandidateModal = () => {
    setShowAddCandidateModal(false);
    setSearchTerm(''); // Reset search when closing modal
  };

  const toggleCandidateMenu = (candidateId) => {
    setCandidateMenus(prev => {
      // Close all other menus first, then toggle the clicked one
      const newState = {};
      Object.keys(prev).forEach(id => {
        newState[id] = false;
      });
      newState[candidateId] = !prev[candidateId];
      return newState;
    });
  };

  // Function to move candidate between stages (status defaults to 'pending')
  const moveCandidateToStage = async (candidateId, newStageId) => {
    try {
      setMovingCandidates(prev => ({ ...prev, [candidateId]: true }));
      
      // Find the target stage to check if it's a final stage
      const targetStage = process.stages.find(s => s.id === newStageId);
      
      // Determine the new status based on the target stage
      let finalStatus = 'pending';
      let notes = '';
      
      if (targetStage) {
        if (targetStage.is_final) {
          if (targetStage.name.toLowerCase().includes('hired')) {
            finalStatus = 'hired';
            notes = 'Candidate moved to Hired stage';
          } else if (targetStage.name.toLowerCase().includes('rejected')) {
            finalStatus = 'rejected';
            notes = 'Candidate moved to Rejected stage';
          }
        } else {
          // For non-final stages, always set to pending when moving
          finalStatus = 'pending';
          notes = 'Moved to new stage';
        }
      }
      
      const response = await authenticatedFetch(
        API_ENDPOINTS.HIRING_PROCESSES.MOVE_CANDIDATE(id, candidateId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            new_stage_id: newStageId,
            status: finalStatus,
            notes: notes
          })
        }
      );
      
      if (response.ok) {
        const action = targetStage?.is_final ? 'moved to final stage' : 'moved successfully';
        showToastMessage(`Candidate ${action}`);
        setCandidateMenus({}); // Close all menus
        fetchProcessDetail(); // Refresh the process data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to move candidate: ${response.status}`);
      }
    } catch (error) {
      console.error('Error moving candidate:', error);
      showToastMessage(error.message || 'Failed to move candidate', 'error');
    } finally {
      setMovingCandidates(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  // Function to open delete candidate modal
  const openDeleteCandidateModal = (candidateId, candidateName) => {
    setDeleteCandidateModal({
      isOpen: true,
      candidateId,
      candidateName
    });
  };

  // Function to close delete candidate modal
  const closeDeleteCandidateModal = () => {
    setDeleteCandidateModal({
      isOpen: false,
      candidateId: null,
      candidateName: ''
    });
  };

  // Function to delete candidate from process
  const deleteCandidateFromProcess = async () => {
    const { candidateId } = deleteCandidateModal;
    
    try {
      setDeletingCandidates(prev => ({ ...prev, [candidateId]: true }));
      
      // Use the candidate's unique ID if available, otherwise fall back to the provided ID
      const candidate = process.candidates.find(c => 
        c.id === candidateId || 
        c.resume_bank_entry_id === candidateId || 
        c.job_application_id === candidateId
      );
      
      const candidateIdToUse = candidate?.id || candidateId;
      
      const response = await authenticatedFetch(
        API_ENDPOINTS.HIRING_PROCESSES.REMOVE_CANDIDATE(id, candidateIdToUse),
        {
          method: 'PUT'
        }
      );
      
      if (response.ok) {
        showToastMessage('Candidate removed from process successfully');
        closeDeleteCandidateModal();
        fetchProcessDetail(); // Refresh the process data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to remove candidate: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing candidate:', error);
      showToastMessage(error.message || 'Failed to remove candidate', 'error');
    } finally {
      setDeletingCandidates(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  // Function to update candidate status independently (without changing stage)
  const updateCandidateStatus = async (candidateId, newStatus) => {
    try {
      setMovingCandidates(prev => ({ ...prev, [candidateId]: true }));
      
      // Get current candidate info - handle both resume bank and job application candidates
      const candidate = process.candidates.find(c => 
        c.resume_bank_entry_id === candidateId || c.job_application_id === candidateId
      );
      if (!candidate) {
        throw new Error('Candidate not found');
      }
      
      // Define status-specific notes
      const statusNotes = {
        'call_pending': 'Call pending with candidate',
        'interviewed': 'Candidate has been interviewed',
        'feedback_pending': 'Awaiting feedback from interviewers',
        'accepted': 'Candidate accepted the position'
      };
      
      const response = await authenticatedFetch(
        API_ENDPOINTS.HIRING_PROCESSES.MOVE_CANDIDATE(id, candidateId),
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            new_stage_id: candidate.current_stage_id, // Keep same stage
            status: newStatus,
            notes: statusNotes[newStatus] || 'Status updated'
          })
        }
      );
      
      if (response.ok) {
        showToastMessage(`Candidate status updated to ${newStatus.replace('_', ' ')}`);
        setCandidateMenus({}); // Close all menus
        fetchProcessDetail(); // Refresh the process data
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Failed to update status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating candidate status:', error);
      showToastMessage(error.message || 'Failed to update status', 'error');
    } finally {
      setMovingCandidates(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  const fetchResumes = async () => {
    try {
      setLoadingResumes(true);
      const response = await authenticatedFetch(API_ENDPOINTS.RESUME_BANK.LIST);
      
      if (response.ok) {
        const data = await response.json();
        const resumeList = Array.isArray(data) ? data : [];
        setResumes(resumeList);
        setFilteredResumes(resumeList);
      } else {
        console.error('Failed to fetch resumes:', response.status);
        showToastMessage('Failed to load resumes', 'error');
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
      showToastMessage('Failed to load resumes', 'error');
    } finally {
      setLoadingResumes(false);
    }
  };

  // Helper function to check if a candidate is already in the process
  const isCandidateAlreadyInProcess = (resumeId) => {
    if (!process || !process.candidates) return false;
    
    // Find the resume to get candidate email for additional check
    const resume = resumes.find(r => r.id === resumeId || r._id === resumeId);
    
    return process.candidates.some(candidate => {
      // Check by resume_bank_entry_id
      if (candidate.resume_bank_entry_id === resumeId) {
        return true;
      }
      // Check by email (additional safety check)
      if (resume && candidate.candidate_email && resume.candidate_email) {
        return candidate.candidate_email.toLowerCase() === resume.candidate_email.toLowerCase();
      }
      return false;
    });
  };

  const addCandidateToProcess = async (resumeId) => {
    try {
      // Check if candidate is already in the process (enhanced frontend validation)
      if (isCandidateAlreadyInProcess(resumeId)) {
        showToastMessage('This candidate is already in the process', 'error');
        return;
      }
      
      // Set loading state for this specific candidate
      setAddingCandidates(prev => ({ ...prev, [resumeId]: true }));
      
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.ADD_CANDIDATE(id), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resume_bank_entry_id: resumeId
        })
      });
      
      if (response.ok) {
        showToastMessage('Candidate added successfully');
        // Immediately update the process state to reflect the new candidate
        if (process) {
          const newCandidate = {
            resume_bank_entry_id: resumeId,
            candidate_name: resumes.find(r => r.id === resumeId || r._id === resumeId)?.candidate_name || 'Unknown Candidate',
            candidate_email: resumes.find(r => r.id === resumeId || r._id === resumeId)?.candidate_email || '',
            status: 'pending',
            current_stage_id: process.stages[0]?.id,
            assigned_at: new Date().toISOString(),
            application_source: 'resume_bank'
          };
          setProcess(prev => ({
            ...prev,
            candidates: [...(prev.candidates || []), newCandidate],
            total_candidates: (prev.total_candidates || 0) + 1,
            active_candidates: (prev.active_candidates || 0) + 1
          }));
        }
        closeAddCandidateModal();
        fetchProcessDetail(); // Refresh the process data
      } else {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle specific 400 error for already added candidate
        if (response.status === 400 && errorData.detail && errorData.detail.includes('already in this process')) {
          showToastMessage('This candidate is already in the process', 'error');
          // Refresh the process data to ensure UI is up to date
          fetchProcessDetail();
          return;
        }
        
        throw new Error(errorData.detail || `Failed to add candidate: ${response.status}`);
      }
    } catch (error) {
      console.error('Error adding candidate:', error);
      showToastMessage(error.message || 'Failed to add candidate', 'error');
    } finally {
      // Clear loading state for this candidate
      setAddingCandidates(prev => ({ ...prev, [resumeId]: false }));
    }
  };

  useEffect(() => {
    fetchProcessDetail();
  }, [id]);

  // Filter resumes based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredResumes(resumes);
    } else {
      const filtered = resumes.filter(resume =>
        resume.candidate_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resume.candidate_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (resume.candidate_skills && resume.candidate_skills.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (resume.candidate_location && resume.candidate_location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredResumes(filtered);
    }
  }, [searchTerm, resumes]);

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close all menus if clicking outside any candidate menu
      if (!event.target.closest('.candidate-menu')) {
        setCandidateMenus({});
      }
    };

    // Also close menus when pressing Escape key
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setCandidateMenus({});
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  const fetchProcessDetail = async () => {
    try {
      setLoading(true);
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.DETAIL(id));
      
      if (response.ok) {
        const data = await response.json();
        console.log('Process data received:', data);
        console.log('Candidates:', data.candidates);
        console.log('Stages:', data.stages);
        setProcess(data);
      } else {
        console.error('Failed to fetch process details:', response.status);
        showToastMessage('Failed to load process details', 'error');
      }
    } catch (error) {
      console.error('Error fetching process details:', error);
      showToastMessage('Failed to load process details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'coming_soon':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Helper function to get current stage info for a candidate
  const getCurrentStageInfo = (candidate) => {
    if (!candidate.current_stage_id || !process.stages) return null;
    return process.stages.find(stage => stage.id === candidate.current_stage_id);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!process) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Process Not Found</h2>
          <p className="text-gray-600 mb-6">The hiring process you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/hiring-processes"
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Hiring Processes</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
          <button
            onClick={() => navigate('/hiring-processes')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{process.process_name}</h1>
            <p className="text-gray-600">{process.company_name} • {process.position_title}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(process.status)}`}>
            <span className="capitalize">{process.status.replace('_', ' ')}</span>
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(process.priority)}`}>
            {process.priority.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Process Overview */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Overview</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <div className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{process.company_name}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                  <span className="text-gray-900">{process.position_title}</span>
                </div>
                
                {process.department && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <span className="text-gray-900">{process.department}</span>
                  </div>
                )}
                
                {process.location && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{process.location}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                {process.target_hires && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Hires</label>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{process.target_hires} candidates</span>
                    </div>
                  </div>
                )}
                
                {process.deadline && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-900">{formatDate(process.deadline)}</span>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created</label>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{formatDate(process.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {process.description && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{process.description}</p>
              </div>
            )}
          </div>

          {/* Hiring Pipeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Hiring Pipeline</h2>
              <button 
                onClick={openAddCandidateModal}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>
            </div>
            
            {/* Pipeline Stages */}
            {process?.stages && process.stages.length > 0 ? (
              <div className="space-y-6">
                {process.stages
                  .sort((a, b) => a.order - b.order)
                  .map((stage, index) => {
                    const stageCandidates = process.candidates?.filter(c => c.current_stage_id === stage.id) || [];
                    console.log(`Stage ${stage.name} (${stage.id}):`, stageCandidates);
                    const isLastStage = index === process.stages.length - 1;
                    
                    return (
                      <div key={stage.id} className="relative">
                        {/* Stage Header */}
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              stageCandidates.length > 0 ? 'bg-primary-600' : 'bg-gray-400'
                            }`}>
                              {stage.order}
                            </div>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">{stage.name}</h3>
                              {stage.description && (
                                <p className="text-sm text-gray-600">{stage.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              stageCandidates.length > 0 
                                ? 'bg-primary-100 text-primary-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {stageCandidates.length} candidate{stageCandidates.length !== 1 ? 's' : ''}
                            </span>
                            {stage.is_final && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                Final Stage
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Candidates in this stage */}
                        {stageCandidates.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                            {stageCandidates.map((candidate, index) => {
                              const currentStage = getCurrentStageInfo(candidate);
                              return (
                                <div key={`${candidate.resume_bank_entry_id || candidate.job_application_id || 'unknown'}-${candidate.candidate_email}-${index}`} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-primary-300 hover:scale-[1.02] relative group" style={{ zIndex: 1 }}>
                                  {/* Header with Avatar and Basic Info */}
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center space-x-3 flex-1">
                                      <div className="w-14 h-14 bg-gradient-to-br from-primary-100 via-primary-200 to-primary-300 rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                                        <User className="w-7 h-7 text-primary-700" />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-900 truncate text-lg mb-1">{candidate.candidate_name}</h4>
                                        <p className="text-sm text-gray-600 truncate flex items-center">
                                          <Mail className="w-3 h-3 mr-1" />
                                          {candidate.candidate_email}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Essential Badges - Clean and Compact */}
                                  <div className="flex items-center gap-2 mb-4">
                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                                      candidate.status === 'call_pending' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                      candidate.status === 'interviewed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                      candidate.status === 'feedback_pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                                      candidate.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                      candidate.status === 'hired' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                      candidate.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                      'bg-gray-50 text-gray-700 border border-gray-200'
                                    }`}>
                                      {candidate.status === 'call_pending' ? '📞 Call Pending' :
                                       candidate.status === 'interviewed' ? '✅ Interviewed' :
                                       candidate.status === 'feedback_pending' ? '⏳ Feedback' :
                                       candidate.status === 'accepted' ? '🎯 Accepted' :
                                       candidate.status === 'hired' ? '🏆 Hired' :
                                       candidate.status === 'rejected' ? '❌ Rejected' :
                                       '⏸️ Pending'}
                                    </span>
                                    
                                    <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${
                                      candidate.application_source === 'resume_bank' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                      candidate.application_source === 'job_application' ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                                      'bg-gray-50 text-gray-700 border border-gray-200'
                                    }`}>
                                      {candidate.application_source === 'resume_bank' ? '📄 Resume' :
                                       candidate.application_source === 'job_application' ? '🎯 Job App' :
                                       'Unknown'}
                                    </span>
                                  </div>
                                  
                                  {/* Quick Info Bar */}
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                                    <span className="flex items-center">
                                      <Calendar className="w-3 h-3 mr-1" />
                                      Added {new Date(candidate.assigned_at).toLocaleDateString()}
                                    </span>
                                    {candidate.notes && (
                                      <span className="flex items-center text-blue-600">
                                        <FileText className="w-3 h-3 mr-1" />
                                        Has Notes
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Expandable Details Section */}
                                  <div className="border-t border-gray-100 pt-3">
                                    <button
                                      onClick={() => {
                                        const detailsId = `details-${candidate.resume_bank_entry_id || candidate.job_application_id || candidate.candidate_email}-${stage.id}-${index}`;
                                        setCandidateMenus(prev => ({
                                          ...prev,
                                          [detailsId]: !prev[detailsId]
                                        }));
                                      }}
                                      className="w-full flex items-center justify-between text-sm text-gray-600 hover:text-gray-900 transition-colors py-2"
                                    >
                                      <span className="flex items-center">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View Details
                                      </span>
                                      <ChevronRight className={`w-4 h-4 transition-transform ${
                                        candidateMenus[`details-${candidate.resume_bank_entry_id || candidate.job_application_id || candidate.candidate_email}-${stage.id}-${index}`] ? 'rotate-90' : ''
                                      }`} />
                                    </button>
                                    
                                    {/* Collapsible Details */}
                                    {candidateMenus[`details-${candidate.resume_bank_entry_id || candidate.job_application_id || candidate.candidate_email}-${stage.id}-${index}`] && (
                                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                                        {candidate.notes && (
                                          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                                            <div className="font-medium text-gray-900 mb-1">Notes:</div>
                                            <p className="text-gray-600">{candidate.notes}</p>
                                          </div>
                                        )}
                                        
                                        {candidate.application_source === 'job_application' && candidate.job_id && (
                                          <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg">
                                            <div className="font-medium text-blue-900 mb-1">Job Application Details:</div>
                                            <p className="text-blue-700">Applied to Job: {candidate.job_id}</p>
                                          </div>
                                        )}
                                        
                                        <div className="text-xs text-gray-500">
                                          <p>Current Stage: {currentStage?.name || 'Unknown'}</p>
                                          <p>Stage Order: {currentStage?.order || 'N/A'}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Action Menu - Better Positioned */}
                                  <div className="absolute top-4 right-4 candidate-menu">
                                    {/* Create a unique identifier for each candidate based on source */}
                                    {(() => {
                                      // Create a truly unique identifier that includes stage and position
                                      let candidateId;
                                      const baseId = candidate.resume_bank_entry_id || candidate.job_application_id || candidate.candidate_email;
                                      candidateId = `${baseId}-${stage.id}-${index}`;
                                      return (
                                        <>
                                          <button 
                                            onClick={() => toggleCandidateMenu(candidateId)}
                                            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200 hover:shadow-sm"
                                            disabled={movingCandidates[candidateId]}
                                          >
                                            {movingCandidates[candidateId] ? (
                                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                                            ) : (
                                              <MoreVertical className="w-4 h-4 text-gray-500" />
                                            )}
                                          </button>

                                          {/* Dropdown Menu */}
                                          {candidateMenus[candidateId] && (
                                            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl z-[99999] border border-gray-200 overflow-hidden" style={{ zIndex: 99999 }}>
                                                                                              <div className="py-1">
                                                  {/* Move to Stage Section */}
                                                  <div className="px-4 py-3 text-xs font-semibold text-gray-700 border-b border-gray-100 bg-gray-50 uppercase tracking-wide">
                                                    Move to Stage
                                                  </div>
                                                {process.stages
                                                  .filter(s => s.id !== candidate.current_stage_id)
                                                  .sort((a, b) => a.order - b.order)
                                                  .map((targetStage) => (
                                                    <button
                                                      key={targetStage.id}
                                                      onClick={() => moveCandidateToStage(candidate.resume_bank_entry_id || candidate.job_application_id, targetStage.id)}
                                                      className={`block w-full text-left px-4 py-3 text-sm transition-colors hover:bg-gray-50 ${
                                                        targetStage.is_final 
                                                          ? 'text-purple-700 font-semibold' 
                                                          : 'text-gray-700'
                                                      }`}
                                                    >
                                                      {targetStage.order}. {targetStage.name}
                                                      {targetStage.is_final && (
                                                        <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                                          Final
                                                        </span>
                                                      )}
                                                    </button>
                                                  ))}
                                                
                                                {/* Status Update Section - Always show for status updates */}
                                                <div className="border-t border-gray-100 mt-1">
                                                  <div className="px-4 py-3 text-xs font-semibold text-gray-700 bg-gray-50 uppercase tracking-wide">
                                                    Update Status
                                                  </div>
                                                  <button
                                                    onClick={() => updateCandidateStatus(candidate.resume_bank_entry_id || candidate.job_application_id, 'call_pending')}
                                                    className="block w-full text-left px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
                                                  >
                                                    📞 Call Pending
                                                  </button>
                                                  <button
                                                    onClick={() => updateCandidateStatus(candidate.resume_bank_entry_id || candidate.job_application_id, 'interviewed')}
                                                    className="block w-full text-left px-4 py-3 text-sm text-green-700 hover:bg-green-50 transition-colors"
                                                  >
                                                    ✅ Interviewed
                                                  </button>
                                                  <button
                                                    onClick={() => updateCandidateStatus(candidate.resume_bank_entry_id || candidate.job_application_id, 'feedback_pending')}
                                                    className="block w-full text-left px-4 py-3 text-sm text-yellow-700 hover:bg-yellow-50 transition-colors"
                                                  >
                                                    ⏳ Feedback Pending
                                                  </button>
                                                  <button
                                                    onClick={() => updateCandidateStatus(candidate.resume_bank_entry_id || candidate.job_application_id, 'accepted')}
                                                    className="block w-full text-left px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors"
                                                  >
                                                    🎯 Accepted
                                                  </button>
                                          </div>
                                          
                                          {/* Final Stage Actions */}
                                          {currentStage?.is_final && (
                                            <div className="border-t border-gray-100 mt-1">
                                              <div className="px-4 py-3 text-xs font-semibold text-gray-700 bg-gray-50 uppercase tracking-wide">
                                                Final Stage Actions
                                              </div>
                                              <div className="px-4 py-3 text-sm text-gray-600 bg-green-50">
                                                {currentStage.name.toLowerCase().includes('hired') 
                                                  ? '✅ Candidate is hired' 
                                                  : '❌ Candidate is rejected'}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Delete Candidate Section */}
                                          <div className="border-t border-gray-100 mt-1">
                                            <div className="px-4 py-3 text-xs font-semibold text-gray-700 bg-gray-50 uppercase tracking-wide">
                                              Actions
                                            </div>
                                            <button
                                              onClick={() => openDeleteCandidateModal(
                                                candidate.resume_bank_entry_id || candidate.job_application_id,
                                                candidate.candidate_name
                                              )}
                                              className="block w-full text-left px-4 py-3 text-sm text-red-700 hover:bg-red-50 transition-colors"
                                            >
                                              🗑️ Remove from Process
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                            );
                          })}
                          </div>
                        ) : (
                          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
                            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-600 text-sm">No candidates at this stage</p>
                          </div>
                        )}

                        {/* Stage Connector Arrow */}
                        {!isLastStage && (
                          <div className="flex justify-center mb-2">
                            <div className="flex items-center space-x-2 text-gray-400">
                              <div className="w-8 border-t border-gray-300"></div>
                              <ChevronRight className="w-5 h-5" />
                              <div className="w-8 border-t border-gray-300"></div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No pipeline stages configured yet</p>
                <p className="text-sm text-gray-500">Set up your hiring stages to track candidate progress</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Candidate Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Overview</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Total Candidates</p>
                    <p className="text-lg font-semibold text-blue-600">{process.total_candidates}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Active</p>
                    <p className="text-lg font-semibold text-yellow-600">{process.active_candidates}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Hired</p>
                    <p className="text-lg font-semibold text-green-600">{process.hired_candidates}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Rejected</p>
                    <p className="text-lg font-semibold text-red-600">{process.rejected_candidates}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            
            <div className="space-y-3">
              <Link
                to={`/hiring-processes/${id}/edit`}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center space-x-2 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Edit Process</span>
              </Link>
              
              <button 
                onClick={openAddCandidateModal}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Candidate</span>
              </button>
              
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
              
              <button 
                onClick={openDeleteProcessModal}
                disabled={deleting}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg inline-flex items-center justify-center space-x-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>{deleting ? 'Deleting...' : 'Delete Process'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

     
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-50 to-blue-50">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Add Candidate to Process</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Select a candidate from your resume bank to add to "{process?.process_name}"
                </p>
              </div>
              <button
                onClick={closeAddCandidateModal}
                className="p-2 hover:bg-white hover:bg-opacity-80 rounded-lg transition-colors"
              >
                <XCircle className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search candidates by name, email, skills, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                {searchTerm && (
                  <p className="mt-2 text-sm text-gray-600">
                    Showing {filteredResumes.length} of {resumes.length} candidates
                  </p>
                )}
              </div>

              {loadingResumes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  <span className="ml-3 text-gray-600">Loading resumes...</span>
                </div>
              ) : filteredResumes.length === 0 ? (
                searchTerm ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No matching candidates found</h3>
                    <p className="text-gray-600">Try adjusting your search terms or clear the search to see all candidates.</p>
                    <button
                      onClick={() => setSearchTerm('')}
                      className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Clear search
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resumes found</h3>
                    <p className="text-gray-600 mb-6">Upload some resumes to your resume bank first.</p>
                    <Link
                      to="/resume-bank/add"
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg inline-flex items-center space-x-2 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Resume</span>
                    </Link>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {filteredResumes.map((resume) => (
                    <div key={resume.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-200 hover:shadow-sm transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          {/* Avatar */}
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-primary-600" />
                          </div>
                          
                          {/* Candidate Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="font-semibold text-gray-900 truncate">{resume.candidate_name}</h4>
                              {resume.candidate_skills && (
                                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                                  {resume.candidate_skills.split(',')[0]?.trim()}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="w-4 h-4" />
                                <span className="truncate">{resume.candidate_email}</span>
                              </div>
                              {resume.candidate_phone && (
                                <div className="flex items-center space-x-1">
                                  <Phone className="w-4 h-4" />
                                  <span>{resume.candidate_phone}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              {resume.candidate_location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="w-4 h-4" />
                                  <span>{resume.candidate_location}</span>
                                </div>
                              )}
                              {resume.years_of_experience && (
                                <div className="flex items-center space-x-1">
                                  <Clock className="w-4 h-4" />
                                  <span>{resume.years_of_experience} years exp.</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>Added {new Date(resume.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            
                            {resume.candidate_skills && (
                              <div className="mt-2">
                                <div className="flex flex-wrap gap-1">
                                  {resume.candidate_skills.split(',').slice(0, 4).map((skill, index) => (
                                    <span key={index} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                                      {skill.trim()}
                                    </span>
                                  ))}
                                  {resume.candidate_skills.split(',').length > 4 && (
                                    <span className="text-xs text-gray-500">
                                      +{resume.candidate_skills.split(',').length - 4} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="ml-4">
                          {isCandidateAlreadyInProcess(resume.id) ? (
                            <button
                              disabled={true}
                              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 bg-gray-400 cursor-not-allowed text-white"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Already Added</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => addCandidateToProcess(resume.id)}
                              disabled={addingCandidates[resume.id]}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center space-x-2 ${
                                addingCandidates[resume.id]
                                  ? 'bg-primary-400 cursor-not-allowed'
                                  : 'bg-primary-600 hover:bg-primary-700'
                              } text-white`}
                            >
                              {addingCandidates[resume.id] ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Adding...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
      </div>

      {/* Delete Process Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteProcessModal.isOpen}
        onClose={closeDeleteProcessModal}
        onConfirm={deleteProcess}
        title="Delete Hiring Process"
        message={`Are you sure you want to delete the hiring process "${process?.process_name}"? This action cannot be undone.`}
        confirmText={deleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
        type="danger"
        isLoading={deleting}
      />

      {/* Delete Candidate Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteCandidateModal.isOpen}
        onClose={closeDeleteCandidateModal}
        onConfirm={deleteCandidateFromProcess}
        title="Remove Candidate from Process"
        message={`Are you sure you want to remove "${deleteCandidateModal.candidateName}" from this hiring process? This action cannot be undone.`}
        confirmText="Remove"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default HiringProcessDetail;
