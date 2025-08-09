import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, Zap, Shield, BarChart3, ArrowRight, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import FileUpload from '../components/ui/FileUpload';
// resumeAPI removed - functionality moved to resume bank

const Home = () => {
  const [isUploading, setIsUploading] = useState(false);
  // Removed unused analysisId state
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect to dashboard if user is already logged in
  const redirectToDashboard = useCallback(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  React.useEffect(() => {
    redirectToDashboard();
  }, [redirectToDashboard]);

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    try {
      // Redirect to resume bank for upload
      navigate('/resume-bank');
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(error.response?.data?.detail || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const features = [
    {
      icon: <Brain className="w-8 h-8 text-primary-600" />,
      title: 'AI-Powered Matching',
      description: 'Advanced AI extracts candidate information and matches them with job requirements accurately.'
    },
    {
      icon: <Zap className="w-8 h-8 text-primary-600" />,
      title: 'Fast Processing',
      description: 'Quick resume processing with intelligent candidate matching for optimal results.'
    },
    {
      icon: <Shield className="w-8 h-8 text-primary-600" />,
      title: 'Secure & Private',
      description: 'Your data is processed securely with no permanent storage of sensitive information.'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-primary-600" />,
      title: 'Smart Insights',
      description: 'Get comprehensive candidate insights including skills, experience, and compatibility scores.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900">
          AI Resume Management
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4">
          Manage your resume bank and match candidates with job opportunities. 
          Powered by advanced AI for intelligent candidate matching.
        </p>
        
        {/* Authentication Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8 px-4">
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <LogIn className="w-5 h-5" />
            <span>Sign In</span>
          </Link>
          <Link
            to="/register"
            className="inline-flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            <UserPlus className="w-5 h-5" />
            <span>Sign Up</span>
          </Link>
        </div>
      </div>

      {/* Upload Section */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="card">
          <div className="text-center space-y-4 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900">
              Get Started
            </h2>
            <p className="text-gray-600">
              Upload a resume to add it to your resume bank
            </p>
          </div>
          
          <FileUpload 
            onFileUpload={handleFileUpload}
            isUploading={isUploading}
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Why Choose Our Resume Management?
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Our advanced AI system provides intelligent resume management and candidate matching
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card text-center space-y-4">
              <div className="flex justify-center">
                {feature.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Create an account to access the full dashboard with job management, resume bank, and advanced analytics.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/register"
            className="btn-primary inline-flex items-center space-x-2"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center space-x-2 px-6 py-3 border border-primary-600 text-primary-600 font-medium rounded-lg hover:bg-primary-50 transition-colors"
          >
            <span>Sign In</span>
          </Link>
        </div>
      </div>

      {/* How It Works */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary-600">1</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Upload Resume</h3>
            <p className="text-gray-600">
              Drag and drop your PDF resume or click to browse and select a file
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary-600">2</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Processing</h3>
            <p className="text-gray-600">
              Our advanced AI processes the resume and extracts candidate information
            </p>
          </div>

          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl font-bold text-primary-600">3</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Manage & Match</h3>
            <p className="text-gray-600">
              Manage your resume bank and match candidates with job opportunities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 