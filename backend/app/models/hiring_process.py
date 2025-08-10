"""
Pydantic models for hiring process API endpoints.

This module defines the request and response models for the hiring process
management system, including process creation, candidate management, and
pipeline tracking.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from .mongodb_models import ProcessStatus, CandidateStageStatus, PyObjectId


# Request Models
class ProcessStageCreate(BaseModel):
    """Model for creating a new process stage."""
    name: str = Field(..., description="Stage name", example="Phone Screen")
    description: Optional[str] = Field(None, description="Stage description")
    order: int = Field(..., description="Order in pipeline", example=1)
    is_final: bool = Field(default=False, description="Is this a final stage")


class HiringProcessCreate(BaseModel):
    """Model for creating a new hiring process."""
    process_name: str = Field(..., description="Process name", example="Senior Developer Hiring")
    company_name: str = Field(..., description="Company name", example="TechCorp Inc.")
    position_title: str = Field(..., description="Position title", example="Senior Software Engineer")
    department: Optional[str] = Field(None, description="Department", example="Engineering")
    location: Optional[str] = Field(None, description="Location", example="Remote")
    description: Optional[str] = Field(None, description="Process description")
    priority: str = Field(default="medium", description="Priority level")
    target_hires: Optional[int] = Field(None, description="Target number of hires")
    deadline: Optional[datetime] = Field(None, description="Process deadline")
    stages: List[ProcessStageCreate] = Field(..., description="Pipeline stages")


class HiringProcessUpdate(BaseModel):
    """Model for updating a hiring process."""
    process_name: Optional[str] = None
    company_name: Optional[str] = None
    position_title: Optional[str] = None
    department: Optional[str] = None
    location: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ProcessStatus] = None
    priority: Optional[str] = None
    target_hires: Optional[int] = None
    deadline: Optional[datetime] = None


class CandidateAssignment(BaseModel):
    """Model for assigning candidate to process."""
    resume_bank_entry_id: str = Field(..., description="Resume bank entry ID")
    notes: Optional[str] = Field(None, description="Initial notes")


class CandidateStageMove(BaseModel):
    """Model for moving candidate to different stage."""
    new_stage_id: str = Field(..., description="Target stage ID")
    status: CandidateStageStatus = Field(..., description="New status")
    notes: Optional[str] = Field(None, description="Notes about the move")


class ProcessFilter(BaseModel):
    """Model for filtering hiring processes."""
    status: Optional[ProcessStatus] = Field(None, description="Filter by status")
    company_name: Optional[str] = Field(None, description="Filter by company")
    search: Optional[str] = Field(None, description="Search in process name, company, or position")
    priority: Optional[str] = Field(None, description="Filter by priority")
    limit: Optional[int] = Field(default=20, description="Limit results")
    offset: Optional[int] = Field(default=0, description="Offset for pagination")


# Response Models
class ProcessStageResponse(BaseModel):
    """Response model for process stage."""
    id: str
    name: str
    description: Optional[str]
    order: int
    is_final: bool
    candidate_count: int = 0  # Number of candidates in this stage
    created_at: datetime


class ProcessCandidateResponse(BaseModel):
    """Response model for process candidate."""
    resume_bank_entry_id: str
    candidate_name: str
    candidate_email: str
    current_stage_id: str
    current_stage_name: str
    status: CandidateStageStatus
    notes: Optional[str]
    assigned_at: datetime
    updated_at: datetime


class HiringProcessResponse(BaseModel):
    """Response model for hiring process."""
    id: str
    process_name: str
    company_name: str
    position_title: str
    department: Optional[str]
    location: Optional[str]
    description: Optional[str]
    status: ProcessStatus
    priority: str
    target_hires: Optional[int]
    deadline: Optional[datetime]
    total_candidates: int
    active_candidates: int
    hired_candidates: int
    rejected_candidates: int
    created_at: datetime
    updated_at: datetime


class HiringProcessDetail(HiringProcessResponse):
    """Detailed response model for hiring process."""
    stages: List[ProcessStageResponse]
    candidates: List[ProcessCandidateResponse]


class ProcessStats(BaseModel):
    """Response model for process statistics."""
    total_processes: int
    active_processes: int
    completed_processes: int
    paused_processes: int
    coming_soon_processes: int
    total_candidates: int
    candidates_hired: int
    candidates_rejected: int


# Stage History Entry
class StageHistoryEntry(BaseModel):
    """Model for stage movement history."""
    from_stage_id: Optional[str]
    from_stage_name: Optional[str]
    to_stage_id: str
    to_stage_name: str
    status: CandidateStageStatus
    notes: Optional[str]
    moved_at: datetime
    moved_by: str  # User ID who made the move

