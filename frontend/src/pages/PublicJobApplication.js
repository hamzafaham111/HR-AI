import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Briefcase, 
  Building, 
  MapPin, 
  Clock, 
  DollarSign,
  CheckCircle, 
  XCircle,
  Copy,
  Upload,
  FileText,
  User,
  Mail,
  Phone,
  Send,
  ArrowLeft
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';
import { apiRequest } from '../utils/api';
import Toast from '../components/ui/Toast';

const PublicJobApplication = () => {
  const { jobId } = useParams();
  
  const [job, setJob] = useState(null);
  const [applicationForm, setApplicationForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [toast, setToast] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const [applicationData, setApplicationData] = useState({
    applicant_name: '',
    applicant_email: '',
    applicant_phone: '',
    form_data: {}
  });
  
  const [resumeFiles, setResumeFiles] = useState([]);

  const fetchJobAndForm = async () => {
    try {
      setLoading(true);
      
      // Fetch job details
      const jobResponse = await apiRequest(API_ENDPOINTS.JOBS.PUBLIC_DETAIL(jobId));
      console.log({jobResponse})
      if (jobResponse && jobResponse.success && jobResponse.data) {
        console.log("jobResponse found")
        setJob(jobResponse.data);
      } else {
        throw new Error('Failed to fetch job details');
      }
      
      // Fetch application form - use temporary workaround
      console.log("about to hit")
      const formResponse = await apiRequest(API_ENDPOINTS.JOBS.PUBLIC_FORM_ENDPOINT(jobId));
      console.log({formResponse})
      if (formResponse && formResponse.success && formResponse.data) {
        setApplicationForm(formResponse.data);
      } else {
        throw new Error('Failed to fetch application form');
      }
      
    } catch (error) {
      setToast({
        type: 'error',
        message: 'Job not found or application form not available'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    if (jobId) {
      fetchJobAndForm().then(() => {
        if (isMounted) {
        }
      }).catch((error) => {
        if (isMounted) {
          console.error('Fetch failed:', error);
        }
      });
    }
    
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  const handleInputChange = (field, value) => {
    console.log('Input change:', field, value);
    setApplicationData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormFieldChange = (fieldName, value) => {
    console.log('Form field change:', fieldName, value);
    setApplicationData(prev => ({
      ...prev,
      form_data: {
        ...prev.form_data,
        [fieldName]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    console.log('File change:', files);
    setResumeFiles(files);
  };

  const copyApplicationLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setToast({
        type: 'success',
        message: 'Application link copied to clipboard!'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setToast({
        type: 'error',
        message: 'Failed to copy link'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('Submit function called');
    console.log('Application data:', applicationData);
    console.log('Resume files:', resumeFiles);
    
    if (!applicationData.applicant_name || !applicationData.applicant_email) {
      setToast({
        type: 'error',
        message: 'Please fill in all required fields'
      });
      return;
    }

    if (applicationForm?.requires_resume && resumeFiles.length === 0) {
      setToast({
        type: 'error',
        message: 'Resume upload is required'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare application data with resume file names
      const submitData = {
        ...applicationData,
        resume_files: resumeFiles.map(file => file.name) // Send file names for now
      };
      
      console.log('Submitting data:', submitData);
      console.log('Using endpoint:', API_ENDPOINTS.JOBS.PUBLIC_APPLY_ENDPOINT(jobId));
      
      const response = await apiRequest(API_ENDPOINTS.JOBS.PUBLIC_APPLY_ENDPOINT(jobId), 'POST', submitData);
      
      console.log('Submit response:', response);
      
      if (response && response.success) {
        setSubmitted(true);
      } else {
        throw new Error(response?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setToast({
        type: 'error',
        message: error.message || 'Failed to submit application'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderFormField = (field) => {
    const { type, label, required, options, placeholder } = field;
    
    switch (type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              value={applicationData.form_data[field.name] || ''}
              onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              placeholder={placeholder}
              required={required}
            />
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              value={applicationData.form_data[field.name] || ''}
              onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
              placeholder={placeholder}
              required={required}
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={field.name} className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              value={applicationData.form_data[field.name] || ''}
              onChange={(e) => handleFormFieldChange(field.name, e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              required={required}
            >
              <option value="">Select an option</option>
              {options?.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading job application...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto mb-8 flex items-center justify-center shadow-lg">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted Successfully!</h1>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            Thank you for your interest in the <span className="font-semibold text-blue-600">{job.title}</span> position at <span className="font-semibold text-blue-600">{job.company}</span>.
          </p>
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
            <div className="space-y-3 text-left">
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">1</span>
                </div>
                <p className="text-gray-700">We've received your application and will review it carefully.</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">2</span>
                </div>
                <p className="text-gray-700">Our team will contact you within 3-5 business days if your profile matches our requirements.</p>
              </div>
              <div className="flex items-start">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-sm font-semibold text-blue-600">3</span>
                </div>
                <p className="text-gray-700">You may also receive an email confirmation shortly.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  if (!job || !applicationForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-full p-4 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Job Not Found</h3>
          <p className="text-gray-600 mb-6">
            This job posting is not available or the application form has not been set up.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">


      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5"></div>
        <div className="relative max-w-6xl mx-auto px-4 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-600">Open Position</span>
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{job.title}</h1>
              <p className="text-lg text-gray-600 max-w-3xl leading-relaxed">{job.description}</p>
            </div>
            
            <div className="mt-6 lg:mt-0 lg:ml-8">
              <button
                onClick={copyApplicationLink}
                className={`inline-flex items-center px-6 py-3 border-2 font-semibold rounded-xl transition-all duration-200 ${
                  copied 
                    ? 'border-green-500 text-green-600 bg-green-50' 
                    : 'border-blue-500 text-blue-600 bg-white hover:bg-blue-50 hover:border-blue-600'
                }`}
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 mr-2" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Job Details Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Company</p>
                  <p className="text-lg font-semibold text-gray-900">{job.company}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-lg font-semibold text-gray-900">{job.location}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.jobType ? job.jobType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-500">Salary</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {job.salaryRange || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-6">
            <h2 className="text-2xl font-bold text-white">{applicationForm.title}</h2>
            {applicationForm.description && (
              <p className="text-blue-100 mt-2">{applicationForm.description}</p>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={applicationData.applicant_name}
                    onChange={(e) => handleInputChange('applicant_name', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={applicationData.applicant_email}
                    onChange={(e) => handleInputChange('applicant_email', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={applicationData.applicant_phone}
                  onChange={(e) => handleInputChange('applicant_phone', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            {/* Custom Form Fields */}
            {applicationForm.fields && applicationForm.fields.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Additional Information
                </h3>
                
                {applicationForm.fields.map(renderFormField)}
              </div>
            )}
            
            {/* Resume Upload */}
            {applicationForm.requires_resume && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Upload className="w-5 h-5 mr-2 text-blue-600" />
                  Resume Upload
                </h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple={applicationForm.allow_multiple_files}
                    accept={applicationForm.allowed_file_types.map(type => `.${type}`).join(',')}
                    onChange={handleFileChange}
                    className="hidden"
                    id="resume-upload"
                    required={applicationForm.requires_resume}
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {resumeFiles.length > 0 ? `${resumeFiles.length} file(s) selected` : 'Upload your resume'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {applicationForm.allow_multiple_files ? 'You can upload multiple files' : 'Single file upload'}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Allowed formats: {applicationForm.allowed_file_types.join(', ').toUpperCase()}
                    </p>
                  </label>
                </div>
                
                {resumeFiles.length > 0 && (
                  <div className="space-y-2">
                    {resumeFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Submitting Application...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

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

export default PublicJobApplication;
