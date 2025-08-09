"""
MongoDB models for the AI Resume Analysis System.

This module defines the document structures for MongoDB collections,
replacing the SQLAlchemy ORM models with flexible document schemas.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, validator
from bson import ObjectId
import uuid


class PyObjectId(ObjectId):
    """Custom ObjectId for Pydantic models."""
    
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler):
        return {
            'type': 'any',
            'validator': cls.validate,
            'serializer': lambda x: str(x)
        }
    
    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)
        raise ValueError("Invalid ObjectId")


class JobPostingDocument(BaseModel):
    """MongoDB document for job postings."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID who created this job posting")
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    location: str = Field(..., description="Job location")
    job_type: str = Field(..., description="Type of employment")
    experience_level: str = Field(..., description="Required experience level")
    description: str = Field(..., description="Job description")
    salary_range: Optional[str] = Field(None, description="Salary range")
    requirements: List[Dict[str, Any]] = Field(default_factory=list, description="Job requirements")
    responsibilities: List[str] = Field(default_factory=list, description="Job responsibilities")
    benefits: List[str] = Field(default_factory=list, description="Job benefits")
    status: str = Field(default="active", description="Job status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class ResumeAnalysisDocument(BaseModel):
    """MongoDB document for resume analyses."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    filename: str = Field(..., description="Original filename")
    raw_text: str = Field(..., description="Extracted text from resume")
    extracted_skills: List[str] = Field(default_factory=list, description="List of extracted skills")
    experience_years: int = Field(..., description="Years of experience")
    education_level: str = Field(..., description="Education level")
    expertise_areas: List[Dict[str, Any]] = Field(default_factory=list, description="Expertise areas with levels")
    strong_zones: List[Dict[str, Any]] = Field(default_factory=list, description="Strong zones identified")
    summary: str = Field(..., description="Natural language summary")
    overall_assessment: Optional[str] = Field(None, description="Overall assessment")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class ResumeBankEntryDocument(BaseModel):
    """MongoDB document for resume bank entries."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID who uploaded this resume")
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
    tags: List[str] = Field(default_factory=list, description="Custom tags")
    notes: Optional[str] = Field(None, description="Additional notes")
    resume_analysis_id: Optional[PyObjectId] = Field(None, description="ID of the resume analysis")
    status: str = Field(default="active", description="Resume status")
    last_contact_date: Optional[datetime] = Field(None, description="Last contact date")
    
    # AI Analysis Results (simplified)
    summary: Optional[str] = Field(None, description="AI-generated summary")
    skills: List[str] = Field(default_factory=list, description="Extracted skills")
    education: Optional[str] = Field(None, description="Education information")
    experience_level: Optional[str] = Field(None, description="Experience level assessment")
    overall_assessment: Optional[str] = Field(None, description="Overall AI assessment")
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    @validator('candidate_location', pre=True)
    def validate_candidate_location(cls, v):
        """Convert location dict to string if needed."""
        if isinstance(v, dict):
            if 'city' in v and 'country' in v:
                return f"{v['city']}, {v['country']}"
            elif 'city' in v:
                return v['city']
            elif 'country' in v:
                return v['country']
            else:
                return str(v)
        return v
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class UserDocument(BaseModel):
    """MongoDB document for users."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    name: str = Field(..., description="Full name")
    email: str = Field(..., description="Email address")
    hashed_password: str = Field(..., description="Hashed password")
    role: str = Field(default="user", description="User role")
    company: Optional[str] = Field(None, description="Company name")
    phone: Optional[str] = Field(None, description="Phone number")
    is_active: bool = Field(default=True, description="User active status")
    is_superuser: bool = Field(default=False, description="Superuser status")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


# Collection names
COLLECTIONS = {
    "job_postings": "job_postings",
    "resume_analyses": "resume_analyses", 
    "resume_bank_entries": "resume_bank_entries",
    "users": "users"
} 