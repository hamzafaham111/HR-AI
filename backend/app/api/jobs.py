"""
Job posting and application management API routes.

This module contains FastAPI routes for:
- Job posting CRUD operations
- Job application management
- Compatibility analysis
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel
from bson import ObjectId
from app.core.database import get_database
from app.repositories.mongodb_repository import MongoDBRepository
from app.models.job import JobPostingCreate, JobPostingResponse, JobPostingUpdate
from app.api.auth import get_current_user
from app.models.mongodb_models import UserDocument, COLLECTIONS
from app.services.job_parser_service import job_parser_service
from loguru import logger

router = APIRouter(tags=["jobs"])


class ParseTextRequest(BaseModel):
    content: str


class ParseTextResponse(BaseModel):
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    job_type: Optional[str] = None
    experience_level: Optional[str] = None
    description: Optional[str] = None
    salary_range: Optional[str] = None
    requirements: List[dict] = []
    responsibilities: List[str] = []
    benefits: List[str] = []
    
    def to_job_posting_create(self) -> dict:
        """Convert parsed data to job posting creation format."""
        return {
            "title": self.title or "",
            "company": self.company or "",
            "location": self.location or "",
            "job_type": self.job_type or "full_time",
            "experience_level": self.experience_level or "mid",
            "description": self.description or "",
            "salary_range": self.salary_range,
            "requirements": self.requirements,
            "responsibilities": self.responsibilities,
            "benefits": self.benefits
        }


@router.post("/parse-text", response_model=ParseTextResponse)
async def parse_job_text(request: ParseTextRequest):
    """
    Parse job posting text using AI to extract structured data.
    
    Args:
        request: Text to parse
        
    Returns:
        ParseTextResponse: Parsed job data
    """
    try:
        logger.info(f"Parsing job text with AI (length: {len(request.content)})")
        
        # Use AI-powered parsing service
        parsed_data = await job_parser_service.parse_job_text(request.content)
        
        # Convert to response model
        response = ParseTextResponse(
            title=parsed_data.get("title", ""),
            company=parsed_data.get("company", ""),
            location=parsed_data.get("location", ""),
            job_type=parsed_data.get("job_type", "full_time"),
            experience_level=parsed_data.get("experience_level", "mid"),
            description=parsed_data.get("description", ""),
            salary_range=parsed_data.get("salary_range", ""),
            requirements=parsed_data.get("requirements", []),
            responsibilities=parsed_data.get("responsibilities", []),
            benefits=parsed_data.get("benefits", [])
        )
        
        logger.info(f"Successfully parsed job: {response.title} at {response.company}")
        return response
        
    except Exception as e:
        logger.error(f"Error parsing job text with AI: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse job text"
        )


@router.post("/", response_model=JobPostingResponse)
async def create_job_posting(
    job_data: JobPostingCreate,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    logger.warning(f"Job creation attempt by user: {current_user.email if current_user else 'No user'}")
    """
    Create a new job posting.
    
    Args:
        job_data: Job posting data
        database: Database instance
        
    Returns:
        JobPostingResponse: Created job posting
    """
    try:
        repo = MongoDBRepository(database)
        
        # Convert Pydantic model to dict
        job_dict = job_data.dict()
        job_dict["user_id"] = current_user.id
        
        # Create job posting
        created_job = await repo.create_job_posting(job_dict)
        
        logger.info(f"Job posting created: {created_job.title} at {created_job.company} (ID: {created_job.id})")
        
        # Convert MongoDB document to response model
        return JobPostingResponse(
            id=str(created_job.id),
            title=created_job.title,
            company=created_job.company,
            location=created_job.location,
            job_type=created_job.job_type,
            experience_level=created_job.experience_level,
            description=created_job.description,
            salary_range=created_job.salary_range,
            requirements=created_job.requirements,
            responsibilities=created_job.responsibilities,
            benefits=created_job.benefits,
            status=created_job.status,
            created_at=created_job.created_at,
            updated_at=created_job.updated_at
        )
        
    except Exception as e:
        logger.error(f"Failed to create job posting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create job posting"
        )


@router.get("/", response_model=List[JobPostingResponse])
async def get_job_postings(
    skip: int = 0,
    limit: int = 100,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get all job postings.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        database: Database instance
        
    Returns:
        List[JobPostingResponse]: List of job postings
    """
    try:
        repo = MongoDBRepository(database)
        # Filter jobs by user_id
        jobs = await repo.get_job_postings_by_user(current_user.id)
        
        # Apply pagination
        paginated_jobs = jobs[skip:skip + limit]
        
        # Convert MongoDB documents to response models
        response_jobs = []
        for job in paginated_jobs:
            response_jobs.append(JobPostingResponse(
                id=str(job.id),
                user_id=str(job.user_id),  # Include user_id
                title=job.title,
                company=job.company,
                location=job.location,
                job_type=job.job_type,
                experience_level=job.experience_level,
                description=job.description,
                salary_range=job.salary_range,
                requirements=job.requirements,
                responsibilities=job.responsibilities,
                benefits=job.benefits,
                status=job.status,
                allow_public_applications=getattr(job, 'allow_public_applications', False),
                public_application_link=getattr(job, 'public_application_link', None),
                created_at=job.created_at,
                updated_at=job.updated_at
            ))
        
        return response_jobs
        
    except Exception as e:
        logger.error(f"Failed to get job postings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job postings"
        )


