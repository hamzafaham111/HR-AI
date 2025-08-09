import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Clock, CheckCircle, AlertCircle, Search, TrendingUp } from 'lucide-react';
import { dashboardAPI } from '../services/api/api';

const Dashboard = () => {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const overviewData = await dashboardAPI.getOverview();
      setOverview(overviewData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      completed: 'badge-success',
      processing: 'badge-warning',
      failed: 'badge-error',
      pending: 'badge-info'
    };

    return (
      <span className={`badge ${statusClasses[status] || 'badge-info'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="loading-spinner"></div>
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Dashboard</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={loadDashboardData} className="btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of resume bank and job management</p>
        </div>
        <Link to="/resume-bank/add" className="btn-primary self-start sm:self-auto flex items-center">
          <FileText className="w-6 h-4 mr-2" />
          <span className="hidden sm:inline">Add Resume</span>
        </Link>
      </div>

      {/* Statistics Cards */}
      {overview && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Resumes</p>
                <p className="text-2xl font-bold text-gray-900">{overview.total_resumes}</p>
              </div>
              <FileText className="w-8 h-8 text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Jobs</p>
                <p className="text-2xl font-bold text-green-600">
                  {overview.total_jobs}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Resumes</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {overview.statistics?.resume_stats?.recent_uploads || 0}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Jobs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {overview.statistics?.job_stats?.recent_postings || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Skills Distribution */}
      {/* {overview?.statistics?.skills_distribution && Object.keys(overview.statistics.skills_distribution).length > 0 && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Top Skills</h2>
            <Link to="/resume-bank" className="text-primary-600 hover:text-primary-700 text-sm font-medium self-start sm:self-auto">
              View All Resumes →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(overview.statistics.skills_distribution)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 9)
              .map(([skill, count]) => (
                <div key={skill} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{skill}</span>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )} */}

      {/* Recent Activity */}
      {/* {overview?.statistics?.recent_activity && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Resume Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
                  <span className="text-sm font-bold text-blue-600">{overview.statistics.recent_activity.resumes_last_7_days || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Last 24 Hours</span>
                  <span className="text-sm font-bold text-green-600">{overview.statistics.recent_activity.resumes_last_24_hours || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Job Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Last 7 Days</span>
                  <span className="text-sm font-bold text-purple-600">{overview.statistics.recent_activity.jobs_last_7_days || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">Last 24 Hours</span>
                  <span className="text-sm font-bold text-orange-600">{overview.statistics.recent_activity.jobs_last_24_hours || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Dashboard; 