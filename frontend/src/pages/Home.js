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
    <div className="container mx-auto px-4 py-12">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to ResumeMatcher</h1>
        <p className="text-lg text-gray-600">Upload resumes and find the best candidates effortlessly.</p>
      </header>

      <section className="mb-16">
        <FileUpload onUpload={handleFileUpload} isUploading={isUploading} />
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center">
        {user ? (
          <Link to="/dashboard" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition">
            Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        ) : (
          <>
            <Link to="/login" className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition mr-4">
              <LogIn className="mr-2 w-4 h-4" /> Log In
            </Link>
            <Link to="/register" className="inline-flex items-center px-6 py-3 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700 transition">
              <UserPlus className="mr-2 w-4 h-4" /> Sign Up
            </Link>
          </>
        )}
      </footer>
    </div>
  );
};

export default Home; 