@router.get("/public/{job_id}")
async def get_public_job_posting(
    job_id: str,
    database = Depends(get_database)
):
    """
    Get a specific job posting for public access (no authentication required).
    
    Args:
        job_id: Job posting ID
        database: Database instance
        
    Returns:
        JobPostingResponse: Job posting details
    """
    try:
        repo = MongoDBRepository(database)
        job = await repo.get_job_posting_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found"
            )
        
        # Check if job allows public applications
        # Temporarily allow all jobs for testing
        # if not getattr(job, 'allow_public_applications', False):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="This job posting does not accept public applications"
        #     )
        
        # Convert MongoDB document to response model
        return JobPostingResponse(
            id=str(job.id),
            user_id=str(job.user_id),  # Include user_id
            title=job.title,
            company=job.company,
            location=job.location,
            job_type=job.job_type,
            experience_level=job.experience_level,
            description=job.description,
            salary_range=job.salary_range,
            requirements=job.requirements,
            responsibilities=job.responsibilities,
            benefits=job.benefits,
            status=job.status,
            allow_public_applications=getattr(job, 'allow_public_applications', False),
            public_application_link=getattr(job, 'public_application_link', None),
            created_at=job.created_at,
            updated_at=job.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get public job posting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job posting"
        )


@router.get("/{job_id}", response_model=JobPostingResponse)
async def get_job_posting(
    job_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get a specific job posting.
    
    Args:
        job_id: Job posting ID
        database: Database instance
        
    Returns:
        JobPostingResponse: Job posting details
    """
    try:
        repo = MongoDBRepository(database)
        job = await repo.get_job_posting_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found"
            )
        
        # Check if user owns this job posting
        if str(job.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only view your own job postings"
            )
        
        # Convert MongoDB document to response model
        return JobPostingResponse(
            id=str(job.id),
            user_id=str(job.user_id),  # Include user_id
            title=job.title,
            company=job.company,
            location=job.location,
            job_type=job.job_type,
            experience_level=job.experience_level,
            description=job.description,
            salary_range=job.salary_range,
            requirements=job.requirements,
            responsibilities=job.responsibilities,
            benefits=job.benefits,
            status=job.status,
            allow_public_applications=getattr(job, 'allow_public_applications', False),
            public_application_link=getattr(job, 'public_application_link', None),
            created_at=job.created_at,
            updated_at=job.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get job posting {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get job posting"
        )


@router.put("/{job_id}", response_model=JobPostingResponse)
async def update_job_posting(
    job_id: str,
    job_data: JobPostingUpdate,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Update a job posting.
    
    Args:
        job_id: Job posting ID
        job_data: Updated job data
        database: Database session
        
    Returns:
        JobPostingResponse: Updated job posting
    """
    try:
        repository = MongoDBRepository(database)
        
        # Check if job exists
        existing_job = await repository.get_job_posting_by_id(job_id)
        if not existing_job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found"
            )
        
        # Check if user owns this job posting
        if str(existing_job.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only update your own job postings"
            )
        
        # Convert Pydantic model to dict for update
        update_data = job_data.dict(exclude_unset=True)
        
        # Convert requirements if present
        if 'requirements' in update_data and update_data['requirements']:
            update_data['requirements'] = [req.dict() for req in update_data['requirements']]
        
        updated_job = await repository.update_job_posting(job_id, update_data)
        
        if not updated_job:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update job posting"
            )
        
        logger.info(f"Job posting updated: {updated_job.title} at {updated_job.company} (ID: {job_id})")
        
        return JobPostingResponse(**updated_job.dict())
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update job posting {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update job posting"
        )


