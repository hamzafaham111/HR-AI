import React from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Download,
  MapPin,
  Building,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

const ApplicationDetailModal = ({ application, isOpen, onClose, onUpdateStatus }) => {
  if (!isOpen || !application) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'shortlisted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'shortlisted':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStatusUpdate = (newStatus) => {
    if (onUpdateStatus) {
      onUpdateStatus(application.id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Application Details
            </h2>
            <p className="text-sm text-gray-500">
              ID: {application.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Applicant Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-blue-600" />
              Applicant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <p className="text-sm text-gray-900 mt-1">{application.applicant_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Mail className="w-4 h-4 mr-1 text-gray-400" />
                  {application.applicant_email}
                </p>
              </div>
              {application.applicant_phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900 mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-1 text-gray-400" />
                    {application.applicant_phone}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Applied On</label>
                <p className="text-sm text-gray-900 mt-1 flex items-center">
                  <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                  {formatDate(application.created_at)}
                </p>
              </div>
            </div>
          </div>

          {/* Application Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Application Status
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(application.status)}`}>
                  {getStatusIcon(application.status)}
                  <span className="ml-1 capitalize">{application.status}</span>
                </span>
              </div>
              
              {/* Status Update Buttons */}
              <div className="flex gap-2">
                {application.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('shortlisted')}
                      className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                    >
                      Shortlist
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {application.status === 'shortlisted' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      className="px-3 py-1 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      className="px-3 py-1 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(application.status === 'approved' || application.status === 'rejected') && (
                  <button
                    onClick={() => handleStatusUpdate('pending')}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                  >
                    Reset to Pending
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Form Data */}
          {application.form_data && Object.keys(application.form_data).length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(application.form_data).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}
                    </label>
                    <p className="text-sm text-gray-900 mt-1">
                      {typeof value === 'string' && value.length > 100 
                        ? `${value.substring(0, 100)}...` 
                        : value || 'Not provided'
                      }
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resume Files */}
          {application.resume_files && application.resume_files.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Resume Files ({application.resume_files.length})
              </h3>
              <div className="space-y-2">
                {application.resume_files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-blue-500 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{file}</p>
                        <p className="text-xs text-gray-500">Resume file</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> These resume files have been automatically added to the resume bank for future candidate matching.
                </p>
              </div>
            </div>
          )}

          {/* Notes Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
            <textarea
              placeholder="Add notes about this application..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
