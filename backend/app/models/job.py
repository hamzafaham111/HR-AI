"""
Data models for job posting and compatibility analysis functionality.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum


class JobType(str, Enum):
    full_time = "full_time"
    part_time = "part_time"
    contract = "contract"
    internship = "internship"


class ExperienceLevel(str, Enum):
    entry = "entry"
    junior = "junior"
    mid = "mid"
    senior = "senior"
    lead = "lead"


class JobRequirement(BaseModel):
    skill: str = Field(..., description="Required skill")
    level: str = Field(..., description="Skill level (Beginner, Intermediate, Advanced)")
    weight: float = Field(1.0, description="Weight/importance of this requirement (0.0-1.0)")


class JobPostingCreate(BaseModel):
    """Data for creating a new job posting."""
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    job_type: JobType = Field(..., description="Type of employment")
    experience_level: ExperienceLevel = Field(..., description="Required experience level")
    description: str = Field(..., description="Job description")
    salary_range: Optional[str] = Field(None, description="Salary range")
    requirements: List[JobRequirement] = Field(default_factory=list, description="Job requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Job responsibilities")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    allow_public_applications: bool = Field(default=False, description="Whether to allow public applications")
    public_application_link: Optional[str] = Field(None, description="Public application link")


class JobPostingUpdate(BaseModel):
    """Data for updating a job posting."""
    title: Optional[str] = Field(None, description="Job title")
    company: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Job location")
    job_type: Optional[JobType] = Field(None, description="Type of employment")
    experience_level: Optional[ExperienceLevel] = Field(None, description="Required experience level")
    description: Optional[str] = Field(None, description="Job description")
    salary_range: Optional[str] = Field(None, description="Salary range")
    requirements: Optional[List[JobRequirement]] = Field(None, description="Job requirements")
    responsibilities: Optional[List[str]] = Field(None, description="Job responsibilities")
    benefits: Optional[List[str]] = Field(None, description="Job benefits")
    status: Optional[str] = Field(None, description="Job status")
    allow_public_applications: Optional[bool] = Field(None, description="Whether to allow public applications")
    public_application_link: Optional[str] = Field(None, description="Public application link")


class JobPosting(BaseModel):
    """Job posting model for compatibility analysis."""
    id: str = Field(..., description="Job ID")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    job_type: JobType = Field(..., description="Type of employment")
    experience_level: ExperienceLevel = Field(..., description="Required experience level")
    description: str = Field(..., description="Job description")
    salary_range: Optional[str] = Field(None, description="Salary range")
    requirements: List[JobRequirement] = Field(default_factory=list, description="Job requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Job responsibilities")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    status: str = Field(..., description="Job status")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: Optional[datetime] = Field(None, description="Last update date")


class JobPostingResponse(BaseModel):
    """Response model for job postings."""
    id: str
    title: str
    company: str
    location: str
    job_type: str
    experience_level: str
    description: str
    salary_range: Optional[str] = None
    requirements: List[dict]
    responsibilities: List[str]
    benefits: List[str]
    status: str
    allow_public_applications: Optional[bool] = None
    public_application_link: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompatibilityScore(BaseModel):
    """Compatibility score between a candidate and a job."""
    overall_score: float = Field(..., description="Overall compatibility score (0-100)")
    skills_match: float = Field(..., description="Skills compatibility score (0-100)")
    experience_match: float = Field(..., description="Experience compatibility score (0-100)")
    role_match: float = Field(..., description="Role compatibility score (0-100)")
    location_match: float = Field(..., description="Location compatibility score (0-100)")
    match_confidence: float = Field(..., description="Confidence in the match (0-100)")


class CandidateMatch(BaseModel):
    """Candidate match information."""
    id: str
    candidate_name: Optional[str]
    candidate_email: Optional[str]
    candidate_phone: Optional[str]
    candidate_location: Optional[str]
    years_experience: Optional[int]
    current_role: Optional[str]
    desired_role: Optional[str]
    skills: List[str]
    compatibility_score: CompatibilityScore
    last_contact_date: Optional[datetime]
    status: str
    created_at: datetime 