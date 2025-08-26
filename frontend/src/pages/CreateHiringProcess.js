import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Building2,
  MapPin,
  Calendar,
  Target,
  FileText,
  Users,
  AlertCircle,
  Info
} from 'lucide-react';
import { authenticatedFetch } from '../utils/api';
import { API_ENDPOINTS } from '../config/api';
import Toast from '../components/ui/Toast';

const CreateHiringProcess = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: '', isVisible: false });
  const [showReturnBanner, setShowReturnBanner] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    process_name: '',
    company_name: '',
    position_title: '',
    department: '',
    location: '',
    description: '',
    priority: 'medium',
    target_hires: '',
    deadline: ''
  });

  // Stages state
  const [stages, setStages] = useState([
    { name: 'Application Review', description: 'Initial resume and application screening', order: 1 },
    { name: 'Phone Screen', description: 'Brief phone conversation with candidate', order: 2 },
    { name: 'Technical Interview', description: 'Technical assessment and skills evaluation', order: 3 },
    { name: 'Final Interview', description: 'Final interview with team lead or manager', order: 4 },
    { name: 'Offer', description: 'Job offer extended to candidate', order: 5 },
    { name: 'Hired', description: 'Candidate accepted offer and joined', order: 6 },
    { name: 'Rejected', description: 'Candidate was not selected', order: 7 }
  ]);

  const [errors, setErrors] = useState({});

  // Check if we're returning from application approval
  useEffect(() => {
    const pendingApproval = sessionStorage.getItem('pendingApplicationApproval');
    if (pendingApproval) {
      setShowReturnBanner(true);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 5000);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleStageChange = (index, field, value) => {
    setStages(prev => prev.map((stage, i) => 
      i === index ? { ...stage, [field]: value } : stage
    ));
  };

  const addStage = () => {
    const newOrder = Math.max(...stages.map(s => s.order)) + 1;
    setStages(prev => [...prev, {
      name: '',
      description: '',
      order: newOrder
    }]);
  };

  const removeStage = (index) => {
    if (stages.length <= 2) {
      showToast('Process must have at least 2 stages', 'error');
      return;
    }
    setStages(prev => prev.filter((_, i) => i !== index));
  };

  const reorderStages = (index, direction) => {
    const newStages = [...stages];
    const currentStage = newStages[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (swapIndex >= 0 && swapIndex < newStages.length) {
      const swapStage = newStages[swapIndex];
      
      // Swap orders
      const tempOrder = currentStage.order;
      currentStage.order = swapStage.order;
      swapStage.order = tempOrder;
      
      // Swap positions in array
      [newStages[index], newStages[swapIndex]] = [newStages[swapIndex], newStages[index]];
      
      setStages(newStages.sort((a, b) => a.order - b.order));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.process_name.trim()) {
      newErrors.process_name = 'Process name is required';
    }
    
    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required';
    }
    
    if (!formData.position_title.trim()) {
      newErrors.position_title = 'Position title is required';
    }
    
    if (formData.target_hires && (isNaN(formData.target_hires) || formData.target_hires < 1)) {
      newErrors.target_hires = 'Target hires must be a positive number';
    }
    
    if (formData.deadline && new Date(formData.deadline) < new Date()) {
      newErrors.deadline = 'Deadline cannot be in the past';
    }
    
    // Validate stages
    const stageErrors = [];
    stages.forEach((stage, index) => {
      if (!stage.name.trim()) {
        stageErrors.push(`Stage ${index + 1} name is required`);
      }
    });
    
    if (stageErrors.length > 0) {
      newErrors.stages = stageErrors.join(', ');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the form errors', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const processData = {
        ...formData,
        target_hires: formData.target_hires ? parseInt(formData.target_hires) : null,
        deadline: formData.deadline || null,
        stages: stages.map((stage, index) => ({
          ...stage,
          order: index + 1
        }))
      };
      
      const response = await authenticatedFetch(API_ENDPOINTS.HIRING_PROCESSES.CREATE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(processData)
      });
      
      if (response.ok) {
        const newProcess = await response.json();
        showToast('Hiring process created successfully');
        
        // Check if we're returning from application approval
        const pendingApproval = sessionStorage.getItem('pendingApplicationApproval');
        
        if (pendingApproval) {
          try {
            const { returnUrl } = JSON.parse(pendingApproval);
            
            // Clear the pending approval
            sessionStorage.removeItem('pendingApplicationApproval');
            
            // Navigate back to application approval with new process
            navigate(returnUrl, { 
              state: { 
                newlyCreatedProcess: newProcess,
                showProcessSelection: true 
              }
            });
          } catch (error) {
            console.error('Error parsing pending approval:', error);
            // Fallback to normal navigation
            setTimeout(() => {
              navigate('/hiring-processes');
            }, 1000);
          }
        } else {
          console.log('No pending approval, staying on creation page');
          // Don't navigate away - stay on the creation page
          // The user can manually navigate back or create another process
        }
      } else {
        throw new Error(`Creation failed with status: ${response.status}`);
      }
      
    } catch (error) {
      console.error('Error creating hiring process:', error);
      showToast('Failed to create hiring process', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate('/hiring-processes')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Hiring Process</h1>
          <p className="text-gray-600">Set up a new recruitment pipeline with custom stages</p>
        </div>
      </div>

      {showReturnBanner && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Info className="w-5 h-5 text-blue-500 mr-2" />
            <p className="text-sm text-blue-800">
              You have a pending application approval. Please complete it before creating a new hiring process.
            </p>
          </div>
          <button
            onClick={() => {
              sessionStorage.removeItem('pendingApplicationApproval');
              setShowReturnBanner(false);
            }}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-xs hover:bg-blue-700 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Basic Information</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Process Name *
              </label>
              <input
                type="text"
                name="process_name"
                value={formData.process_name}
                onChange={handleInputChange}
                placeholder="e.g., Senior Developer Hiring - Q1 2024"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.process_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.process_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.process_name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleInputChange}
                  placeholder="Company or client name"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.company_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.company_name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Position Title *
              </label>
              <input
                type="text"
                name="position_title"
                value={formData.position_title}
                onChange={handleInputChange}
                placeholder="e.g., Senior Software Engineer"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.position_title ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.position_title && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.position_title}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Engineering, Marketing"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g., Remote, New York, NY"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Hires
              </label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  name="target_hires"
                  value={formData.target_hires}
                  onChange={handleInputChange}
                  placeholder="How many people to hire"
                  min="1"
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.target_hires ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.target_hires && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.target_hires}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.deadline ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                  <AlertCircle className="w-4 h-4" />
                  <span>{errors.deadline}</span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              placeholder="Brief description of the hiring process and requirements"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        {/* Pipeline Stages */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-3 lg:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-md">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg lg:text-xl font-bold text-gray-900">Pipeline Stages</h2>
                <p className="text-sm text-gray-600 mt-1">Define your hiring process steps - candidates can move between any stage</p>
              </div>
            </div>
            <button
              type="button"
              onClick={addStage}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center space-x-2 w-full lg:w-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage</span>
            </button>
          </div>

          {errors.stages && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errors.stages}</span>
              </p>
            </div>
          )}

          <div className="space-y-4">
            {stages.sort((a, b) => a.order - b.order).map((stage, index) => (
              <div key={index} className="group relative">
                {/* Stage Connection Line */}
                {index < stages.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-6 bg-gradient-to-b from-primary-200 to-transparent hidden lg:block"></div>
                )}
                
                {/* Modern Stage Card Design - More Compact */}
                <div className="relative bg-white border-2 border-gray-100 hover:border-primary-200 rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary-50 group-hover:scale-[1.01]">
                  {/* Stage Number Badge - Smaller Floating Design */}
                  <div className="absolute -top-3 left-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white">
                      {stage.order}
                    </div>
                  </div>
                  
                  {/* Reorder Controls - Smaller Floating on Right */}
                  <div className="absolute top-3 right-3 flex flex-col space-y-1">
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => reorderStages(index, 'up')}
                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-300 rounded-md transition-all duration-200 hover:shadow-sm flex items-center justify-center"
                        title="Move up"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {index < stages.length - 1 && (
                      <button
                        type="button"
                        onClick={() => reorderStages(index, 'down')}
                        className="w-6 h-6 bg-white border border-gray-200 text-gray-500 hover:text-primary-600 hover:border-primary-300 rounded-md transition-all duration-200 hover:shadow-sm flex items-center justify-center"
                        title="Move down"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {/* Content Area - More Compact Spacing */}
                  <div className="mt-6 space-y-4">
                    {/* Stage Name Field - Full Width */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                        <span>Stage Name *</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={stage.name}
                          onChange={(e) => handleStageChange(index, 'name', e.target.value)}
                          placeholder="e.g., Phone Screen, Technical Interview"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 placeholder-gray-400 hover:border-gray-300 h-10 bg-gray-50 hover:bg-white focus:bg-white text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Stage Description Field - Full Width */}
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700 flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                        <span>Description</span>
                      </label>
                      <div className="relative">
                        <textarea
                          value={stage.description}
                          onChange={(e) => handleStageChange(index, 'description', e.target.value)}
                          placeholder="Brief description of what happens in this stage"
                          rows="2"
                          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 placeholder-gray-400 resize-none hover:border-gray-300 bg-gray-50 hover:bg-white focus:bg-white text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Delete Button - Smaller Bottom Right */}
                  <div className="absolute bottom-3 right-3">
                    <button
                      type="button"
                      onClick={() => removeStage(index)}
                      className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-400 hover:text-red-600 rounded-lg transition-all duration-200 hover:scale-110 flex items-center justify-center border border-red-200 hover:border-red-300"
                      title="Remove stage"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Empty State - More Compact */}
          {stages.length === 0 && (
            <div className="text-center py-8 lg:py-12">
              <div className="w-12 h-12 lg:w-16 lg:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 lg:mb-4">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-gray-400" />
              </div>
              <h3 className="text-base lg:text-lg font-semibold text-gray-900 mb-2">No stages added yet</h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto text-sm">Start building your hiring pipeline by adding the first stage</p>
              <button
                type="button"
                onClick={addStage}
                className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105 shadow-md w-full lg:w-auto"
              >
                Add First Stage
              </button>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/hiring-processes')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-8 py-2 rounded-lg transition-colors inline-flex items-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Process</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast(prev => ({ ...prev, isVisible: false }))}
      />
      </div>
    </>
  );
};

export default CreateHiringProcess;
