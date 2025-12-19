"""
Centralized dependency injection functions for FastAPI.

This module provides all dependency injection functions used throughout
the application, ensuring consistent service and repository creation.
"""

from typing import Optional
from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.container import get_container
from app.core.logging import logger

# Repositories (only MongoDB-based repositories)
from app.repositories.resume_bank_repository import ResumeBankRepository
from app.repositories.job_application_repository import JobApplicationRepository
from app.repositories.meeting_repository import MeetingRepository
from app.repositories.mongodb_repository import MongoDBRepository

# Note: JobRepository and ResumeRepository are SQLAlchemy-based legacy files
# and are not used in this MongoDB-based application

# Services
from app.services.job_application_service import JobApplicationService
from app.services.resume_bank_service import ResumeBankService
from app.services.meeting_service import MeetingService
from app.services.openai_service import OpenAIService


# ============================================================================
# Repository Dependencies
# ============================================================================

# Note: JobRepository and ResumeRepository are not available as they are
# SQLAlchemy-based legacy files. Use MongoDBRepository for job and resume operations.


def get_resume_bank_repository(
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> ResumeBankRepository:
    """Get ResumeBankRepository instance."""
    container = get_container()
    return container.get_repository(ResumeBankRepository)


def get_job_application_repository(
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> JobApplicationRepository:
    """Get JobApplicationRepository instance."""
    container = get_container()
    return container.get_repository(JobApplicationRepository)


def get_meeting_repository(
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> MeetingRepository:
    """Get MeetingRepository instance."""
    container = get_container()
    return container.get_repository(MeetingRepository)


def get_mongodb_repository(
    database: AsyncIOMotorDatabase = Depends(get_database)
) -> MongoDBRepository:
    """Get MongoDBRepository instance."""
    # MongoDBRepository is created with database, so we create it directly
    # rather than using the container since it needs the database instance
    return MongoDBRepository(database)


# ============================================================================
# Service Dependencies
# ============================================================================

def get_openai_service_dependency() -> Optional[OpenAIService]:
    """Get OpenAI service instance (can be None if not configured)."""
    container = get_container()
    return container.get_openai_service()


def get_job_application_service(
    repository: JobApplicationRepository = Depends(get_job_application_repository),
    openai_service: Optional[OpenAIService] = Depends(get_openai_service_dependency)
) -> JobApplicationService:
    """
    Get JobApplicationService instance.
    
    Args:
        repository: JobApplicationRepository instance
        openai_service: OpenAI service (optional)
        
    Returns:
        JobApplicationService instance
    """
    # Check if service is already registered
    container = get_container()
    service_key = (JobApplicationService, repository, openai_service)
    
    # For now, create new instance each time (can be optimized with caching)
    return JobApplicationService(repository, openai_service)


def get_resume_bank_service(
    repository: ResumeBankRepository = Depends(get_resume_bank_repository),
    openai_service: Optional[OpenAIService] = Depends(get_openai_service_dependency)
) -> ResumeBankService:
    """
    Get ResumeBankService instance.
    
    Args:
        repository: ResumeBankRepository instance
        openai_service: OpenAI service (optional)
        
    Returns:
        ResumeBankService instance
    """
    return ResumeBankService(repository, openai_service)


def get_meeting_service(
    repository: MeetingRepository = Depends(get_meeting_repository)
) -> MeetingService:
    """
    Get MeetingService instance.
    
    Args:
        repository: MeetingRepository instance
        
    Returns:
        MeetingService instance
    """
    return MeetingService(repository)

