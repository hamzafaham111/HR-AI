import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save } from 'lucide-react';

const ApplicationFormBuilder = ({ isOpen, onClose, onSave, existingForm = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fields: [],
    requires_resume: true,
    allow_multiple_files: false,
    max_file_size_mb: 10,
    allowed_file_types: ['pdf', 'doc', 'docx']
  });

  useEffect(() => {
    if (existingForm) {
      setFormData(existingForm);
    }
  }, [existingForm]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
    onSave(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingForm ? 'Edit Application Form' : 'Create Application Form'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Form Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Form Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Software Engineer Application"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the application form..."
              />
            </div>
          </div>

          {/* Resume Upload Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Resume Upload Settings</h3>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.requires_resume}
                  onChange={(e) => handleInputChange('requires_resume', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Require resume upload</span>
              </label>
            </div>

            {formData.requires_resume && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allow Multiple Files
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.allow_multiple_files}
                      onChange={(e) => handleInputChange('allow_multiple_files', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow multiple file uploads</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max File Size (MB)
                  </label>
                  <input
                    type="number"
                    value={formData.max_file_size_mb}
                    onChange={(e) => handleInputChange('max_file_size_mb', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    max="50"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Custom Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Custom Fields</h3>
              <button
                onClick={addField}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No custom fields added yet.</p>
                <p className="text-sm">Click "Add Field" to start building your form.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.fields.map((field, index) => (
                  <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Field {index + 1}</h4>
                      <button
                        onClick={() => removeField(field.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.name}
                          onChange={(e) => updateField(field.id, { name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., experience_years"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Label <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateField(field.id, { label: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Years of Experience"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Field Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateField(field.id, { type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="text">Text</option>
                          <option value="email">Email</option>
                          <option value="tel">Phone</option>
                          <option value="textarea">Text Area</option>
                          <option value="select">Dropdown</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Placeholder
                        </label>
                        <input
                          type="text"
                          value={field.placeholder}
                          onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Enter your years of experience"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={field.required}
                          onChange={(e) => updateField(field.id, { required: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Required field</span>
                      </label>
                    </div>

                    {/* Options for select fields */}
                    {field.type === 'select' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options
                          </label>
                          <button
                            onClick={() => addOption(field.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {field.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center space-x-2 mb-2">
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) => updateOption(field.id, optionIndex, { value: e.target.value })}
                              placeholder="Value"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => updateOption(field.id, optionIndex, { label: e.target.value })}
                              placeholder="Display Label"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeOption(field.id, optionIndex)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {existingForm ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationFormBuilder;
