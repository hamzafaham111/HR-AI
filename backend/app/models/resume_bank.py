"""
Data models for resume bank functionality.

This module defines the data structures for storing and managing
resumes in a searchable bank with candidate matching capabilities.
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

# Resume analysis models removed - using simplified models
from .job import CompatibilityScore


class ResumeStatus(str, Enum):
    ACTIVE = "active"
    ARCHIVED = "archived"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"


class CandidateStatus(str, Enum):
    AVAILABLE = "available"  # Open for new roles
    IN_PROCESS = "in_process"  # Currently in hiring process
    NOT_AVAILABLE = "not_available"  # Not looking for roles
    HIRED = "hired"  # Successfully hired
    REJECTED = "rejected"  # Not selected
    ON_HOLD = "on_hold"  # Process paused


class ResumeSource(str, Enum):
    DIRECT_UPLOAD = "direct_upload"
    JOB_APPLICATION = "job_application"
    IMPORTED = "imported"


class ResumeBankEntry(BaseModel):
    """A resume entry in the resume bank."""
    id: str = Field(..., description="Unique identifier for the resume")
    filename: str = Field(..., description="Original filename")
    candidate_name: str = Field(..., description="Candidate's full name")
    candidate_email: Optional[str] = Field(None, description="Candidate's email address")
    candidate_phone: Optional[str] = Field(None, description="Candidate's phone number")
    candidate_location: Optional[str] = Field(None, description="Candidate's location")
    years_experience: Optional[int] = Field(None, description="Years of experience")
    current_role: Optional[str] = Field(None, description="Current job title")
    desired_role: Optional[str] = Field(None, description="Desired job title")
    salary_expectation: Optional[str] = Field(None, description="Salary expectation")
    availability: Optional[str] = Field(None, description="Availability status")
    status: ResumeStatus = Field(ResumeStatus.ACTIVE, description="Resume status")
    candidate_status: CandidateStatus = Field(CandidateStatus.AVAILABLE, description="Candidate availability status")
    source: ResumeSource = Field(ResumeSource.DIRECT_UPLOAD, description="How resume was added")
    tags: List[str] = Field(default_factory=list, description="Custom tags for categorization")
    notes: Optional[str] = Field(None, description="Additional notes")
    
    # Hiring process tracking
    current_processes: List[str] = Field(default_factory=list, description="Current hiring process IDs")
    process_history: List[Dict[str, Any]] = Field(default_factory=list, description="Hiring process history")
    pdf_file_path: Optional[str] = Field(None, description="Path to stored PDF file")
    
    # AI Analysis Results (simplified)
    summary: Optional[str] = Field(None, description="AI-generated summary")
    skills: List[str] = Field(default_factory=list, description="Extracted skills")
    education: Optional[str] = Field(None, description="Education information")
    experience_level: Optional[str] = Field(None, description="Experience level assessment")
    overall_assessment: Optional[str] = Field(None, description="Overall AI assessment")
    
    created_date: datetime = Field(default_factory=datetime.now, description="When resume was added")
    updated_date: datetime = Field(default_factory=datetime.now, description="Last update date")
    last_contact_date: Optional[datetime] = Field(None, description="Last contact with candidate")
    
    @validator('years_experience', pre=True)
    def validate_years_experience(cls, v):
        """Convert empty strings to None for years_experience."""
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        return v


class ResumeSearchFilters(BaseModel):
    """Filters for searching resumes in the bank."""
    skills: Optional[List[str]] = Field(None, description="Required skills")
    experience_level: Optional[str] = Field(None, description="Experience level")
    location: Optional[str] = Field(None, description="Preferred location")
    years_experience_min: Optional[int] = Field(None, description="Minimum years of experience")
    years_experience_max: Optional[int] = Field(None, description="Maximum years of experience")
    status: Optional[ResumeStatus] = Field(None, description="Resume status")
    tags: Optional[List[str]] = Field(None, description="Required tags")
    availability: Optional[str] = Field(None, description="Availability status")
    salary_range_min: Optional[int] = Field(None, description="Minimum salary expectation")
    salary_range_max: Optional[int] = Field(None, description="Maximum salary expectation")


class CandidateMatch(BaseModel):
    """A candidate match for a job posting."""
    resume_id: str = Field(..., description="Resume ID")
    candidate_name: str = Field(..., description="Candidate name")
    candidate_email: Optional[str] = Field(None, description="Candidate email")
    compatibility_score: CompatibilityScore = Field(..., description="Compatibility analysis")
    current_role: Optional[str] = Field(None, description="Current job title")
    years_experience: Optional[int] = Field(None, description="Years of experience")
    location: Optional[str] = Field(None, description="Candidate location")
    status: ResumeStatus = Field(..., description="Resume status")
    last_contact_date: Optional[datetime] = Field(None, description="Last contact date")
    match_reasons: List[str] = Field(default_factory=list, description="Why this candidate matches")
    
    @validator('years_experience', pre=True)
    def validate_years_experience(cls, v):
        """Convert empty strings to None for years_experience."""
        if v == "" or v is None:
            return None
        if isinstance(v, str):
            try:
                return int(v)
            except ValueError:
                return None
        return v


class ResumeBankStats(BaseModel):
    """Statistics for the resume bank."""
    total_resumes: int = Field(..., description="Total number of resumes")
    active_resumes: int = Field(..., description="Number of active resumes")
    shortlisted_resumes: int = Field(..., description="Number of shortlisted resumes")
    recent_uploads: int = Field(..., description="Resumes uploaded in last 30 days")
    top_skills: List[Dict[str, Any]] = Field(default_factory=list, description="Most common skills")
    experience_distribution: Dict[str, int] = Field(default_factory=dict, description="Experience level distribution")
    location_distribution: Dict[str, int] = Field(default_factory=dict, description="Location distribution")


class ResumeBankResponse(BaseModel):
    """Response for resume bank operations."""
    resumes: List[ResumeBankEntry] = Field(..., description="List of resumes")
    total_count: int = Field(..., description="Total number of resumes")
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of resumes per page")
    filters_applied: ResumeSearchFilters = Field(..., description="Applied search filters")


class CandidateSearchResponse(BaseModel):
    """Response for candidate search operations."""
    candidates: List[CandidateMatch] = Field(..., description="List of matching candidates")
    total_candidates: int = Field(..., description="Total number of candidates found")
    search_criteria: Dict[str, Any] = Field(..., description="Search criteria used")
    search_time: float = Field(..., description="Search execution time in seconds")
    pagination: Dict[str, Any] = Field(..., description="Pagination information")
    
    class Config:
        json_schema_extra = {
            "example": {
                "candidates": [],
                "total_candidates": 25,
                "search_criteria": {
                    "job_id": "123",
                    "job_title": "Software Engineer",
                    "limit": 10,
                    "page": 1,
                    "total_pages": 3
                },
                "search_time": 1.23,
                "pagination": {
                    "page": 1,
                    "limit": 10,
                    "total_pages": 3,
                    "has_next": True,
                    "has_previous": False,
                    "start_index": 1,
                    "end_index": 10
                }
            }
        }


class ResumeBankEntryCreate(BaseModel):
    """Data for creating a new resume bank entry."""
    filename: str = Field(..., description="Original filename")
    candidate_name: Optional[str] = Field(None, description="Candidate's full name")
    candidate_email: Optional[str] = Field(None, description="Candidate's email address")
    candidate_phone: Optional[str] = Field(None, description="Candidate's phone number")
    candidate_location: Optional[str] = Field(None, description="Candidate's location")
    years_experience: Optional[int] = Field(None, description="Years of experience")
    current_role: Optional[str] = Field(None, description="Current job title")
    desired_role: Optional[str] = Field(None, description="Desired job title")
    salary_expectation: Optional[str] = Field(None, description="Salary expectation")
    availability: Optional[str] = Field(None, description="Availability status")
    tags: List[str] = Field(default_factory=list, description="Custom tags")
    notes: Optional[str] = Field(None, description="Additional notes")
    # resume_analysis_id removed - no longer needed


class ResumeBankEntryUpdate(BaseModel):
    """Data for updating a resume bank entry."""
    candidate_name: Optional[str] = Field(None, description="Candidate's full name")
    candidate_email: Optional[str] = Field(None, description="Candidate's email address")
    candidate_phone: Optional[str] = Field(None, description="Candidate's phone number")
    candidate_location: Optional[str] = Field(None, description="Candidate's location")
    years_experience: Optional[int] = Field(None, description="Years of experience")
    current_role: Optional[str] = Field(None, description="Current job title")
    desired_role: Optional[str] = Field(None, description="Desired job title")
    salary_expectation: Optional[str] = Field(None, description="Salary expectation")
    availability: Optional[str] = Field(None, description="Availability status")
    status: Optional[ResumeStatus] = Field(None, description="Resume status")
    candidate_status: Optional[CandidateStatus] = Field(None, description="Candidate availability status")
    tags: Optional[List[str]] = Field(None, description="Custom tags")
    notes: Optional[str] = Field(None, description="Additional notes")
    current_processes: Optional[List[str]] = Field(None, description="Current hiring process IDs")


class CandidateDetailResponse(BaseModel):
    """Detailed response for candidate profile page."""
    candidate: ResumeBankEntry = Field(..., description="Candidate information")
    current_processes: List[Dict[str, Any]] = Field(default_factory=list, description="Current hiring processes")
    process_history: List[Dict[str, Any]] = Field(default_factory=list, description="Hiring process history")
    pdf_url: Optional[str] = Field(None, description="URL to access PDF file") 