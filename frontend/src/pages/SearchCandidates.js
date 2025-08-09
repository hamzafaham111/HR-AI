import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, MapPin, Calendar, Star } from 'lucide-react';
import { authenticatedFetch } from '../utils/api';

const SearchCandidates = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
  const [job, setJob] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    skills: '',
    location: '',
    experience_min: '',
    experience_max: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0
  });
  const [sorting, setSorting] = useState({
    sortBy: 'score',
    sortOrder: 'desc'
  });

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId]);

  const fetchJobAndCandidates = async () => {
    try {
      // Fetch job details
      const jobResponse = await authenticatedFetch(`http://localhost:8000/api/v1/jobs/${jobId}`);
      if (jobResponse.ok) {
        const jobData = await jobResponse.json();
        setJob(jobData);
      }

      // Fetch candidates
      await fetchCandidates();
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.skills) params.append('skills', filters.skills);
      if (filters.location) params.append('location', filters.location);
      if (filters.experience_min) params.append('experience_min', filters.experience_min);
      if (filters.experience_max) params.append('experience_max', filters.experience_max);
      
      // Add pagination and sorting parameters
      params.append('page', pagination.page.toString());
      params.append('sort_by', sorting.sortBy);
      params.append('sort_order', sorting.sortOrder);

      const response = await authenticatedFetch(`http://localhost:8000/api/v1/resume-bank/search-candidates/${jobId}?${params}`);
      if (response.ok) {
        const data = await response.json();
        setCandidates(data.candidates || []);
        setPagination(prev => ({
          ...prev,
          total: data.total_candidates || 0,
          page: data.pagination?.page || 1,
          pageSize: data.pagination?.page_size || 10
        }));
      } else {
        throw new Error('Failed to fetch candidates');
      }
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setError('Failed to fetch candidates');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const applyFilters = () => {
    fetchCandidates();
  };

  const clearFilters = () => {
    setFilters({
      skills: '',
      location: '',
      experience_min: '',
      experience_max: ''
    });
    fetchCandidates();
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (newPageSize) => {
    setPagination(prev => ({ ...prev, pageSize: newPageSize, page: 1 }));
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSorting({ sortBy: newSortBy, sortOrder: newSortOrder });
  };

  // Refetch candidates when pagination or sorting changes
  useEffect(() => {
    fetchCandidates();
  }, [pagination.page, pagination.pageSize, sorting.sortBy, sorting.sortOrder]);

  const getMatchScore = (candidate) => {
    // Use the AI-generated compatibility score from backend
    if (candidate.compatibility_score && candidate.compatibility_score.overall_score !== undefined) {
      return Math.round(candidate.compatibility_score.overall_score);
    }
    
    // Fallback to simple scoring if no AI score available
    if (!job || !candidate.tags) return 0;
    
    const jobSkills = job.requirements?.map(req => req.skill.toLowerCase()) || [];
    const candidateSkills = candidate.tags.map(tag => tag.toLowerCase());
    
    const matches = jobSkills.filter(skill => 
      candidateSkills.some(candidateSkill => candidateSkill.includes(skill))
    );
    
    return Math.round((matches.length / jobSkills.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading candidates...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => navigate('/jobs')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Back to Jobs
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/jobs/${jobId}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Job
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Candidates for {job?.title}</h1>
          <p className="text-gray-600 mt-2">Found {pagination.total} compatible candidates</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Additional Skills</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., react, python"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                name="location"
                value={filters.location}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., San Francisco"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Experience</label>
              <input
                type="number"
                name="experience_min"
                value={filters.experience_min}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Experience</label>
              <input
                type="number"
                name="experience_max"
                value={filters.experience_max}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="20"
              />
            </div>
          </div>
          <div className="flex space-x-3 mt-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Sorting and Pagination Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
                <select
                  value={sorting.sortBy}
                  onChange={(e) => handleSortChange(e.target.value, sorting.sortOrder)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="score">Match Score</option>
                  <option value="experience">Experience</option>
                  <option value="name">Name</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <select
                  value={sorting.sortOrder}
                  onChange={(e) => handleSortChange(sorting.sortBy, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Show</label>
                <select
                  value={pagination.pageSize}
                  onChange={(e) => handlePageSizeChange(parseInt(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={5}>Top 5</option>
                  <option value={10}>Top 10</option>
                  <option value={20}>Top 20</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} candidates
            </div>
          </div>
        </div>

        {/* Candidates List */}
        <div className="space-y-4">
          {candidates.map((candidate, index) => {
            const matchScore = getMatchScore(candidate);
            return (
              <div key={candidate.id || index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{candidate.candidate_name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium">{matchScore}% match</span>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          matchScore >= 80 ? 'bg-green-100 text-green-800' :
                          matchScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {matchScore >= 80 ? 'Excellent' : matchScore >= 60 ? 'Good' : 'Fair'}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">{candidate.candidate_email}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {candidate.current_role && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {candidate.current_role}
                        </span>
                      )}
                      {candidate.years_experience && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Calendar className="w-3 h-3 mr-1" />
                          {candidate.years_experience} years
                        </span>
                      )}
                      {candidate.candidate_location && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <MapPin className="w-3 h-3 mr-1" />
                          {candidate.candidate_location}
                        </span>
                      )}
                    </div>

                    {candidate.tags && candidate.tags.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs text-gray-500 mb-1">Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {candidate.tags.slice(0, 8).map((tag, tagIndex) => (
                            <span key={tagIndex} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                              {tag}
                            </span>
                          ))}
                          {candidate.tags.length > 8 && (
                            <span className="text-xs text-gray-500">+{candidate.tags.length - 8} more</span>
                          )}
                        </div>
                      </div>
                    )}

                    {candidate.notes && (
                      <p className="text-sm text-gray-600 italic">"{candidate.notes}"</p>
                    )}
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/resume-bank/${candidate.id}`)}
                      className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button
                      onClick={() => navigate(`/resume-bank/${candidate.id}/edit`)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {candidates.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No candidates found</h3>
            <p className="text-gray-600">Try adjusting your filters or job requirements.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.total > pagination.pageSize && (
          <div className="flex justify-center items-center space-x-2 mt-8">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {Array.from({ length: Math.ceil(pagination.total / pagination.pageSize) }, (_, i) => i + 1)
              .filter(page => page === 1 || page === Math.ceil(pagination.total / pagination.pageSize) || 
                              Math.abs(page - pagination.page) <= 1)
              .map((page, index, array) => (
                <React.Fragment key={page}>
                  {index > 0 && array[index - 1] !== page - 1 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 border rounded-md text-sm font-medium ${
                      page === pagination.page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              ))}
            
            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchCandidates; 