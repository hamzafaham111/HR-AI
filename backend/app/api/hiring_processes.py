"""
API endpoints for hiring process management.

This module provides RESTful API endpoints for managing hiring processes,
including creating processes, managing candidates through pipeline stages,
and tracking recruitment progress.

Key Features:
- Process CRUD operations with user-based isolation
- Candidate pipeline management (add, move, track)
- Search and filtering capabilities
- Integration with resume bank for candidate sourcing
- Stage-based workflow management
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.logging import logger

from ..core.database import get_database
from ..api.auth import get_current_user
from ..models.mongodb_models import UserDocument
from ..models.hiring_process import (
    HiringProcessCreate,
    HiringProcessUpdate,
    HiringProcessResponse,
    HiringProcessDetail,
    CandidateAssignment,
    CandidateStageMove,
    ProcessFilter,
    ProcessStats,
    ProcessStageResponse,
    ProcessCandidateResponse
)
from ..models.mongodb_models import ProcessStatus, CandidateStageStatus
from ..repositories.mongodb_repository import MongoDBRepository

# Create router for hiring process endpoints
router = APIRouter(prefix="/hiring-processes", tags=["hiring-processes"])


@router.post("/", response_model=HiringProcessResponse)
async def create_hiring_process(
    process_data: HiringProcessCreate,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Create a new hiring process.
    
    This endpoint allows HR users to create a new hiring process with:
    - Process details (company, position, description)
    - Custom pipeline stages
    - Priority and deadline settings
    
    The process is automatically associated with the current user.
    """
    try:
        repository = MongoDBRepository(database)
        
        # Convert Pydantic model to dict and add user_id
        process_dict = process_data.model_dump()
        process_dict["user_id"] = current_user.id
        
        # Convert ProcessStageCreate objects to ProcessStage objects with IDs
        if "stages" in process_dict:
            from ..models.mongodb_models import ProcessStage
            process_stages = []
            for stage_data in process_dict["stages"]:
                stage = ProcessStage(**stage_data)
                process_stages.append(stage.model_dump())
            process_dict["stages"] = process_stages
        
        # Create the process
        created_process = await repository.create_hiring_process(process_dict)
        
        # Convert to response model
        return await _convert_to_process_response(created_process, repository)
        
    except Exception as e:
        logger.error(f"Error creating hiring process: {e}")
        raise HTTPException(status_code=500, detail="Failed to create hiring process")


