"""
Resume Bank Service for business logic operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from app.repositories.resume_bank_repository import ResumeBankRepository


class ResumeBankService:
    """Service for resume bank operations."""
    
    def __init__(self, repository: ResumeBankRepository):
        self.repository = repository
    
    async def create_resume_entry(
        self,
        file_name: str,
        applicant_name: str,
        applicant_email: str,
        source: str = "manual_upload",
        job_id: Optional[str] = None,
        application_id: Optional[str] = None,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Create a new resume bank entry."""
        try:
            entry_data = {
                "candidate_name": applicant_name,
                "candidate_email": applicant_email,
                "filename": file_name,
                "source": source,
                "job_id": job_id,
                "application_id": application_id,
                "status": "active",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                **kwargs
            }

            
            entry = await self.repository.create_resume_entry(entry_data)
            if entry:
                return {
                    "id": str(entry.id),
                    "candidate_name": entry.candidate_name,
                    "candidate_email": entry.candidate_email,
                    "filename": entry.filename,
                    "source": entry.source,
                    "status": entry.status,
                    "created_at": entry.created_at
                }
            return None
        except Exception as e:
            print(f"Error in create_resume_entry: {e}")
            return None
    
    async def get_resume_entry_by_id(self, entry_id: str) -> Optional[Dict[str, Any]]:
        """Get a resume bank entry by ID."""
        try:
            entry = await self.repository.get_resume_entry_by_id(entry_id)
            if entry:
                return {
                    "id": str(entry.id),
                    "candidate_name": entry.candidate_name,
                    "candidate_email": entry.candidate_email,
                    "filename": entry.filename,
                    "source": entry.source,
                    "status": entry.status,
                    "created_at": entry.created_at,
                    "updated_at": entry.updated_at
                }
            return None
        except Exception as e:
            print(f"Error in get_resume_entry_by_id: {e}")
            return None
    
    async def get_resume_entries_by_job(self, job_id: str) -> List[Dict[str, Any]]:
        """Get resume entries by job ID."""
        try:
            entries = await self.repository.get_resume_entries_by_job(job_id)
            return [
                {
                    "id": str(entry.id),
                    "candidate_name": entry.candidate_name,
                    "candidate_email": entry.candidate_email,
                    "filename": entry.filename,
                    "source": entry.source,
                    "status": entry.status,
                    "created_at": entry.created_at
                }
                for entry in entries
            ]
        except Exception as e:
            print(f"Error in get_resume_entries_by_job: {e}")
            return []
    
    async def update_resume_entry(self, entry_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update a resume bank entry."""
        try:
            entry = await self.repository.update_resume_entry(entry_id, update_data)
            if entry:
                return {
                    "id": str(entry.id),
                    "candidate_name": entry.candidate_name,
                    "candidate_email": entry.candidate_email,
                    "filename": entry.filename,
                    "source": entry.source,
                    "status": entry.status,
                    "created_at": entry.created_at,
                    "updated_at": entry.updated_at
                }
            return None
        except Exception as e:
            print(f"Error in update_resume_entry: {e}")
            return None
