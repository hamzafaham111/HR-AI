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
from enum import Enum


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


class ProcessStatus(str, Enum):
    """Enum for hiring process status."""
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    COMING_SOON = "coming_soon"


class CandidateStageStatus(str, Enum):
    """Enum for candidate status within a stage."""
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    PASSED = "passed"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"
    CALL_PENDING = "call_pending"
    INTERVIEWED = "interviewed"
    FEEDBACK_PENDING = "feedback_pending"
    ACCEPTED = "accepted"
    HIRED = "hired"


class ProcessStage(BaseModel):
    """Individual stage in a hiring process."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique stage ID")
    name: str = Field(..., description="Stage name (e.g., 'Phone Screen', 'Technical Interview')")
    description: Optional[str] = Field(None, description="Stage description")
    order: int = Field(..., description="Order of this stage in the process")
    is_final: bool = Field(default=False, description="Whether this is a final stage (hired/rejected)")
    created_at: datetime = Field(default_factory=datetime.utcnow)


class ProcessCandidate(BaseModel):
    """Candidate assigned to a hiring process."""
    resume_bank_entry_id: PyObjectId = Field(..., description="Reference to resume bank entry")
    current_stage_id: str = Field(..., description="Current stage ID")
    status: CandidateStageStatus = Field(default=CandidateStageStatus.PENDING, description="Current status")
    notes: Optional[str] = Field(None, description="HR notes about this candidate")
    stage_history: List[Dict[str, Any]] = Field(default_factory=list, description="History of stage movements")
    assigned_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class HiringProcessDocument(BaseModel):
    """MongoDB document for hiring processes."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="ID of the HR user who created this process")
    
    # Process Details
    process_name: str = Field(..., description="Name/title of the hiring process")
    company_name: str = Field(..., description="Company name for this position")
    position_title: str = Field(..., description="Job position title")
    department: Optional[str] = Field(None, description="Department")
    location: Optional[str] = Field(None, description="Job location")
    
    # Process Configuration
    description: Optional[str] = Field(None, description="Process description")
    status: ProcessStatus = Field(default=ProcessStatus.ACTIVE, description="Process status")
    priority: str = Field(default="medium", description="Process priority (low, medium, high, urgent)")
    target_hires: Optional[int] = Field(None, description="Target number of hires")
    deadline: Optional[datetime] = Field(None, description="Process deadline")
    
    # Pipeline Stages
    stages: List[ProcessStage] = Field(default_factory=list, description="Hiring pipeline stages")
    
    # Candidates
    candidates: List[ProcessCandidate] = Field(default_factory=list, description="Candidates in this process")
    
    # Metadata
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
    "users": "users",
    "hiring_processes": "hiring_processes"
} 


class MeetingStatus(str, Enum):
    """Enum for meeting status."""
    DRAFT = "draft"           # Initial state when creating
    OPEN = "open"             # Event is open for bookings
    CLOSED = "closed"         # Event is closed, no more bookings
    CANCELLED = "cancelled"   # Event is cancelled


class BookingStatus(str, Enum):
    """Enum for booking status."""
    PENDING = "pending"       # Waiting for HR/company approval
    APPROVED = "approved"     # Approved by HR/company
    SCHEDULED = "scheduled"   # Confirmed and scheduled
    COMPLETED = "completed"   # Meeting was completed
    CANCELLED = "cancelled"   # Cancelled by either party
    REJECTED = "rejected"     # Rejected by HR/company
    NO_SHOW = "no_show"      # Candidate didn't show up


class SlotSelectionType(str, Enum):
    """Enum for slot selection types."""
    SINGLE = "single"
    MULTIPLE = "multiple"
    RECURRING = "recurring"


class MeetingType(str, Enum):
    """Enum for meeting types."""
    INTERVIEW = "interview"
    CALL = "call"
    MEETING = "meeting"
    PRESENTATION = "presentation"
    OTHER = "other"


class MeetingSlotDocument(BaseModel):
    """MongoDB document for meeting slots."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    meeting_id: PyObjectId = Field(..., description="Reference to the meeting")
    start_time: datetime = Field(..., description="Slot start time")
    end_time: datetime = Field(..., description="Slot end time")
    is_booked: bool = Field(default=False, description="Whether this slot is booked")
    booking_id: Optional[PyObjectId] = Field(None, description="Reference to booking if booked")
    created_at: datetime = Field(default_factory=datetime.now)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class MeetingBookingDocument(BaseModel):
    """MongoDB document for meeting bookings."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    meeting_id: PyObjectId = Field(..., description="Reference to the meeting")
    slot_id: PyObjectId = Field(..., description="Reference to the meeting slot")
    participant_name: str = Field(..., description="Participant's name")
    participant_email: str = Field(..., description="Participant's email")
    participant_phone: Optional[str] = Field(None, description="Participant's phone")
    notes: Optional[str] = Field(None, description="Additional notes")
    status: BookingStatus = Field(default=BookingStatus.PENDING, description="Booking status")
    booking_token: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique token for booking management")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, onupdate=datetime.now)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class MeetingTemplateDocument(BaseModel):
    """MongoDB document for meeting templates."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID who created this template")
    name: str = Field(..., description="Template name")
    description: Optional[str] = Field(None, description="Template description")
    duration: int = Field(..., description="Duration in minutes")
    meeting_type: MeetingType = Field(..., description="Type of meeting")
    settings: Dict[str, Any] = Field(default_factory=dict, description="Template settings")
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, onupdate=datetime.now)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    }


class MeetingDocument(BaseModel):
    """MongoDB document for meetings."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(..., description="User ID who created this meeting")
    title: str = Field(..., description="Meeting title")
    description: Optional[str] = Field(None, description="Meeting description")
    meeting_type: MeetingType = Field(default=MeetingType.MEETING, description="Type of meeting")
    duration: int = Field(..., description="Duration in minutes")
    timezone: str = Field(default="UTC", description="Timezone for the meeting")
    status: MeetingStatus = Field(default=MeetingStatus.DRAFT, description="Meeting status")
    
    # Scheduling
    start_date: datetime = Field(..., description="Meeting start date")
    end_date: datetime = Field(..., description="Meeting end date")
    buffer_time_before: int = Field(default=0, description="Buffer time before meeting in minutes")
    buffer_time_after: int = Field(default=0, description="Buffer time after meeting in minutes")
    
    # Participants
    max_participants: int = Field(default=1, description="Maximum number of participants")
    participants: List[Dict[str, Any]] = Field(default_factory=list, description="List of participants")
    
    # Settings
    is_public: bool = Field(default=False, description="Whether this meeting is publicly bookable")
    public_link: Optional[str] = Field(None, description="Public booking link")
    requires_approval: bool = Field(default=False, description="Whether bookings require approval")
    allow_cancellation: bool = Field(default=True, description="Whether participants can cancel")
    
    # Additional fields for frontend compatibility
    slot_selection_type: SlotSelectionType = Field(default=SlotSelectionType.SINGLE, description="Type of slot selection")
    allow_guest_booking: bool = Field(default=True, description="Whether guests can book slots")
    
    # Metadata
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now, onupdate=datetime.now)
    
    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
        "json_encoders": {ObjectId: str}
    } 