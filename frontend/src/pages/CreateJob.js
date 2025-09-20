import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Save, ArrowLeft, Upload, FileText, Edit3, Settings, Users } from 'lucide-react';
import Toast from '../components/ui/Toast';
import { authenticatedFetch } from '../utils/api';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('form'); // 'form', 'upload', 'editor', 'candidates'
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'full_time',
    experience_level: 'mid',
    description: '',
    salary_range: '',
    requirements: [],
    responsibilities: [],
    benefits: []
  });

  // Rich text editor state
  const [richTextContent, setRichTextContent] = useState('');
  const [parsedJobData, setParsedJobData] = useState(null);

  // File upload state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const [newRequirement, setNewRequirement] = useState({
    skill: '',
    level: 'intermediate',
    is_required: true,
    weight: 1.0
  });

  const [newResponsibility, setNewResponsibility] = useState('');
  const [newBenefit, setNewBenefit] = useState('');

  // Candidate matching state
  const [candidates, setCandidates] = useState([]);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [candidatesError, setCandidatesError] = useState(null);
  const [searchType, setSearchType] = useState('rule_based'); // 'rule_based' or 'semantic'
  
  // Toast state
  const [toast, setToast] = useState({
    isVisible: false,
    message: '',
    type: 'info'
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

  const jobTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceLevels = [
    { value: 'entry', label: 'Entry Level' },
    { value: 'junior', label: 'Junior' },
    { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' },
    { value: 'lead', label: 'Lead' }
  ];

  const skillLevels = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Expert' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addRequirement = () => {
    if (newRequirement.skill.trim()) {
      setFormData(prev => ({
        ...prev,
        requirements: [...prev.requirements, { ...newRequirement }]
      }));
      setNewRequirement({
        skill: '',
        level: 'intermediate',
        is_required: true,
        weight: 1.0
      });
    }
  };

  const removeRequirement = (index) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility.trim()]
      }));
      setNewResponsibility('');
    }
  };

  const removeResponsibility = (index) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (newBenefit.trim()) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, newBenefit.trim()]
      }));
      setNewBenefit('');
    }
  };

  const removeBenefit = (index) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const findCandidates = async () => {
    if (!formData.title || formData.requirements.length === 0) {
      showToast('Please add a job title and at least one requirement to find candidates', 'warning');
      return;
    }

    setCandidatesLoading(true);
    setCandidatesError(null);

    try {
      const jobCriteria = {
        title: formData.title,
        requirements: formData.requirements,
        location: formData.location,
        experience_level: formData.experience_level,
        job_type: formData.job_type
      };

      const response = await authenticatedFetch('http://localhost:8000/api/v1/resume-bank/find-candidates?limit=10&use_semantic_search=true', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jobCriteria),
      });

      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        setSearchType(data.search_criteria?.search_type || 'rule_based');
      } else {
        throw new Error('Failed to find candidates');
      }
    } catch (error) {
      console.error('Error finding candidates:', error);
      setCandidatesError('Failed to find candidates. Please try again.');
      showToast('Failed to find candidates. Please try again.', 'error');
    } finally {
      setCandidatesLoading(false);
    }
  };

  // File upload handling
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadedFile(file);
    setUploadLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get the access token for file upload
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('http://localhost:8000/api/v1/jobs/parse-document', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const parsedData = await response.json();
        setParsedJobData(parsedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
      } else {
        throw new Error('Failed to parse document');
      }
    } catch (error) {
      console.error('Error parsing document:', error);
      showToast('Failed to parse document. Please try again or use manual entry.', 'error');
    } finally {
      setUploadLoading(false);
    }
  };

  // Rich text parsing
  const parseRichText = async () => {
    if (!richTextContent.trim()) {
      showToast('Please enter job description content', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await authenticatedFetch('http://localhost:8000/api/v1/jobs/parse-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: richTextContent }),
      });

      if (response.ok) {
        const parsedData = await response.json();
        setParsedJobData(parsedData);
        setFormData(prev => ({
          ...prev,
          ...parsedData
        }));
        setActiveTab('form'); // Switch to form to review and edit
      } else {
        throw new Error('Failed to parse text');
      }
    } catch (error) {
      console.error('Error parsing text:', error);
      showToast('Failed to parse text. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setCandidatesError(null); // Clear previous candidate search errors
      
      const token = localStorage.getItem('accessToken');
      
      const response = await authenticatedFetch('http://localhost:8000/api/v1/jobs/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const job = await response.json();
        showToast('Job posting created successfully!', 'success');
        setTimeout(() => {
          navigate(`/jobs/${job.id}`);
        }, 1500);
      } else {
        const errorData = await response.text();
        console.error('Server error:', errorData);
        throw new Error(`Failed to create job posting: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error('Error creating job:', error);
      showToast(`Failed to create job posting: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'form', label: 'Detailed Form', icon: Settings },
    { id: 'upload', label: 'Upload Document', icon: Upload },
    { id: 'editor', label: 'Rich Text Editor', icon: Edit3 },
    { id: 'candidates', label: 'Find Candidates', icon: Users }
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Create Job Posting</h1>
          <p className="text-gray-600 mt-2">Choose your preferred method to create a job posting</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'form' && (
            <form onSubmit={handleSubmit} className="p-6">
              {/* Basic Information */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Senior Software Engineer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Company *
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., TechCorp Inc."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Job Type *
                    </label>
                    <select
                      name="job_type"
                      value={formData.job_type}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {jobTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Experience Level *
                    </label>
                    <select
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {experienceLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Salary Range
                    </label>
                    <input
                      type="text"
                      name="salary_range"
                      value={formData.salary_range}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., $80,000 - $120,000"
                    />
                  </div>
                </div>
              </div>

              {/* Job Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Provide a detailed description of the role, responsibilities, and what makes this position unique..."
                />
              </div>

              {/* Requirements */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="space-y-4">
                  {formData.requirements.map((req, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{req.skill}</span>
                          <span className="text-sm text-gray-500">({req.level})</span>
                          {req.is_required && (
                            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">Weight: {req.weight}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRequirement(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <input
                        type="text"
                        value={newRequirement.skill}
                        onChange={(e) => setNewRequirement(prev => ({ ...prev, skill: e.target.value }))}
                        placeholder="Skill name"
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={newRequirement.level}
                        onChange={(e) => setNewRequirement(prev => ({ ...prev, level: e.target.value }))}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {skillLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newRequirement.is_required}
                          onChange={(e) => setNewRequirement(prev => ({ ...prev, is_required: e.target.checked }))}
                          className="rounded"
                        />
                        <label className="text-sm text-gray-700">Required</label>
                      </div>
                      <button
                        type="button"
                        onClick={addRequirement}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Responsibilities</h2>
                <div className="space-y-2">
                  {formData.responsibilities.map((resp, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-gray-500">•</span>
                      <span className="flex-1">{resp}</span>
                      <button
                        type="button"
                        onClick={() => removeResponsibility(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newResponsibility}
                      onChange={(e) => setNewResponsibility(e.target.value)}
                      placeholder="Add a responsibility"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addResponsibility}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits</h2>
                <div className="space-y-2">
                  {formData.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-gray-500">•</span>
                      <span className="flex-1">{benefit}</span>
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newBenefit}
                      onChange={(e) => setNewBenefit(e.target.value)}
                      placeholder="Add a benefit"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={addBenefit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Create Job Posting
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'upload' && (
            <div className="p-6">
              <div className="text-center">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Upload Job Description</h2>
                <p className="text-gray-600 mb-6">
                  Upload a PDF or Word document containing your job description. 
                  We'll automatically extract and parse the information.
                </p>
                
                <div className="max-w-md mx-auto">
                  <label className="block w-full">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="text-center">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {uploadedFile ? uploadedFile.name : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PDF, DOC, or DOCX up to 10MB</p>
                      </div>
                    </div>
                  </label>
                </div>

                {uploadLoading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Processing document...</p>
                  </div>
                )}

                {parsedJobData && (
                  <div className="mt-6 max-w-2xl mx-auto">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="text-green-800 font-medium mb-2">Document Parsed Successfully!</h3>
                      <p className="text-green-700 text-sm mb-4">
                        Review the extracted information below and make any necessary adjustments.
                      </p>
                      <button
                        onClick={() => setActiveTab('form')}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                      >
                        Review & Edit
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Rich Text Editor</h2>
                <p className="text-gray-600">
                  Paste your job description here. We'll use AI to extract and structure the information.
                </p>
              </div>

              <div className="mb-6">
                <textarea
                  value={richTextContent}
                  onChange={(e) => setRichTextContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  placeholder={`Paste your job description here...

Example:
Senior Software Engineer
TechCorp Inc.
San Francisco, CA

We are looking for a Senior Software Engineer to join our team...

Requirements:
- 5+ years of experience with React
- Strong knowledge of TypeScript
- Experience with Node.js and Express

Responsibilities:
- Lead frontend development
- Mentor junior developers
- Collaborate with cross-functional teams

Benefits:
- Competitive salary
- Health insurance
- Remote work options`}
                />
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {richTextContent.length} characters
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => setRichTextContent('')}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Clear
                  </button>
                  <button
                    onClick={parseRichText}
                    disabled={loading || !richTextContent.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Parsing...
                      </>
                    ) : (
                      'Parse & Extract'
                    )}
                  </button>
                </div>
              </div>

              {parsedJobData && (
                <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-green-800 font-medium mb-2">Content Parsed Successfully!</h3>
                  <p className="text-green-700 text-sm mb-4">
                    The AI has extracted the job information. Review and edit the details.
                  </p>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                        Review & Edit
                      </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'candidates' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Find Compatible Candidates</h2>
                <p className="text-gray-600">
                  Search your resume bank for candidates that match this job's requirements.
                </p>
              </div>

              {/* Prerequisites Check */}
              {(!formData.title || formData.requirements.length === 0) && (
                <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-yellow-800 font-medium mb-2">Complete Job Details First</h3>
                  <p className="text-yellow-700 text-sm">
                    Please add a job title and at least one requirement in the "Detailed Form" tab before searching for candidates.
                  </p>
                  <button
                    onClick={() => setActiveTab('form')}
                    className="mt-2 bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
                  >
                    Go to Form
                  </button>
                </div>
              )}

              {/* Search Button */}
              {formData.title && formData.requirements.length > 0 && (
                <div className="mb-6">
                  <button
                    onClick={findCandidates}
                    disabled={candidatesLoading}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {candidatesLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Finding Candidates...
                      </>
                    ) : (
                      'Find Compatible Candidates'
                    )}
                  </button>
                </div>
              )}

              {/* Error Message */}
              {candidatesError && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{candidatesError}</p>
                </div>
              )}

              {/* Candidates Results */}
              {candidates.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Found {candidates.length} Compatible Candidates
                    </h3>
                    {searchType === 'semantic' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        🔍 AI-Powered Search
                      </span>
                    )}
                    {searchType === 'rule_based' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        📋 Rule-Based Search
                      </span>
                    )}
                  </div>
                  
                  {candidates.map((candidate, index) => (
                    <div key={candidate.resume_id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{candidate.candidate_name}</h4>
                          <p className="text-sm text-gray-600">{candidate.candidate_email}</p>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            {candidate.current_role && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {candidate.current_role}
                              </span>
                            )}
                            {candidate.years_experience && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {candidate.years_experience} years exp
                              </span>
                            )}
                            {candidate.candidate_location && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {candidate.candidate_location}
                              </span>
                            )}
                          </div>

                          {candidate.tags && candidate.tags.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Skills:</p>
                              <div className="flex flex-wrap gap-1">
                                {candidate.tags.slice(0, 5).map((tag, tagIndex) => (
                                  <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                    {tag}
                                  </span>
                                ))}
                                {candidate.tags.length > 5 && (
                                  <span className="text-xs text-gray-500">+{candidate.tags.length - 5} more</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              console.log('Navigating to candidate:', candidate.resume_id, 'Full candidate:', candidate);
                              navigate(`/resume-bank/${candidate.resume_id}`);
                            }}
                            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            View
                          </button>
                          <button
                            onClick={() => navigate(`/resume-bank/${candidate.resume_id}/edit`)}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* No Results */}
              {candidates.length === 0 && !candidatesLoading && !candidatesError && formData.title && formData.requirements.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No compatible candidates found. Try adjusting your job requirements.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
      />
    </>
  );
};

export default CreateJob; 