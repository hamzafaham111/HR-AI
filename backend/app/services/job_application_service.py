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