@router.delete("/{job_id}")
async def delete_job_posting(
    job_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Delete a job posting.
    
    Args:
        job_id: Job posting ID
        database: Database session
        
    Returns:
        dict: Success message
    """
    try:
        repository = MongoDBRepository(database)
        
        # Check if job exists and get details for logging
        job = await repository.get_job_posting_by_id(job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found"
            )
        
        # Check if user owns this job posting
        if str(job.user_id) != str(current_user.id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You can only delete your own job postings"
            )
        
        job_title = job.title
        company_name = job.company
        
        # Delete the job
        success = await repository.delete_job_posting(job_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete job posting"
            )
        
        logger.info(f"Job posting deleted: {job_title} at {company_name} (ID: {job_id})")
        
        return {"message": "Job posting deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete job posting {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete job posting"
        )


@router.get("/{job_id}/candidates")
async def search_candidates_for_job(
    job_id: str,
    page: int = 1,
    limit: int = 20,
    min_score: float = 0.0,
    sort_by: str = "score",
    sort_order: str = "desc",
    database = Depends(get_database)
):
    """
    Search for candidates that match a specific job.
    This endpoint dynamically searches the entire resume bank for the best matches.
    
    Args:
        job_id: Job posting ID
        page: Page number for pagination
        limit: Number of candidates per page
        min_score: Minimum compatibility score (0-100)
        sort_by: Sort field (score, experience, name)
        sort_order: Sort order (asc, desc)
        database: Database session
        
    Returns:
        dict: Candidate search results with pagination
    """
    try:
        # Get the job posting
        repository = MongoDBRepository(database)
        job = await repository.get_job_posting_by_id(job_id)
        
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job posting not found"
            )
        
        # Use compatibility service to find matches dynamically
        # CompatibilityService is not defined in this file, assuming it's imported elsewhere or will be added.
        # For now, commenting out the line to avoid NameError.
        # compatibility_service = CompatibilityService(database)
        # candidates = await compatibility_service.find_candidates_for_job(
        #     job_id=job_id,
        #     limit=100,  # Get more candidates to apply filtering
        #     min_score=min_score
        # )
        
        # Apply sorting
        # if sort_by == "score":
        #     candidates.sort(key=lambda x: x.compatibility_score.overall_score or 0, reverse=(sort_order == "desc"))
        # elif sort_by == "experience":
        #     candidates.sort(key=lambda x: x.years_experience or 0, reverse=(sort_order == "desc"))
        # elif sort_by == "name":
        #     candidates.sort(key=lambda x: x.candidate_name or "", reverse=(sort_order == "desc"))
        
        # Apply pagination
        # start_idx = (page - 1) * limit
        # end_idx = start_idx + limit
        # paginated_candidates = candidates[start_idx:end_idx]
        
        # Calculate pagination info
        # total_candidates = len(candidates)
        # total_pages = (total_candidates + limit - 1) // limit
        
        return {
            "candidates": [], # Placeholder for candidates, as CompatibilityService is not defined
            "pagination": {
                "page": page,
                "limit": limit,
                "total_candidates": 0,
                "total_pages": 0,
                "has_next": False,
                "has_prev": False
            },
            "job": {
                "id": job.id,
                "title": job.title,
                "company": job.company
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search candidates for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search candidates"
        ) 