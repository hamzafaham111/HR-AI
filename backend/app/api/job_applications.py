from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import json

from app.models.mongodb_models import UserDocument
from app.services.job_application_service import JobApplicationService
from app.services.resume_bank_service import ResumeBankService
from app.api.auth import get_current_user
from app.core.database import get_database
from app.repositories.job_application_repository import JobApplicationRepository
from app.repositories.resume_bank_repository import ResumeBankRepository

router = APIRouter()

# Request Models
class CreateApplicationFormRequest(BaseModel):
    title: str
    description: Optional[str] = None
    fields: List[Dict[str, Any]] = []
    requires_resume: bool = True
    allow_multiple_files: bool = False
    max_file_size_mb: int = 10
    allowed_file_types: List[str] = ["pdf", "doc", "docx"]

class UpdateApplicationFormRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    fields: Optional[List[Dict[str, Any]]] = None
    requires_resume: Optional[bool] = None
    allow_multiple_files: Optional[bool] = None
    max_file_size_mb: Optional[int] = None
    allowed_file_types: Optional[List[str]] = None

class SubmitApplicationRequest(BaseModel):
    applicant_name: str
    applicant_email: str
    applicant_phone: Optional[str] = None
    form_data: dict = {}
    resume_files: Optional[List[str]] = []  # File names for now, will be enhanced for actual file uploads

class UpdateApplicationStatusRequest(BaseModel):
    status: str
    notes: Optional[str] = None

class ApproveAndAddToProcessRequest(BaseModel):
    hiring_process_id: str
    notes: Optional[str] = None


# API Endpoints

