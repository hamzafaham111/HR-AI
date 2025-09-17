import { Model } from 'mongoose';

export async function createIndexes() {
  // This function will be called after database connection
  // to ensure all indexes are created for optimal performance
}

export const USER_INDEXES = [
  { email: 1 }, // Unique index for email
  { createdAt: -1 }, // For sorting by creation date
  { isActive: 1 }, // For filtering active users
];

export const JOB_INDEXES = [
  { userId: 1 }, // For user-specific queries
  { status: 1 }, // For filtering by status
  { createdAt: -1 }, // For sorting by creation date
  { title: 'text', description: 'text' }, // Text search index
  { location: 1 }, // For location-based queries
  { jobType: 1 }, // For filtering by job type
];

export const RESUME_INDEXES = [
  { userId: 1 }, // For user-specific queries
  { status: 1 }, // For filtering by status
  { createdAt: -1 }, // For sorting by creation date
  { candidateName: 'text', candidateEmail: 'text' }, // Text search index
  { candidateLocation: 1 }, // For location-based queries
  { yearsExperience: 1 }, // For experience-based queries
  { skills: 1 }, // For skill-based queries
];

export const HIRING_PROCESS_INDEXES = [
  { userId: 1 }, // For user-specific queries
  { status: 1 }, // For filtering by status
  { createdAt: -1 }, // For sorting by creation date
  { jobId: 1 }, // For job-specific queries
];

export const MEETING_INDEXES = [
  { userId: 1 }, // For user-specific queries
  { scheduledAt: 1 }, // For date-based queries
  { status: 1 }, // For filtering by status
  { createdAt: -1 }, // For sorting by creation date
];

export const JOB_APPLICATION_INDEXES = [
  { userId: 1 }, // For user-specific queries
  { jobId: 1 }, // For job-specific queries
  { status: 1 }, // For filtering by status
  { createdAt: -1 }, // For sorting by creation date
  { resumeId: 1 }, // For resume-specific queries
];
