import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  User, 
  Mail, 
  Phone, 
  FileText, 
  Upload, 
  Settings, 
  Eye,
  EyeOff,
  Move,
  GripVertical,
  Check,
  AlertCircle
} from 'lucide-react';

const ApplicationFormBuilder = ({ isOpen, onClose, onSave, existingForm = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basic_info: {
      applicant_name: { enabled: true, required: true, deletable: false },
      applicant_email: { enabled: true, required: true, deletable: false },
      applicant_phone: { enabled: true, required: false, deletable: true }
    },
    fields: [],
    requires_resume: true,
    allow_multiple_files: false,
    max_file_size_mb: 10,
    allowed_file_types: ['pdf', 'doc', 'docx']
  });

  useEffect(() => {
    if (existingForm) {
      // Handle existing forms that might not have the new basic_info structure
      const updatedFormData = {
        ...existingForm,
        basic_info: existingForm.basic_info || {
          applicant_name: { enabled: true, required: true, deletable: false },
          applicant_email: { enabled: true, required: true, deletable: false },
          applicant_phone: { enabled: true, required: false, deletable: true }
        }
      };
      setFormData(updatedFormData);
    }
  }, [existingForm]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateBasicInfoField = (fieldName, updates) => {
    setFormData(prev => ({
      ...prev,
      basic_info: {
        ...prev.basic_info,
        [fieldName]: {
          ...prev.basic_info[fieldName],
          ...updates
        }
      }
    }));
  };

  const toggleBasicInfoField = (fieldName) => {
    const field = formData.basic_info[fieldName];
    if (field.deletable) {
      updateBasicInfoField(fieldName, { enabled: !field.enabled });
    }
  };

  const addField = () => {
    const newField = {
      id: Date.now(),
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: []
    };
    setFormData(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
  };

  const removeField = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
  };

  const updateField = (fieldId, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    }));
  };

  const addOption = (fieldId) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { ...field, options: [...field.options, { value: '', label: '' }] }
          : field
      )
    }));
  };

  const updateOption = (fieldId, optionIndex, updates) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { 
              ...field, 
              options: field.options.map((option, index) => 
                index === optionIndex ? { ...option, ...updates } : option
              )
            }
          : field
      )
    }));
  };

  const removeOption = (fieldId, optionIndex) => {
    setFormData(prev => ({
      ...prev,
      fields: prev.fields.map(field => 
        field.id === fieldId 
          ? { 
              ...field, 
              options: field.options.filter((_, index) => index !== optionIndex)
            }
          : field
      )
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      alert('Please enter a form title');
      return;
    }
    
    // Ensure basic info fields are always enabled for required fields
    const updatedFormData = {
      ...formData,
      basic_info: {
        ...formData.basic_info,
        applicant_name: { ...(formData.basic_info?.applicant_name || {}), enabled: true, required: true, deletable: false },
        applicant_email: { ...(formData.basic_info?.applicant_email || {}), enabled: true, required: true, deletable: false },
        applicant_phone: { ...(formData.basic_info?.applicant_phone || {}), required: false, deletable: true }
      }
    };
    
    onSave(updatedFormData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden m-4 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {existingForm ? 'Edit Application Form' : 'Create Application Form'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  Configure the fields and settings for your job application form
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(95vh-200px)]">
          {/* Basic Form Settings */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Form Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                  placeholder="e.g., Software Engineer Application"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none bg-white"
                  placeholder="Brief description of the application form..."
                />
              </div>
            </div>
          </div>

          {/* Basic Information Fields */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Basic Information Fields</h3>
                <p className="text-sm text-gray-600 mt-1">Configure the basic applicant information fields that will appear on the application form.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name Field */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.basic_info?.applicant_name?.enabled 
                  ? 'border-green-200 bg-white shadow-sm' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <User className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Full Name</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Required</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Protected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Applicant's full name</p>
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.basic_info?.applicant_name?.enabled || false}
                      onChange={() => updateBasicInfoField('applicant_name', { enabled: !(formData.basic_info?.applicant_name?.enabled || false) })}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  {(formData.basic_info?.applicant_name?.enabled || false) ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.basic_info?.applicant_email?.enabled 
                  ? 'border-green-200 bg-white shadow-sm' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Mail className="w-4 h-4 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Email Address</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">Required</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Protected</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Applicant's email address</p>
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.basic_info?.applicant_email?.enabled || false}
                      onChange={() => updateBasicInfoField('applicant_email', { enabled: !(formData.basic_info?.applicant_email?.enabled || false) })}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  {(formData.basic_info?.applicant_email?.enabled || false) ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Phone Field */}
              <div className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                formData.basic_info?.applicant_phone?.enabled 
                  ? 'border-orange-200 bg-white shadow-sm' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-orange-100 rounded-lg">
                      <Phone className="w-4 h-4 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-gray-900">Phone Number</h4>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Optional</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Removable</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Applicant's phone number</p>
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.basic_info?.applicant_phone?.enabled || false}
                      onChange={() => toggleBasicInfoField('applicant_phone')}
                      className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Enabled</span>
                  </label>
                  <button
                    onClick={() => toggleBasicInfoField('applicant_phone')}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Remove phone field"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Resume Upload Settings */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Upload className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Resume Upload Settings</h3>
                <p className="text-sm text-gray-600 mt-1">Configure file upload requirements and restrictions.</p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Require Resume Upload</h4>
                    <p className="text-sm text-gray-600">Applicants must upload a resume to apply</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.requires_resume}
                    onChange={(e) => handleInputChange('requires_resume', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {formData.requires_resume && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 bg-white rounded-xl border-2 border-gray-200">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Multiple Files</h4>
                        <p className="text-sm text-gray-600">Allow applicants to upload multiple files</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.allow_multiple_files}
                          onChange={(e) => handleInputChange('allow_multiple_files', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Max File Size (MB)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.max_file_size_mb}
                        onChange={(e) => handleInputChange('max_file_size_mb', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                        min="1"
                        max="50"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <span className="text-sm text-gray-500">MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom Fields */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <GripVertical className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Custom Fields</h3>
                  <p className="text-sm text-gray-600 mt-1">Add custom fields to collect specific information from applicants.</p>
                </div>
              </div>
              <button
                onClick={addField}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                <div className="p-4 bg-orange-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No custom fields added yet</h4>
                <p className="text-gray-600 mb-4">Start building your form by adding custom fields</p>
                <button
                  onClick={addField}
                  className="inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Field
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <GripVertical className="w-4 h-4 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Field {index + 1}</h4>
                          <p className="text-sm text-gray-600">{field.label || 'Untitled Field'}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeField(field.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Field Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., experience_years"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Display Label <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Years of Experience"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Field Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="text">Text Input</option>
                          <option value="email">Email Input</option>
                          <option value="tel">Phone Input</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Dropdown Select</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">
                          Placeholder Text
                        </label>
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                          placeholder="e.g., Enter your years of experience"
                        />
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500 focus:ring-2"
                        />
                        <span className="ml-3 text-sm font-medium text-gray-700">This field is required</span>
                        {field.required && (
                          <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Required</span>
                        )}
                      </label>
                    </div>

                    {/* Options for select fields */}
                    {field.type === 'select' && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                              <Check className="w-4 h-4 text-blue-600" />
                            </div>
                            <label className="block text-sm font-semibold text-gray-700">
                              Dropdown Options
                            </label>
                          </div>
                          <button
                            onClick={() => addOption(field.id)}
                            className="flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors duration-200"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Option
                          </button>
                        </div>
                        
                        {field.options.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">No options added yet. Click "Add Option" to get started.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {field.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                                <div className="p-1.5 bg-gray-100 rounded-lg">
                                  <span className="text-xs font-medium text-gray-600">{optionIndex + 1}</span>
                                </div>
                                <input
                                  type="text"
                                  value={option.value}
                                  onChange={(e) => updateOption(field.id, optionIndex, { value: e.target.value })}
                                  placeholder="Option value"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                <input
                                  type="text"
                                  value={option.label}
                                  onChange={(e) => updateOption(field.id, optionIndex, { label: e.target.value })}
                                  placeholder="Display label"
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                />
                                <button
                                  onClick={() => removeOption(field.id, optionIndex)}
                                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="w-4 h-4" />
              <span>Form will be saved and applied to job applications</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 bg-white border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
              >
                <Save className="w-4 h-4 mr-2" />
                {existingForm ? 'Update Form' : 'Create Form'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationFormBuilder;