@router.post("/forms/{job_id}")
async def create_application_form(
    job_id: str,
    form_data: CreateApplicationFormRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Create a new job application form."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        form = await service.create_application_form(job_id, form_data.model_dump())
        
        if not form:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create application form"
            )
        
        return {
            "success": True,
            "message": "Application form created successfully",
            "data": {
                "id": str(form.id),
                "title": form.title,
                "description": form.description,
                "fields": form.fields,
                "requires_resume": form.requires_resume,
                "allow_multiple_files": form.allow_multiple_files,
                "max_file_size_mb": form.max_file_size_mb,
                "allowed_file_types": form.allowed_file_types
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create application form: {str(e)}"
        )


@router.get("/forms/{job_id}")
async def get_application_form(
    job_id: str,
    database = Depends(get_database)
):
    """Get application form for a job."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        form = await service.get_application_form_by_job(job_id)
        
        if not form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application form not found"
            )
        
        return {
            "success": True,
            "data": {
                "id": str(form.id),
                "title": form.title,
                "description": form.description,
                "fields": form.fields,
                "requires_resume": form.requires_resume,
                "allow_multiple_files": form.allow_multiple_files,
                "max_file_size_mb": form.max_file_size_mb,
                "allowed_file_types": form.allowed_file_types
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application form: {str(e)}"
        )


@router.put("/forms/{form_id}")
async def update_application_form(
    form_id: str,
    form_data: UpdateApplicationFormRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Update an application form."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        # Remove None values
        update_data = {k: v for k, v in form_data.model_dump().items() if v is not None}
        
        form = await service.update_application_form(form_id, update_data)
        
        if not form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application form not found"
            )
        
        return {
            "success": True,
            "message": "Application form updated successfully",
            "data": {
                "id": str(form.id),
                "title": form.title,
                "description": form.description,
                "fields": form.fields,
                "requires_resume": form.requires_resume,
                "allow_multiple_files": form.allow_multiple_files,
                "max_file_size_mb": form.max_file_size_mb,
                "allowed_file_types": form.allowed_file_types
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application form: {str(e)}"
        )


@router.delete("/forms/{form_id}")
async def delete_application_form(
    form_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Delete an application form."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        success = await service.delete_application_form(form_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application form not found"
            )
        
        return {
            "success": True,
            "message": "Application form deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete application form: {str(e)}"
        )


# Public endpoints (no authentication required)
@router.get("/public/forms/{job_id}")
async def get_public_application_form(
    job_id: str,
    database = Depends(get_database)
):
    """Get public application form for a job."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        form = await service.get_application_form_by_job(job_id)
        
        if not form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application form not found"
            )
        
        return {
            "success": True,
            "data": {
                "id": str(form.id),
                "title": form.title,
                "description": form.description,
                "fields": form.fields,
                "requires_resume": form.requires_resume,
                "allow_multiple_files": form.allow_multiple_files,
                "max_file_size_mb": form.max_file_size_mb,
                "allowed_file_types": form.allowed_file_types
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get application form: {str(e)}"
        )


@router.post("/public/apply/{job_id}")
async def submit_public_application(
    job_id: str,
    application_data: SubmitApplicationRequest,
    database = Depends(get_database)
):
    """Submit a public job application."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        resume_bank_repository = ResumeBankRepository(database)
        resume_bank_service = ResumeBankService(resume_bank_repository)
        # Get the application form for this job
        form = await service.get_application_form_by_job(job_id)
        
        if not form:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application form not found for this job"
            )
        
        # Create the application
        application = await service.create_application(
            job_id=job_id,
            form_id=str(form.id),
            application_data=application_data.model_dump()
        )
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to submit application"
            )
        
        # If resume files are provided, add them to the resume bank
        resume_entries = []
        if application_data.resume_files and len(application_data.resume_files) > 0:
            for resume_file in application_data.resume_files:
                try:
                    # Create resume bank entry
                    resume_entry = await resume_bank_service.create_resume_entry(
                        file_name=resume_file,
                        applicant_name=application_data.applicant_name,
                        applicant_email=application_data.applicant_email,
                        source="job_application",
                        job_id=job_id,
                        application_id=str(application.id),
                        user_id="689743f2d1e90b173d1669f2"  # Default user ID for job applications
                    )
                    if resume_entry:
                        resume_entries.append(str(resume_entry.get('id')))
                except Exception as e:
                    # Log error but don't fail the application submission
                    print(f"Failed to add resume to resume bank: {str(e)}")
        
        return {
            "success": True,
            "message": "Application submitted successfully",
            "data": {
                "application_id": str(application.id),
                "applicant_name": application.applicant_name,
                "applicant_email": application.applicant_email,
                "status": application.status,
                "created_at": application.created_at.isoformat(),
                "resume_entries_added": resume_entries
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit application: {str(e)}"
        )


# Protected endpoints (authentication required)
@router.get("/{job_id}")
async def get_job_applications(
    job_id: str,
    limit: int = 100,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Get all applications for a job."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        applications = await service.get_applications_by_job(job_id, limit)
        
        formatted_applications = []
        for app in applications:
            formatted_applications.append({
                "id": str(app.id),
                "applicant_name": app.applicant_name,
                "applicant_email": app.applicant_email,
                "applicant_phone": app.applicant_phone,
                "form_data": app.form_data,
                "resume_files": app.resume_files,
                "status": app.status,
                "matching_score": app.matching_score,
                "notes": app.notes,
                "created_at": app.created_at.isoformat(),
                "updated_at": app.updated_at.isoformat()
            })
        
        return {
            "success": True,
            "data": {
                "applications": formatted_applications,
                "count": len(formatted_applications)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get applications: {str(e)}"
        )


@router.get("/{job_id}/applications-with-scores")
async def get_applications_with_scores(
    job_id: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Get applications with matching scores for comparison with resume bank candidates."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        applications = await service.get_applications_with_scores(job_id)
        
        return {
            "success": True,
            "data": {
                "applications": applications,
                "count": len(applications)
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get applications with scores: {str(e)}"
        )


@router.put("/applications/{application_id}/status")
async def update_application_status(
    application_id: str,
    status_data: UpdateApplicationStatusRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Update application status."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        application = await service.update_application_status(
            application_id, 
            status_data.status, 
            status_data.notes
        )
        
        if not application:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Application not found"
            )
        
        return {
            "success": True,
            "message": "Application status updated successfully",
            "data": {
                "id": str(application.id),
                "status": application.status,
                "notes": application.status,
                "updated_at": application.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update application status: {str(e)}"
        )


@router.post("/applications/{application_id}/approve-and-add-to-process")
async def approve_and_add_to_process(
    application_id: str,
    process_data: ApproveAndAddToProcessRequest,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Approve a job application and add the candidate to a hiring process."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        result = await service.approve_and_add_to_process(
            application_id=application_id,
            hiring_process_id=process_data.hiring_process_id,
            notes=process_data.notes,
            assigned_by=str(current_user.id)
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to approve application and add to process"
            )
        
        return {
            "success": True,
            "message": "Application approved and candidate added to hiring process successfully",
            "data": {
                "application_id": application_id,
                "hiring_process_id": process_data.hiring_process_id,
                "status": "approved",
                "process_assignment_date": datetime.utcnow().isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to approve application and add to process: {str(e)}"
        )


@router.get("/{job_id}/search")
async def search_applications(
    job_id: str,
    query: str,
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """Search applications by applicant name or email."""
    try:
        repository = JobApplicationRepository(database)
        service = JobApplicationService(repository)
        applications = await service.search_applications(job_id, query)
        
        formatted_applications = []
        for app in applications:
            formatted_applications.append({
                "id": str(app.id),
                "applicant_name": app.applicant_name,
                "applicant_email": app.applicant_email,
                "applicant_phone": app.applicant_phone,
                "status": app.status,
                "matching_score": app.matching_score,
                "created_at": app.created_at.isoformat()
            })
        
        return {
            "success": True,
            "data": {
                "applications": formatted_applications,
                "count": len(formatted_applications),
                "query": query
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to search applications: {str(e)}"
        )
