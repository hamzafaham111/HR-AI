from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.mongodb_models import JobApplicationFormDocument, JobApplicationDocument, COLLECTIONS


class JobApplicationRepository:
    """Repository for job application forms and applications."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.job_application_forms = database[COLLECTIONS["job_application_forms"]]
        self.job_applications = database[COLLECTIONS["job_applications"]]
    
    # Job Application Forms
    async def create_application_form(self, form_data: Dict[str, Any]) -> JobApplicationFormDocument:
        """Create a new job application form."""
        form = JobApplicationFormDocument(**form_data)
        result = await self.job_application_forms.insert_one(form.model_dump(by_alias=True))
        form.id = result.inserted_id
        return form
    
    async def get_application_form_by_job(self, job_id: str) -> Optional[JobApplicationFormDocument]:
        """Get application form for a specific job."""
        if not ObjectId.is_valid(job_id):
            return None
        
        form_data = await self.job_application_forms.find_one({
            "job_id": ObjectId(job_id),
            "is_active": True
        })
        
        if form_data:
            return JobApplicationFormDocument(**form_data)
        return None
    
    async def get_application_form_by_id(self, form_id: str) -> Optional[JobApplicationFormDocument]:
        """Get application form by ID."""
        if not ObjectId.is_valid(form_id):
            return None
        
        form_data = await self.job_application_forms.find_one({"_id": ObjectId(form_id)})
        
        if form_data:
            return JobApplicationFormDocument(**form_data)
        return None
    
    async def update_application_form(self, form_id: str, update_data: Dict[str, Any]) -> Optional[JobApplicationFormDocument]:
        """Update an application form."""
        if not ObjectId.is_valid(form_id):
            return None
        
        update_data["updated_at"] = datetime.now()
        
        result = await self.job_application_forms.update_one(
            {"_id": ObjectId(form_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_application_form_by_id(form_id)
        return None
    
    async def delete_application_form(self, form_id: str) -> bool:
        """Delete an application form."""
        if not ObjectId.is_valid(form_id):
            return False
        
        result = await self.job_application_forms.delete_one({"_id": ObjectId(form_id)})
        return result.deleted_count > 0
    
    # Job Applications
    async def create_application(self, application_data: Dict[str, Any]) -> JobApplicationDocument:
        """Create a new job application."""
        application = JobApplicationDocument(**application_data)
        result = await self.job_applications.insert_one(application.model_dump(by_alias=True))
        application.id = result.inserted_id
        return application
    
    async def get_applications_by_job(self, job_id: str, limit: int = 100) -> List[JobApplicationDocument]:
        """Get all applications for a specific job."""
        if not ObjectId.is_valid(job_id):
            return []
        
        cursor = self.job_applications.find({"job_id": ObjectId(job_id)}).sort("created_at", -1).limit(limit)
        
        applications = []
        async for application_data in cursor:
            try:
                applications.append(JobApplicationDocument(**application_data))
            except Exception as e:
                # Log error and continue with other applications
                continue
        
        return applications
    
    async def get_application_by_id(self, application_id: str) -> Optional[JobApplicationDocument]:
        """Get application by ID."""
        if not ObjectId.is_valid(application_id):
            return None
        
        application_data = await self.job_applications.find_one({"_id": ObjectId(application_id)})
        
        if application_data:
            return JobApplicationDocument(**application_data)
        return None
    
    async def update_application_status(self, application_id: str, status: str, notes: str = None) -> Optional[JobApplicationDocument]:
        """Update application status."""
        if not ObjectId.is_valid(application_id):
            return None
        
        update_data = {
            "status": status,
            "updated_at": datetime.now()
        }
        
        if notes is not None:
            update_data["notes"] = notes
        
        result = await self.job_applications.update_one(
            {"_id": ObjectId(application_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_application_by_id(application_id)
        return None
    
    async def update_application_matching_score(self, application_id: str, score: float) -> bool:
        """Update application AI matching score."""
        if not ObjectId.is_valid(application_id):
            return False
        
        result = await self.job_applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$set": {
                    "matching_score": score,
                    "updated_at": datetime.now()
                }
            }
        )
        
        return result.modified_count > 0
    
    async def get_applications_count_by_job(self, job_id: str) -> int:
        """Get count of applications for a job."""
        if not ObjectId.is_valid(job_id):
            return 0
        
        count = await self.job_applications.count_documents({"job_id": ObjectId(job_id)})
        return count
    
    async def get_applications_by_status(self, job_id: str, status: str) -> List[JobApplicationDocument]:
        """Get applications by status for a job."""
        if not ObjectId.is_valid(job_id):
            return []
        
        cursor = self.job_applications.find({
            "job_id": ObjectId(job_id),
            "status": status
        }).sort("created_at", -1)
        
        applications = []
        async for application_data in cursor:
            try:
                applications.append(JobApplicationDocument(**application_data))
            except Exception as e:
                # Log error and continue with other applications
                continue
        
        return applications
    
    async def search_applications(self, job_id: str, query: str) -> List[JobApplicationDocument]:
        """Search applications by applicant name or email."""
        if not ObjectId.is_valid(job_id):
            return []
        
        cursor = self.job_applications.find({
            "job_id": ObjectId(job_id),
            "$or": [
                {"applicant_name": {"$regex": query, "$options": "i"}},
                {"applicant_email": {"$regex": query, "$options": "i"}}
            ]
        }).sort("created_at", -1)
        
        applications = []
        async for application_data in cursor:
            try:
                applications.append(JobApplicationDocument(**application_data))
            except Exception as e:
                # Log error and continue with other applications
                continue
        
        return applications

    async def add_process_assignment(
        self,
        application_id: str,
        hiring_process_id: str,
        notes: Optional[str] = None,
        assigned_by: Optional[str] = None
    ) -> bool:
        """Add a hiring process assignment to a job application."""
        if not ObjectId.is_valid(application_id):
            return False
        
        process_assignment = {
            "hiring_process_id": ObjectId(hiring_process_id),
            "assigned_at": datetime.now(),
            "notes": notes,
            "assigned_by": ObjectId(assigned_by) if assigned_by else None
        }
        
        result = await self.job_applications.update_one(
            {"_id": ObjectId(application_id)},
            {
                "$push": {"assigned_processes": process_assignment},
                "$set": {"updated_at": datetime.now()}
            }
        )
        
        return result.modified_count > 0

    async def get_process_assignments(self, application_id: str) -> List[Dict[str, Any]]:
        """Get all process assignments for a job application."""
        if not ObjectId.is_valid(application_id):
            return []
        
        application = await self.job_applications.find_one({"_id": ObjectId(application_id)})
        if application:
            return application.get("assigned_processes", [])
        return []
