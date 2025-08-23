from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

from app.repositories.job_application_repository import JobApplicationRepository
from app.models.mongodb_models import JobApplicationFormDocument, JobApplicationDocument


class JobApplicationService:
    """Service for job application forms and applications."""
    
    def __init__(self, repository: JobApplicationRepository, openai_service=None):
        self.repository = repository
        self.openai_service = openai_service
    
    # Job Application Forms
    async def create_application_form(self, job_id: str, form_data: Dict[str, Any]) -> Optional[JobApplicationFormDocument]:
        """Create a new job application form."""
        form_data["job_id"] = ObjectId(job_id)
        return await self.repository.create_application_form(form_data)
    
    async def get_application_form_by_job(self, job_id: str) -> Optional[JobApplicationFormDocument]:
        """Get application form for a specific job."""
        return await self.repository.get_application_form_by_job(job_id)
    
    async def update_application_form(self, form_id: str, update_data: Dict[str, Any]) -> Optional[JobApplicationFormDocument]:
        """Update an application form."""
        return await self.repository.update_application_form(form_id, update_data)
    
    async def delete_application_form(self, form_id: str) -> bool:
        """Delete an application form."""
        return await self.repository.delete_application_form(form_id)
    
    # Job Applications
    async def create_application(self, job_id: str, form_id: str, application_data: Dict[str, Any]) -> Optional[JobApplicationDocument]:
        """Create a new job application."""
        application_data["job_id"] = ObjectId(job_id)
        application_data["form_id"] = ObjectId(form_id)
        
        # Create the application
        application = await self.repository.create_application(application_data)
        
        if application:
            # Calculate AI matching score
            await self._calculate_matching_score(application)
        
        return application
    
    async def get_applications_by_job(self, job_id: str, limit: int = 100) -> List[JobApplicationDocument]:
        """Get all applications for a specific job."""
        return await self.repository.get_applications_by_job(job_id, limit)
    
    async def get_application_by_id(self, application_id: str) -> Optional[JobApplicationDocument]:
        """Get application by ID."""
        return await self.repository.get_application_by_id(application_id)
    
    async def update_application_status(self, application_id: str, status: str, notes: str = None) -> Optional[JobApplicationDocument]:
        """Update application status."""
        return await self.repository.update_application_status(application_id, status, notes)
    
    async def get_applications_count_by_job(self, job_id: str) -> int:
        """Get count of applications for a job."""
        return await self.repository.get_applications_count_by_job(job_id)
    
    async def get_applications_by_status(self, job_id: str, status: str) -> List[JobApplicationDocument]:
        """Get applications by status for a job."""
        return await self.repository.get_applications_by_status(job_id, status)
    
    async def search_applications(self, job_id: str, query: str) -> List[JobApplicationDocument]:
        """Search applications by applicant name or email."""
        return await self.repository.search_applications(job_id, query)
    
    async def _calculate_matching_score(self, application: JobApplicationDocument) -> None:
        """Calculate AI matching score for an application."""
        try:
            # Get job details (you'll need to inject job service or pass job data)
            # For now, we'll use a placeholder score
            # In a real implementation, you'd compare application data with job requirements
            
            # Placeholder: Calculate score based on form completeness
            form_data = application.form_data
            total_fields = len(form_data) if form_data else 0
            filled_fields = sum(1 for value in form_data.values() if value and str(value).strip()) if form_data else 0
            
            if total_fields > 0:
                score = (filled_fields / total_fields) * 100
            else:
                score = 50.0  # Default score
            
            # Update the application with the score
            await self.repository.update_application_matching_score(str(application.id), score)
            
        except Exception as e:
            # Log error but don't fail the application creation
            print(f"Error calculating matching score: {e}")
    
    async def get_applications_with_scores(self, job_id: str) -> List[Dict[str, Any]]:
        """Get applications with matching scores for comparison with resume bank candidates."""
        applications = await self.repository.get_applications_by_job(job_id)
        
        result = []
        for app in applications:
            result.append({
                "id": str(app.id),
                "applicant_name": app.applicant_name,
                "applicant_email": app.applicant_email,
                "status": app.status,
                "matching_score": app.matching_score or 0.0,
                "created_at": app.created_at.isoformat(),
                "source": "direct_application"
            })
        
        # Sort by matching score (highest first)
        result.sort(key=lambda x: x["matching_score"], reverse=True)
        return result

    async def approve_and_add_to_process(
        self,
        application_id: str,
        hiring_process_id: str,
        notes: Optional[str] = None,
        assigned_by: Optional[str] = None
    ) -> bool:
        """Approve a job application and add the candidate to a hiring process."""
        try:
            # Get the application
            application = await self.repository.get_application_by_id(application_id)
            if not application:
                return False
            
            # Update application status to approved
            updated_application = await self.repository.update_application_status(
                application_id, 
                "approved", 
                notes
            )
            
            if not updated_application:
                return False
            
            # Add the process assignment to the application
            await self.repository.add_process_assignment(
                application_id,
                hiring_process_id,
                notes,
                assigned_by
            )
            
            # Now actually add the candidate to the hiring process
            # We need to inject the hiring process repository
            from ..repositories.mongodb_repository import MongoDBRepository
            from ..core.database import get_database
            
            # Get database connection
            database = await get_database()
            hiring_repository = MongoDBRepository(database)
            
            # Add candidate to hiring process
            # For job applications, we'll use the application data instead of resume bank data
            candidate_data = {
                "application_source": "job_application",
                "job_application_id": application.id,
                "job_id": application.job_id,
                "current_stage_id": None,  # Will be set to first stage
                "status": "pending",
                "notes": notes,
                "stage_history": [],
                "assigned_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                # Use application data for candidate information
                "candidate_name": application.applicant_name,
                "candidate_email": application.applicant_email,
                "candidate_phone": application.applicant_phone,
                "candidate_location": application.applicant_location if hasattr(application, 'applicant_location') else None,
                "assigned_by": assigned_by
            }
            
            # Get the hiring process to find the first stage
            hiring_process = await hiring_repository.get_hiring_process_by_id(hiring_process_id, str(assigned_by))
            if not hiring_process or not hiring_process.stages:
                print(f"Hiring process {hiring_process_id} not found or has no stages")
                return False
            
            # Find the first stage (lowest order)
            first_stage = min(hiring_process.stages, key=lambda s: s.order)
            candidate_data["current_stage_id"] = first_stage.id
            
            # Add candidate to hiring process
            result = await hiring_repository.hiring_processes.update_one(
                {"_id": hiring_process.id},
                {
                    "$push": {"candidates": candidate_data},
                    "$set": {"updated_at": datetime.utcnow()}
                }
            )
            
            if result.modified_count > 0:
                print(f"Successfully added candidate {application.applicant_name} to hiring process {hiring_process_id}")
                return True
            else:
                print(f"Failed to add candidate to hiring process {hiring_process_id}")
                return False
            
        except Exception as e:
            print(f"Error approving application and adding to process: {e}")
            return False
