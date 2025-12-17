import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { resumesAPI } from '../services/api';
import logger from '../utils/logger';

const EditResume = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resume, setResume] = useState(null);
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
    notes: '',
    status: ''
  });

  useEffect(() => {
    fetchResume();
  }, [id]);

  const fetchResume = async () => {
    try {
      const data = await resumesAPI.getResume(id);
      setResume(data);
      setCandidateInfo({
        candidate_name: data.candidate_name || '',
        candidate_email: data.candidate_email || '',
        candidate_phone: data.candidate_phone || '',
        candidate_location: data.candidate_location || '',
        years_experience: data.years_experience?.toString() || '',
        current_role: data.current_role || '',
        desired_role: data.desired_role || '',
        salary_expectation: data.salary_expectation || '',
        availability: data.availability || '',
        tags: data.tags ? data.tags.join(', ') : '',
        notes: data.notes || '',
        status: data.status || ''
      });
    } catch (error) {
      logger.error('Error fetching resume:', error);
      showToast('Failed to load resume', 'error');
      navigate('/resume-bank');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!candidateInfo.candidate_name || !candidateInfo.candidate_email) {
      showToast('Please fill in candidate name and email', 'warning');
      return;
    }

    setSaving(true);

    try {
      const updateData = {
        candidate_name: candidateInfo.candidate_name,
        candidate_email: candidateInfo.candidate_email,
        candidate_phone: candidateInfo.candidate_phone || null,
        candidate_location: candidateInfo.candidate_location || null,
        years_experience: candidateInfo.years_experience ? parseInt(candidateInfo.years_experience) : null,
        current_role: candidateInfo.current_role || null,
        desired_role: candidateInfo.desired_role || null,
        salary_expectation: candidateInfo.salary_expectation || null,
        availability: candidateInfo.availability || null,
        tags: candidateInfo.tags ? candidateInfo.tags.split(',').map(tag => tag.trim()) : [],
        notes: candidateInfo.notes || null,
        status: candidateInfo.status || 'active'
      };

      await resumesAPI.updateResume(id, updateData);
      showToast('Resume updated successfully!', 'success');
      navigate('/resume-bank');
    } catch (error) {
      logger.error('Error updating resume:', error);
      showToast('Failed to update resume', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading resume...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600">Resume not found</p>
            <button
              onClick={() => navigate('/resume-bank')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Resume Bank
            </button>
          </div>
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
            onClick={() => navigate('/resume-bank')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Resume Bank
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Resume</h1>
          <p className="text-gray-600 mt-2">Update candidate information for this resume</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {/* Resume Info */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Resume File</h3>
            <p className="text-gray-600">
              <strong>Filename:</strong> {resume.filename}
            </p>
            <p className="text-gray-600">
              <strong>Uploaded:</strong> {new Date(resume.upload_date).toLocaleDateString()}
            </p>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit}>
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
                  📊 Status
                </label>
                <select
                  value={candidateInfo.status}
                  onChange={(e) => setCandidateInfo(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="archived">Archived</option>
                  <option value="rejected">Rejected</option>
                  <option value="hired">Hired</option>
                </select>
              </div>

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

            {/* Action Buttons */}
            <div className="mt-8 flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/resume-bank')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default EditResume; 