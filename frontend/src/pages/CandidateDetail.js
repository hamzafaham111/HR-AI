import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

const CandidateDetail = () => {
  const { candidateId } = useParams();
  const navigate = useNavigate();
  
  const [candidate, setCandidate] = useState(null);
  const [currentProcesses, setCurrentProcesses] = useState([]);
  const [processHistory, setProcessHistory] = useState([]);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCandidateDetails();
  }, [candidateId]);

  const fetchCandidateDetails = async () => {
    try {
      setLoading(true);
      console.log('Fetching candidate details for ID:', candidateId);
      if (!candidateId || candidateId === 'undefined') {
        throw new Error('Invalid candidate ID');
      }
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/resume-bank/candidate/${candidateId}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        setCandidate(data.candidate);
        setCurrentProcesses(data.current_processes || []);
        setProcessHistory(data.process_history || []);
        setPdfUrl(data.pdf_url ? `http://localhost:8000${data.pdf_url}` : null);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch candidate details: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidate details');
      console.error('Error fetching candidate details:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCandidateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const response = await authenticatedFetch(`http://localhost:8000/api/v1/resume-bank/candidate/${candidateId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          candidate_status: newStatus
        })
      });
      
      if (response.ok) {
        // Update local state
        setCandidate(prev => ({
          ...prev,
          candidate_status: newStatus
        }));
      } else {
        throw new Error('Failed to update candidate status');
      }
    } catch (err) {
      setError('Failed to update candidate status');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-100 text-green-800',
      in_process: 'bg-yellow-100 text-yellow-800',
      not_available: 'bg-red-100 text-red-800',
      hired: 'bg-blue-100 text-blue-800',
      rejected: 'bg-gray-100 text-gray-800',
      on_hold: 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      available: '🟢',
      in_process: '🟡',
      not_available: '🔴',
      hired: '✅',
      rejected: '❌',
      on_hold: '⏸️'
    };
    return icons[status] || '❓';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error || 'Candidate not found'}</p>
          <button
            onClick={() => navigate('/resume-bank')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Resume Bank
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/resume-bank')}
                className="mr-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                {candidate.candidate_name}
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(candidate.candidate_status)}`}>
                {getStatusIcon(candidate.candidate_status)} {candidate.candidate_status?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Left Column - Candidate Overview */}
          <div className="xl:col-span-1 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5">📧</div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-gray-900 font-medium">{candidate.candidate_email || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5">📱</div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900 font-medium">{candidate.candidate_phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5">📍</div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="text-gray-900 font-medium">{candidate.candidate_location || 'Not specified'}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5">💼</div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Experience</label>
                    <p className="text-gray-900 font-medium">
                      {candidate.years_experience ? `${candidate.years_experience} years` : 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-5 h-5 text-gray-400 mt-0.5">🎯</div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Current Role</label>
                    <p className="text-gray-900 font-medium">{candidate.current_role || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Skills Card */}
            {candidate.skills && candidate.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-sm rounded-lg border border-blue-200 font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Education Card */}
            {candidate.education && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
                  Education
                </h3>
                <p className="text-gray-700 leading-relaxed">{candidate.education}</p>
              </div>
            )}

            {/* Status Management Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-3"></span>
                Status Management
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Update Status</label>
                  <select
                    value={candidate.candidate_status}
                    onChange={(e) => updateCandidateStatus(e.target.value)}
                    disabled={updatingStatus}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="available">🟢 Available</option>
                    <option value="in_process">🟡 In Process</option>
                    <option value="not_available">🔴 Not Available</option>
                    <option value="hired">✅ Hired</option>
                    <option value="rejected">❌ Rejected</option>
                    <option value="on_hold">⏸️ On Hold</option>
                  </select>
                  {updatingStatus && (
                    <p className="text-sm text-gray-500 mt-2 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Updating...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Processes and Dashboard */}
          <div className="xl:col-span-2 space-y-6">
            {/* Dashboard Overview */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></span>
                Dashboard
              </h3>
              <p className="text-gray-600 mb-6">Overview of resume bank and job management.</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">3</div>
                  <div className="text-sm text-blue-600">Total Resumes</div>
                  <div className="text-xs text-gray-500">3 recent</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-green-600">Total Jobs</div>
                  <div className="text-xs text-gray-500">0 recent</div>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">1</div>
                  <div className="text-sm text-yellow-600">Hiring Processes</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">2</div>
                  <div className="text-sm text-purple-600">Meetings</div>
                </div>
              </div>
            </div>

            {/* Current Hiring Processes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></span>
                Current Hiring Processes
              </h3>
              {currentProcesses.length > 0 ? (
                <div className="space-y-4">
                  {currentProcesses.map((process, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{process.title}</h4>
                          <p className="text-sm text-gray-500">{process.company}</p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full font-medium">
                          {process.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📋</div>
                  <p className="text-gray-500">No current hiring processes</p>
                </div>
              )}
            </div>

            {/* Process History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-3"></span>
                Process History
              </h3>
              {processHistory.length > 0 ? (
                <div className="space-y-4">
                  {processHistory.map((process, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">{process.title}</h4>
                          <p className="text-sm text-gray-500">{process.company}</p>
                          <p className="text-xs text-gray-400">{process.date}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${
                          process.status === 'completed' ? 'bg-green-100 text-green-800' :
                          process.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {process.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 text-4xl mb-2">📊</div>
                  <p className="text-gray-500">No process history available</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resume Section - Full Width at Bottom */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                Resume
              </h3>
              <div className="flex space-x-3">
                {pdfUrl && (
                  <a
                    href={pdfUrl + '/download'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <span className="mr-2">📥</span>
                    Download PDF
                  </a>
                )}
                <button 
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center"
                >
                  <span className="mr-2">🖨️</span>
                  Print
                </button>
              </div>
            </div>
            
            {pdfUrl ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-[600px] border-0"
                  title="Resume PDF"
                />
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg p-12 text-center">
                <div className="text-gray-400 text-6xl mb-4">📄</div>
                <p className="text-gray-500 text-lg">PDF file not available</p>
                <p className="text-gray-400 text-sm mt-2">The resume PDF could not be loaded</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
