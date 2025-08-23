import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Check, Building, Users, Calendar } from 'lucide-react';

const ProcessSelectionModal = ({ 
  isOpen, 
  onClose, 
  onProcessSelected, 
  onAllProcessesAssigned,
  application,
  newlyCreatedProcess = null
}) => {
  const [processes, setProcesses] = useState([]);
  const [selectedProcesses, setSelectedProcesses] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch available processes when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvailableProcesses();
    }
  }, [isOpen]);

  // Set newly created process if available
  useEffect(() => {
    if (newlyCreatedProcess) {
      setSelectedProcesses(prev => new Set([...prev, newlyCreatedProcess.id]));
      // Add to processes list if not already there
      if (!processes.find(p => p.id === newlyCreatedProcess.id)) {
        setProcesses(prev => [newlyCreatedProcess, ...prev]);
      }
    }
  }, [newlyCreatedProcess, processes]);

  const fetchAvailableProcesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/v1/hiring-processes/available', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hiring processes');
      }

      const data = await response.json();
      setProcesses(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching hiring processes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewProcess = () => {
    // Store current application context
    // We need to get the job details page URL, not the current page
    const jobId = application?.job_id || application?.job?.id;
    const returnUrl = jobId ? `/jobs/${jobId}` : '/jobs';
    
    console.log('Creating new process, storing return URL:', returnUrl);
    console.log('Application data:', application);
    
    sessionStorage.setItem('pendingApplicationApproval', JSON.stringify({
      applicationId: application.id,
      returnUrl: returnUrl
    }));
    
    // Navigate to existing process creation page
    navigate('/hiring-processes/create');
  };

  const handleProcessSelection = () => {
    if (selectedProcesses.size > 0) {
      // Convert Set to Array and call the handler for each selected process
      Array.from(selectedProcesses).forEach(processId => {
        onProcessSelected(processId);
      });
      
      // Clear selections and call completion handler
      setSelectedProcesses(new Set());
      if (onAllProcessesAssigned) {
        onAllProcessesAssigned();
      }
    }
  };

  const handleProcessToggle = (processId) => {
    setSelectedProcesses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(processId)) {
        newSet.delete(processId);
      } else {
        newSet.add(processId);
      }
      return newSet;
    });
  };

  const handleClose = () => {
    setSelectedProcesses(new Set());
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Select Hiring Process for {application?.applicant_name}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Existing Processes */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Building size={20} className="mr-2" />
              Choose Existing Process:
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading processes...</p>
              </div>
            ) : processes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users size={48} className="mx-auto mb-3 text-gray-300" />
                <p>No hiring processes available</p>
                <p className="text-sm">Create your first process to get started</p>
              </div>
            ) : (
              <div className="space-y-3">
                {processes.map(process => (
                  <ProcessOption
                    key={process.id}
                    process={process}
                    isSelected={selectedProcesses.has(process.id)}
                    onSelect={() => handleProcessToggle(process.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Create New Process */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Plus size={20} className="mr-2" />
              Or create a new process:
            </h3>
            <button
              onClick={handleCreateNewProcess}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <Plus size={20} className="mr-2" />
              Create New Hiring Process
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleProcessSelection}
            disabled={selectedProcesses.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Check size={20} className="mr-2" />
            Add Candidate to {selectedProcesses.size > 0 ? `${selectedProcesses.size} Process${selectedProcesses.size > 1 ? 'es' : ''}` : 'Process'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Process Option Component
const ProcessOption = ({ process, isSelected, onSelect }) => {
  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onSelect()}
              className="mr-3 text-blue-600 focus:ring-blue-500"
            />
            <h4 className="font-medium text-gray-900">{process.process_name}</h4>
          </div>
          
          <div className="ml-6 space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <Building size={16} className="mr-2 text-gray-400" />
              <span>{process.company_name}</span>
            </div>
            <div className="flex items-center">
              <Users size={16} className="mr-2 text-gray-400" />
              <span>{process.position_title}</span>
            </div>
            <div className="flex items-center">
              <Calendar size={16} className="mr-2 text-gray-400" />
              <span>
                {process.total_candidates} candidate{process.total_candidates !== 1 ? 's' : ''} • 
                {process.active_candidates} active • 
                {process.hired_candidates} hired
              </span>
            </div>
            {process.department && (
              <div className="text-xs text-gray-500">
                Department: {process.department}
              </div>
            )}
          </div>
        </div>
        
        {isSelected && (
          <div className="ml-4">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessSelectionModal;
