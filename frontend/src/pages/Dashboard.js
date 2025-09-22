import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FileText, Clock, CheckCircle, AlertCircle, Search, TrendingUp } from 'lucide-react';
import { dashboardAPI } from '../services/api/api';
import { DashboardSkeleton } from '../components/ui/SkeletonLoader';

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
    return <DashboardSkeleton />;
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
      </div>

      {/* Enhanced Statistics Cards */}
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
                <p className="text-sm font-medium text-gray-600">Hiring Processes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {overview.total_hiring_processes}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.statistics?.hiring_process_stats?.total || 0} total
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Meetings</p>
                <p className="text-2xl font-bold text-blue-600">
                  {overview.total_meetings}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {overview.statistics?.meeting_stats?.total || 0} total
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {overview?.recent_activity && overview.recent_activity.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
          <div className="space-y-4">
            {overview.recent_activity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">
                      {activity.timestamp ? formatDate(activity.timestamp) : 'Recently'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {overview?.ai_insights && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">AI Insights</h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">{overview.ai_insights.summary}</p>
            </div>
            
            {overview.ai_insights.recommendations && overview.ai_insights.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {overview.ai_insights.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applications Summary */}
      {overview?.total_applications !== undefined && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Applications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Total Applications</p>
                  <p className="text-2xl font-bold text-orange-600">{overview.total_applications}</p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Status</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {overview.total_applications > 0 ? 'Active' : 'No Applications'}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 