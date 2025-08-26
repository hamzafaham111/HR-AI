import React from 'react';

// Generic skeleton components
export const SkeletonBox = ({ className = "", ...props }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} {...props} />
);

export const SkeletonText = ({ lines = 1, className = "" }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonBox key={i} className="h-4" style={{ width: `${Math.random() * 40 + 60}%` }} />
    ))}
  </div>
);

export const SkeletonCard = ({ className = "" }) => (
  <div className={`card ${className}`}>
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <SkeletonBox className="h-4 w-20" />
        <SkeletonBox className="h-8 w-12" />
      </div>
      <SkeletonBox className="w-8 h-8 rounded" />
    </div>
  </div>
);

export const SkeletonTableRow = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
    <SkeletonBox className="h-10 w-10 rounded-full" />
    <div className="flex-1 space-y-2">
      <SkeletonBox className="h-4 w-32" />
      <SkeletonBox className="h-3 w-24" />
    </div>
    <SkeletonBox className="h-6 w-16" />
    <SkeletonBox className="h-6 w-20" />
  </div>
);

// Page-specific skeleton loaders
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <SkeletonBox className="h-10 w-32" />
    </div>

    {/* Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </div>

    {/* Recent Activity Skeleton */}
    <div className="card">
      <SkeletonBox className="h-6 w-32 mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <SkeletonBox className="w-2 h-2 rounded-full" />
              <div>
                <SkeletonBox className="h-4 w-40 mb-1" />
                <SkeletonBox className="h-3 w-24" />
              </div>
            </div>
            <SkeletonBox className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>

    <div className="text-center py-8">
      <div className="loading-spinner mx-auto"></div>
      <p className="text-gray-600 mt-3">Loading enhanced dashboard data...</p>
    </div>
  </div>
);

export const JobsSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <SkeletonBox className="h-10 w-32" />
    </div>

    {/* Filters Skeleton */}
    <div className="card">
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonBox className="h-10 flex-1" />
        <SkeletonBox className="h-10 w-32" />
      </div>
    </div>

    {/* Jobs List Skeleton */}
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card">
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-3">
              <SkeletonBox className="h-6 w-64" />
              <SkeletonBox className="h-4 w-48" />
              <div className="flex space-x-2">
                <SkeletonBox className="h-6 w-20 rounded-full" />
                <SkeletonBox className="h-6 w-24 rounded-full" />
              </div>
            </div>
            <div className="flex space-x-2">
              <SkeletonBox className="h-8 w-16" />
              <SkeletonBox className="h-8 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const ResumeBankSkeleton = () => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
      <div>
        <SkeletonBox className="h-8 w-48 mb-2" />
        <SkeletonBox className="h-4 w-64" />
      </div>
      <SkeletonBox className="h-10 w-32" />
    </div>

    {/* Filters Skeleton */}
    <div className="card">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonBox className="h-10" />
        <SkeletonBox className="h-10" />
        <SkeletonBox className="h-10" />
        <SkeletonBox className="h-10" />
      </div>
    </div>

    {/* Resumes Grid Skeleton */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="card">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <SkeletonBox className="w-12 h-12 rounded-full" />
              <div className="flex-1">
                <SkeletonBox className="h-5 w-32 mb-1" />
                <SkeletonBox className="h-4 w-24" />
              </div>
            </div>
            <SkeletonText lines={3} />
            <div className="flex flex-wrap gap-2">
              <SkeletonBox className="h-6 w-16 rounded-full" />
              <SkeletonBox className="h-6 w-20 rounded-full" />
              <SkeletonBox className="h-6 w-14 rounded-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const DetailPageSkeleton = ({ title = "Loading..." }) => (
  <div className="space-y-6">
    {/* Header Skeleton */}
    <div className="flex items-center justify-between">
      <div>
        <SkeletonBox className="h-8 w-64 mb-2" />
        <SkeletonBox className="h-4 w-48" />
      </div>
      <div className="flex space-x-2">
        <SkeletonBox className="h-10 w-24" />
        <SkeletonBox className="h-10 w-24" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="card">
      <div className="space-y-6">
        <SkeletonText lines={4} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonText lines={3} />
          <SkeletonText lines={3} />
        </div>
      </div>
    </div>

    <div className="text-center py-8">
      <div className="loading-spinner mx-auto"></div>
      <p className="text-gray-600 mt-3">{title}</p>
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="card">
    {/* Table Header Skeleton */}
    <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
      <SkeletonBox className="h-4 w-8" />
      <SkeletonBox className="h-4 w-32" />
      <SkeletonBox className="h-4 w-24" />
      <SkeletonBox className="h-4 w-20" />
      <SkeletonBox className="h-4 w-16" />
    </div>

    {/* Table Rows Skeleton */}
    <div className="divide-y divide-gray-200">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} />
      ))}
    </div>
  </div>
);

// Simple centered loader for quick loading states
export const SimpleLoader = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center min-h-64">
    <div className="text-center">
      <div className="loading-spinner mx-auto"></div>
      <p className="text-gray-600 mt-3">{message}</p>
    </div>
  </div>
);

export default {
  SkeletonBox,
  SkeletonText,
  SkeletonCard,
  SkeletonTableRow,
  DashboardSkeleton,
  JobsSkeleton,
  ResumeBankSkeleton,
  DetailPageSkeleton,
  TableSkeleton,
  SimpleLoader
};

