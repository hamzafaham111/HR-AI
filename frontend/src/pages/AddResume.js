import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Toast from '../components/ui/Toast';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';

const AddResume = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
  });
  const [candidateInfo, setCandidateInfo] = useState({
    candidate_name: '',
    candidate_email: '',
    candidate_phone: '',
    candidate_location: '',
    years_experience: '',
    current_role: '',
    desired_role: '',
    salary_expectation: '',
    availability: '',
    tags: '',
    notes: ''
  });

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

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes('pdf')) {
      showToast('Please upload a PDF file', 'error');
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showToast('File size must be less than 10MB', 'error');
      return;
    }

    setUploadedFile(file);
  };

  const handleUploadOnly = async () => {
    if (!uploadedFile) {
      showToast('Please upload a resume first', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Create FormData with just the file
      const formData = new FormData();
      formData.append('file', uploadedFile);

      // Get the access token
      const token = localStorage.getItem('accessToken');
      console.log('Token for upload (handleUploadOnly):', token ? 'Token exists' : 'No token found');
      
      const response = await fetch(API_ENDPOINTS.RESUME_BANK.UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('Upload response status (handleUploadOnly):', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response (handleUploadOnly):', errorText);
      }

      if (response.ok) {
        showToast('Resume uploaded successfully!', 'success');
        setTimeout(() => {
          navigate('/resume-bank');
        }, 1000); // Navigate after 1 second to let user see the toast
      } else {
        throw new Error('Failed to upload resume');
      }
    } catch (error) {
      console.error('Error uploading resume:', error);
      showToast('Failed to upload resume. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWithInfo = async (e) => {
    e.preventDefault();
    
    if (!uploadedFile) {
      showToast('Please upload a resume first', 'warning');
      return;
    }

    if (!candidateInfo.candidate_name || !candidateInfo.candidate_email) {
      showToast('Please fill in candidate name and email', 'warning');
      return;
    }

    setLoading(true);

    try {
      // Create FormData with file and candidate info
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('candidate_name', candidateInfo.candidate_name);
      formData.append('candidate_email', candidateInfo.candidate_email);
      formData.append('candidate_phone', candidateInfo.candidate_phone || '');
      formData.append('candidate_location', candidateInfo.candidate_location || '');
      formData.append('years_experience', candidateInfo.years_experience || '');
      formData.append('current_role', candidateInfo.current_role || '');
      formData.append('desired_role', candidateInfo.desired_role || '');
      formData.append('salary_expectation', candidateInfo.salary_expectation || '');
      formData.append('availability', candidateInfo.availability || '');
      formData.append('tags', candidateInfo.tags || '');
      formData.append('notes', candidateInfo.notes || '');

      // Get the access token
      const token = localStorage.getItem('accessToken');
      console.log('Token for upload (handleSubmitWithInfo):', token ? 'Token exists' : 'No token found');
      
      const response = await fetch(API_ENDPOINTS.RESUME_BANK.UPLOAD, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      
      console.log('Upload response status (handleSubmitWithInfo):', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload error response (handleSubmitWithInfo):', errorText);
      }

      if (response.ok) {
        showToast('Resume added to bank successfully!', 'success');
        setTimeout(() => {
          navigate('/resume-bank');
        }, 1000); // Navigate after 1 second to let user see the toast
      } else {
        throw new Error('Failed to add resume to bank');
      }
    } catch (error) {
      console.error('Error adding resume to bank:', error);
      showToast('Failed to add resume to bank. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/resume-bank')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Resume Bank
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Add Resume to Bank</h1>
          <p className="text-gray-600 mt-2">Upload a resume to your resume bank</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Upload Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Resume</h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="text-4xl mb-4">📄</div>
              
              {!uploadedFile ? (
                <div>
                  <p className="text-lg font-medium text-gray-600 mb-4">
                    Upload a resume to get started
                  </p>
                  <label className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    📁 Choose PDF File
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-sm text-gray-500 mt-2">Supports PDF files up to 10MB</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-green-600 mb-2">
                    Resume uploaded successfully!
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    <strong>File:</strong> {uploadedFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Change file
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {uploadedFile && (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button
                onClick={handleUploadOnly}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Uploading...' : 'Upload Resume Only'}
              </button>
              
              <button
                onClick={() => setShowCandidateForm(!showCandidateForm)}
                className="px-6 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50"
              >
                {showCandidateForm ? 'Hide' : 'Add'} Candidate Information
              </button>
            </div>
          )}

          {/* Optional Candidate Information Form */}
          {showCandidateForm && uploadedFile && (
            <form onSubmit={handleSubmitWithInfo} className="border-t pt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Candidate Information (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      👤 Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={candidateInfo.candidate_name}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, candidate_name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📧 Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={candidateInfo.candidate_email}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, candidate_email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="john.doe@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📞 Phone Number
                    </label>
                    <input
                      type="tel"
                      value={candidateInfo.candidate_phone}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, candidate_phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📍 Location
                    </label>
                    <input
                      type="text"
                      value={candidateInfo.candidate_location}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, candidate_location: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📅 Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={candidateInfo.years_experience}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, years_experience: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💼 Current Role
                    </label>
                    <input
                      type="text"
                      value={candidateInfo.current_role}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, current_role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🎯 Desired Role
                    </label>
                    <input
                      type="text"
                      value={candidateInfo.desired_role}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, desired_role: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Lead Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      💰 Salary Expectation
                    </label>
                    <input
                      type="text"
                      value={candidateInfo.salary_expectation}
                      onChange={(e) => setCandidateInfo(prev => ({ ...prev, salary_expectation: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="$120,000 - $150,000"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ⏰ Availability
                  </label>
                  <select
                    value={candidateInfo.availability}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select availability</option>
                    <option value="immediately">Immediately</option>
                    <option value="2_weeks">2 weeks notice</option>
                    <option value="1_month">1 month notice</option>
                    <option value="3_months">3 months notice</option>
                    <option value="flexible">Flexible</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    🏷️ Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={candidateInfo.tags}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, tags: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="frontend, react, senior, remote"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    📝 Notes
                  </label>
                  <textarea
                    value={candidateInfo.notes}
                    onChange={(e) => setCandidateInfo(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about the candidate..."
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowCandidateForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding to Bank...' : 'Upload with Information'}
                </button>
              </div>
            </form>
          )}

          {/* Cancel Button */}
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/resume-bank')}
              className="px-6 py-2 text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </div>
  );
};

export default AddResume; 