@router.get("/available", response_model=List[HiringProcessResponse])
async def get_available_hiring_processes(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get available hiring processes for the current user.
    
    This endpoint returns active hiring processes that can be used
    for adding job application candidates. Only active processes
    are returned to ensure candidates are added to active pipelines.
    """
    try:
        repository = MongoDBRepository(database)
        
        # Get active hiring processes for the current user
        available_processes = await repository.get_hiring_processes_by_user_and_status(
            user_id=str(current_user.id),
            status=ProcessStatus.ACTIVE
        )
        
        # Convert to response models
        response_processes = []
        for process in available_processes:
            response_process = await _convert_to_process_response(process, repository)
            response_processes.append(response_process)
        
        return response_processes
        
    except Exception as e:
        logger.error(f"Error getting available hiring processes: {e}")
        raise HTTPException(status_code=500, detail="Failed to get available hiring processes")


@router.get("/", response_model=List[HiringProcessResponse])
async def list_hiring_processes(
    status: Optional[ProcessStatus] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by process name, company, or position"),
    limit: int = Query(20, ge=1, le=100, description="Limit results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    List hiring processes for the current user.
    
    Supports filtering and searching:
    - Filter by status (active, paused, completed, cancelled, coming_soon)
    - Search by process name, company name, or position title
    - Pagination with limit and offset
    """
    try:
        repository = MongoDBRepository(database)
        
        processes = await repository.get_hiring_processes_by_user(
            user_id=str(current_user.id),
            status=status,
            search=search,
            limit=limit,
            offset=offset
        )
        
        # Convert to response models
        response_processes = []
        for process in processes:
            response_processes.append(await _convert_to_process_response(process, repository))
        
        return response_processes
        
    except Exception as e:
        logger.error(f"Error listing hiring processes: {e}")
        raise HTTPException(status_code=500, detail="Failed to list hiring processes")


@router.get("/stats", response_model=ProcessStats)
async def get_process_stats(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get hiring process statistics for the current user.
    
    Returns comprehensive statistics including:
    - Total processes by status
    - Candidate counts (total, hired, rejected)
    - Overall recruitment metrics
    """
    try:
        repository = MongoDBRepository(database)
        
        stats = await repository.get_hiring_process_stats_by_user(str(current_user.id))
        return ProcessStats(**stats)
        
    except Exception as e:
        logger.error(f"Error getting process stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get process statistics")


@router.get("/{process_id}", response_model=HiringProcessDetail)
async def get_hiring_process(
    process_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get detailed information about a specific hiring process.
    
    Returns:
    - Complete process information
    - All pipeline stages with candidate counts
    - All candidates with their current stage and status
    - Stage movement history
    """
    try:
        repository = MongoDBRepository(database)
        
        process = await repository.get_hiring_process_by_id(process_id, str(current_user.id))
        if not process:
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        return await _convert_to_process_detail(process, repository)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting hiring process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to get hiring process")


@router.put("/{process_id}", response_model=HiringProcessResponse)
async def update_hiring_process(
    process_id: str,
    update_data: HiringProcessUpdate,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Update a hiring process.
    
    Allows updating process details such as:
    - Basic information (name, company, position)
    - Status and priority
    - Deadline and target hires
    """
    try:
        repository = MongoDBRepository(database)
        
        # Filter out None values
        update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
        
        if not update_dict:
            raise HTTPException(status_code=400, detail="No update data provided")
        
        updated_process = await repository.update_hiring_process(
            process_id, str(current_user.id), update_dict
        )
        
        if not updated_process:
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        return await _convert_to_process_response(updated_process, repository)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating hiring process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update hiring process")


@router.delete("/{process_id}")
async def delete_hiring_process(
    process_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Delete a hiring process.
    
    This will permanently remove the process and all associated candidate data.
    Use with caution - this action cannot be undone.
    """
    try:
        repository = MongoDBRepository(database)
        
        success = await repository.delete_hiring_process(process_id, str(current_user.id))
        
        if not success:
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        return {"message": "Hiring process deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting hiring process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete hiring process")


@router.post("/{process_id}/candidates", response_model=HiringProcessDetail)
async def add_candidate_to_process(
    process_id: str,
    candidate_data: CandidateAssignment,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Add a candidate from the resume bank to a hiring process.
    
    The candidate will be added to the first stage of the process pipeline
    with a "pending" status. You can specify initial notes about the candidate.
    """
    try:
        repository = MongoDBRepository(database)
        
        logger.info(f"Adding candidate {candidate_data.resume_bank_entry_id} to process {process_id}")
        
        # Get the process to find the first stage
        process = await repository.get_hiring_process_by_id(process_id, str(current_user.id))
        if not process:
            logger.error(f"Process not found: {process_id}")
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        if not process.stages:
            logger.error(f"Process has no stages: {process_id}")
            raise HTTPException(status_code=400, detail="Process has no stages defined")
        
        # Find the first stage (lowest order)
        first_stage = min(process.stages, key=lambda s: s.order)
        logger.info(f"Adding candidate to first stage: {first_stage.name} (ID: {first_stage.id})")
        
        # Verify the resume bank entry exists and belongs to the current user
        resume_entry = await repository.get_resume_bank_entry_by_id(
            candidate_data.resume_bank_entry_id
        )
        if not resume_entry:
            logger.error(f"Resume bank entry not found: {candidate_data.resume_bank_entry_id}")
            raise HTTPException(status_code=404, detail="Resume bank entry not found")
        
        # Ensure the resume belongs to the current user
        if str(resume_entry.user_id) != str(current_user.id):
            logger.error(f"Resume does not belong to user: {candidate_data.resume_bank_entry_id}")
            raise HTTPException(status_code=403, detail="You can only add your own resumes to your processes")
        
        # Check if candidate is already in this process (enhanced check)
        for existing_candidate in process.candidates:
            # Check by resume_bank_entry_id
            if hasattr(existing_candidate, 'resume_bank_entry_id') and existing_candidate.resume_bank_entry_id:
                if str(existing_candidate.resume_bank_entry_id) == candidate_data.resume_bank_entry_id:
                    logger.warning(f"Candidate already in process (resume_bank_entry_id): {candidate_data.resume_bank_entry_id}")
                    raise HTTPException(status_code=400, detail="This candidate is already in this process")
            # Check by candidate email (additional safety check)
            if hasattr(existing_candidate, 'candidate_email') and existing_candidate.candidate_email:
                if existing_candidate.candidate_email.lower() == resume_entry.candidate_email.lower():
                    logger.warning(f"Candidate already in process (email): {resume_entry.candidate_email}")
                    raise HTTPException(status_code=400, detail="A candidate with this email is already in this process")
        
        # Add candidate to process
        updated_process = await repository.add_candidate_to_process(
            process_id=process_id,
            user_id=str(current_user.id),
            resume_bank_entry_id=candidate_data.resume_bank_entry_id,
            initial_stage_id=first_stage.id,
            notes=candidate_data.notes
        )
        
        if not updated_process:
            logger.error(f"Failed to add candidate to process: {process_id}")
            raise HTTPException(status_code=500, detail="Failed to add candidate to process")
        
        logger.info(f"Successfully added candidate to process: {process_id}")
        return await _convert_to_process_detail(updated_process, repository)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding candidate to process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to add candidate to process")


@router.put("/{process_id}/candidates/{candidate_id}/move", response_model=HiringProcessDetail)
async def move_candidate_stage(
    process_id: str,
    candidate_id: str,
    move_data: CandidateStageMove,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Move a candidate to a different stage in the hiring process.
    
    This endpoint allows you to:
    - Move candidates forward or backward in the pipeline
    - Update their status (pending, in_progress, passed, rejected, withdrawn)
    - Add notes about the stage movement
    - Track the complete stage movement history
    
    The candidate_id can be either a resume_bank_entry_id or job_application_id
    """
    try:
        repository = MongoDBRepository(database)
        
        # Verify the process exists and user has access
        process = await repository.get_hiring_process_by_id(process_id, str(current_user.id))
        if not process:
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        # Verify the stage exists
        stage_exists = any(stage.id == move_data.new_stage_id for stage in process.stages)
        if not stage_exists:
            raise HTTPException(status_code=400, detail="Invalid stage ID")
        
        # Move the candidate
        updated_process = await repository.move_candidate_stage(
            process_id=process_id,
            user_id=str(current_user.id),
            candidate_id=candidate_id,  # Use generic candidate_id
            new_stage_id=move_data.new_stage_id,
            new_status=move_data.status,
            notes=move_data.notes
        )
        
        if not updated_process:
            raise HTTPException(status_code=404, detail="Candidate not found in process")
        
        return await _convert_to_process_detail(updated_process, repository)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error moving candidate in process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to move candidate")


@router.put("/{process_id}/candidates/{candidate_id}/remove")
async def remove_candidate_from_process(
    process_id: str,
    candidate_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Remove a candidate from a hiring process.
    
    This will permanently remove the candidate from the process pipeline.
    The candidate can be identified by either resume_bank_entry_id or job_application_id.
    """
    try:
        repository = MongoDBRepository(database)
        
        # Verify the process exists and user has access
        process = await repository.get_hiring_process_by_id(process_id, str(current_user.id))
        if not process:
            raise HTTPException(status_code=404, detail="Hiring process not found")
        
        # Remove the candidate
        success = await repository.remove_candidate_from_process(
            process_id=process_id,
            user_id=str(current_user.id),
            candidate_id=candidate_id
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Candidate not found in process")
        
        return {"message": "Candidate removed from process successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing candidate from process {process_id}: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove candidate from process")


# Helper Functions
async def _convert_to_process_response(process, repository) -> HiringProcessResponse:
    """Convert a process document to response model."""
    # Filter out invalid candidates and count by status
    valid_candidates = []
    for candidate in process.candidates:
        try:
            # Handle both raw dict and Pydantic model
            if hasattr(candidate, 'status') and candidate.status is not None:
                valid_candidates.append(candidate)
            elif isinstance(candidate, dict) and candidate.get('status') is not None:
                valid_candidates.append(candidate)
        except Exception:
            # Skip invalid candidates
            continue
    
    total_candidates = len(valid_candidates)
    active_candidates = sum(1 for c in valid_candidates if (hasattr(c, 'status') and c.status not in [CandidateStageStatus.REJECTED, CandidateStageStatus.WITHDRAWN]) or (isinstance(c, dict) and c.get('status') not in [CandidateStageStatus.REJECTED, CandidateStageStatus.WITHDRAWN]))
    hired_candidates = sum(1 for c in valid_candidates if (hasattr(c, 'status') and c.status in [CandidateStageStatus.HIRED, CandidateStageStatus.ACCEPTED]) or (isinstance(c, dict) and c.get('status') in [CandidateStageStatus.HIRED, CandidateStageStatus.ACCEPTED]))
    rejected_candidates = sum(1 for c in valid_candidates if (hasattr(c, 'status') and c.status == CandidateStageStatus.REJECTED) or (isinstance(c, dict) and c.get('status') == CandidateStageStatus.REJECTED))
    
    return HiringProcessResponse(
        id=str(process.id),
        process_name=process.process_name,
        company_name=process.company_name,
        position_title=process.position_title,
        department=process.department,
        location=process.location,
        description=process.description,
        status=process.status,
        priority=process.priority,
        target_hires=process.target_hires,
        deadline=process.deadline,
        total_candidates=total_candidates,
        active_candidates=active_candidates,
        hired_candidates=hired_candidates,
        rejected_candidates=rejected_candidates,
        created_at=process.created_at,
        updated_at=process.updated_at
    )


async def _convert_to_process_detail(process, repository) -> HiringProcessDetail:
    """Convert a process document to detailed response model."""
    # Get basic response data
    basic_response = await _convert_to_process_response(process, repository)
    
    logger.info(f"Converting process {process.id} to detail response")
    logger.info(f"Process has {len(process.candidates)} candidates")
    
    # Filter out invalid candidates and ensure proper data structure
    valid_candidates = []
    for candidate in process.candidates:
        try:
            # Handle both raw dict and Pydantic model
            candidate_data = {}
            
            if hasattr(candidate, 'resume_bank_entry_id'):
                # Pydantic model
                candidate_data = {
                    'id': getattr(candidate, 'id', None),  # Include the unique ID
                    'application_source': getattr(candidate, 'application_source', 'resume_bank'),
                    'resume_bank_entry_id': candidate.resume_bank_entry_id,
                    'job_application_id': getattr(candidate, 'job_application_id', None),
                    'job_id': getattr(candidate, 'job_id', None),
                    'current_stage_id': candidate.current_stage_id,
                    'status': candidate.status,
                    'notes': getattr(candidate, 'notes', None),
                    'assigned_at': getattr(candidate, 'assigned_at', None),
                    'updated_at': getattr(candidate, 'updated_at', None),
                    'candidate_name': getattr(candidate, 'candidate_name', None),
                    'candidate_email': getattr(candidate, 'candidate_email', None),
                    'candidate_phone': getattr(candidate, 'candidate_phone', None),
                    'candidate_location': getattr(candidate, 'candidate_location', None)
                }
            elif isinstance(candidate, dict):
                # Raw dictionary
                candidate_data = {
                    'id': candidate.get('id'),  # Include the unique ID
                    'application_source': candidate.get('application_source', 'resume_bank'),
                    'resume_bank_entry_id': candidate.get('resume_bank_entry_id'),
                    'job_application_id': candidate.get('job_application_id'),
                    'job_id': candidate.get('job_id'),
                    'current_stage_id': candidate.get('current_stage_id'),
                    'status': candidate.get('status'),
                    'notes': candidate.get('notes'),
                    'assigned_at': candidate.get('assigned_at'),
                    'updated_at': candidate.get('updated_at'),
                    'candidate_name': candidate.get('candidate_name'),
                    'candidate_email': candidate.get('candidate_email'),
                    'candidate_phone': candidate.get('candidate_phone'),
                    'candidate_location': candidate.get('candidate_location')
                }
            
            # Validate required fields
            # For resume bank candidates: need resume_bank_entry_id
            # For job application candidates: need job_application_id
            application_source = candidate_data.get('application_source', 'resume_bank')
            
            if (candidate_data.get('current_stage_id') and 
                candidate_data.get('status')):
                
                # Additional validation based on source
                if application_source == 'resume_bank':
                    if candidate_data.get('resume_bank_entry_id'):
                        valid_candidates.append(candidate_data)
                        logger.info(f"Valid resume bank candidate: {candidate_data.get('candidate_name')} -> Stage {candidate_data.get('current_stage_id')}")
                    else:
                        logger.warning(f"Resume bank candidate missing resume_bank_entry_id: {candidate_data}")
                elif application_source == 'job_application':
                    if candidate_data.get('job_application_id'):
                        valid_candidates.append(candidate_data)
                        logger.info(f"Valid job application candidate: {candidate_data.get('candidate_name')} -> Stage {candidate_data.get('current_stage_id')}")
                    else:
                        logger.warning(f"Job application candidate missing job_application_id: {candidate_data}")
                else:
                    logger.warning(f"Unknown application source: {application_source}")
            else:
                logger.warning(f"Invalid candidate data - missing required fields: {candidate_data}")
                
        except Exception as e:
            logger.warning(f"Skipping invalid candidate: {e}")
            continue
    
    logger.info(f"Found {len(valid_candidates)} valid candidates")
    
    # Calculate stage candidate counts
    stage_candidate_counts = {}
    for candidate in valid_candidates:
        stage_id = candidate.get('current_stage_id')
        if stage_id:
            stage_candidate_counts[stage_id] = stage_candidate_counts.get(stage_id, 0) + 1
    
    logger.info(f"Stage candidate counts: {stage_candidate_counts}")
    
    # Convert stages
    stages = []
    for stage in sorted(process.stages, key=lambda s: s.order):
        stages.append(ProcessStageResponse(
            id=stage.id,
            name=stage.name,
            description=stage.description,
            order=stage.order,
            is_final=stage.is_final,
            candidate_count=stage_candidate_counts.get(stage.id, 0),
            created_at=stage.created_at
        ))
    
    # Convert candidates
    candidates = []
    for candidate in valid_candidates:
        try:
            # Get resume bank entry details if not already available
            candidate_name = candidate.get('candidate_name')
            candidate_email = candidate.get('candidate_email')
            
            # Handle different candidate sources
            application_source = candidate.get('application_source', 'resume_bank')
            
            if not candidate_name or not candidate_email:
                if application_source == 'resume_bank':
                    # Get resume bank entry details
                    resume_entry = None
                    resume_bank_entry_id = candidate.get('resume_bank_entry_id')
                    if resume_bank_entry_id:
                        # Convert ObjectId to string if needed
                        resume_bank_entry_id_str = str(resume_bank_entry_id)
                        resume_entry = await repository.get_resume_bank_entry_by_id(resume_bank_entry_id_str)
                    
                    if resume_entry:
                        candidate_name = resume_entry.candidate_name
                        candidate_email = resume_entry.candidate_email
                    else:
                        candidate_name = "Unknown Candidate"
                        candidate_email = "unknown@example.com"
                
                elif application_source == 'job_application':
                    # For job applications, we should already have the candidate info
                    candidate_name = candidate.get('candidate_name', 'Unknown Candidate')
                    candidate_email = candidate.get('candidate_email', 'unknown@example.com')
                
                else:
                    candidate_name = "Unknown Candidate"
                    candidate_email = "unknown@example.com"
            
            # Find current stage name
            current_stage_name = "Unknown"
            candidate_stage_id = candidate.get('current_stage_id')
            
            if candidate_stage_id:
                for stage in process.stages:
                    if stage.id == candidate_stage_id:
                        current_stage_name = stage.name
                        break
            
            # Ensure resume_bank_entry_id is converted to string
            resume_bank_entry_id = candidate.get('resume_bank_entry_id')
            resume_bank_entry_id_str = str(resume_bank_entry_id) if resume_bank_entry_id else "unknown"
            
            candidates.append(ProcessCandidateResponse(
                id=candidate.get('id'),  # Use the unique ID we added to the database
                application_source=application_source,
                resume_bank_entry_id=resume_bank_entry_id_str if application_source == 'resume_bank' else None,
                job_application_id=str(candidate.get('job_application_id')) if application_source == 'job_application' else None,
                job_id=str(candidate.get('job_id')) if application_source == 'job_application' else None,
                candidate_name=candidate_name,
                candidate_email=candidate_email,
                current_stage_id=candidate.get('current_stage_id'),
                current_stage_name=current_stage_name,
                status=candidate.get('status'),
                notes=candidate.get('notes'),
                assigned_at=candidate.get('assigned_at'),
                updated_at=candidate.get('updated_at')
            ))
            
            logger.info(f"Converted candidate: {candidate_name} -> {current_stage_name}")
            
        except Exception as e:
            logger.warning(f"Failed to convert candidate: {e}")
            continue
    
    logger.info(f"Final candidate count: {len(candidates)}")
    
    return HiringProcessDetail(
        **basic_response.model_dump(),
        stages=stages,
        candidates=candidates
    )
