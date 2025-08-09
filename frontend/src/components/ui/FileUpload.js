import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const FileUpload = ({ onFileUpload, isUploading = false }) => {
  const [uploadStatus, setUploadStatus] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      // Validate file type
      if (!file.type.includes('pdf')) {
        setError('Please upload a PDF file');
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setError(null);
      setUploadStatus('uploading');
      
      try {
        await onFileUpload(file);
        setUploadStatus('success');
      } catch (err) {
        setError(err.message || 'Upload failed');
        setUploadStatus('error');
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    multiple: false,
    disabled: isUploading
  });

  const getStatusIcon = () => {
    if (uploadStatus === 'success') {
      return <CheckCircle className="w-8 h-8 text-green-500" />;
    }
    if (uploadStatus === 'error') {
      return <AlertCircle className="w-8 h-8 text-red-500" />;
    }
    if (isDragActive) {
      return <Upload className="w-8 h-8 text-primary-500" />;
    }
    return <FileText className="w-8 h-8 text-gray-400" />;
  };

  const getStatusText = () => {
    if (uploadStatus === 'success') {
      return 'File uploaded successfully!';
    }
    if (uploadStatus === 'error') {
      return 'Upload failed. Please try again.';
    }
    if (isDragActive) {
      return 'Drop your resume here...';
    }
    if (isUploading) {
      return 'Uploading and processing...';
    }
    return 'Drag & drop your resume here, or click to select';
  };

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : uploadStatus === 'success'
            ? 'border-green-500 bg-green-50'
            : uploadStatus === 'error'
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {getStatusIcon()}
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-gray-900">
              {getStatusText()}
            </p>
            <p className="text-sm text-gray-500">
              Supports PDF files up to 10MB
            </p>
          </div>

          {!isDragActive && !isUploading && uploadStatus !== 'success' && (
            <button
              type="button"
              className="btn-primary"
              onClick={(e) => e.stopPropagation()}
            >
              Choose File
            </button>
          )}

          {isUploading && (
            <div className="flex items-center space-x-2">
              <div className="loading-spinner"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {uploadStatus === 'success' && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-sm text-green-700">
              Resume uploaded successfully! Processing in progress...
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 