"""
Resume Bank Repository for MongoDB operations.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from pymongo.database import Database

from app.models.mongodb_models import ResumeBankEntryDocument


class ResumeBankRepository:
    """Repository for resume bank operations."""
    
    def __init__(self, database: Database):
        self.database = database
        self.resume_bank = database.resume_bank_entries
    
    async def create_resume_entry(self, entry_data: Dict[str, Any]) -> Optional[ResumeBankEntryDocument]:
        """Create a new resume bank entry."""
        try:
            entry = ResumeBankEntryDocument(**entry_data)
            result = await self.resume_bank.insert_one(entry.model_dump(by_alias=True))
            entry.id = result.inserted_id
            return entry
        except Exception as e:
            print(f"Error creating resume bank entry: {e}")
            return None
    
    async def get_resume_entry_by_id(self, entry_id: str) -> Optional[ResumeBankEntryDocument]:
        """Get a resume bank entry by ID."""
        try:
            result = await self.resume_bank.find_one({"_id": ObjectId(entry_id)})
            if result:
                return ResumeBankEntryDocument(**result)
            return None
        except Exception as e:
            print(f"Error getting resume bank entry: {e}")
            return None
    
    async def get_resume_entries_by_applicant(self, applicant_email: str) -> List[ResumeBankEntryDocument]:
        """Get resume entries by applicant email."""
        try:
            cursor = self.resume_bank.find({"candidate_email": applicant_email})
            entries = []
            async for doc in cursor:
                entries.append(ResumeBankEntryDocument(**doc))
            return entries
        except Exception as e:
            print(f"Error getting resume entries by applicant: {e}")
            return []
    
    async def get_resume_entries_by_job(self, job_id: str) -> List[ResumeBankEntryDocument]:
        """Get resume entries by job ID."""
        try:
            cursor = self.resume_bank.find({"job_id": job_id})
            entries = []
            async for doc in cursor:
                entries.append(ResumeBankEntryDocument(**doc))
            return entries
        except Exception as e:
            print(f"Error getting resume entries by job: {e}")
            return []
    
    async def update_resume_entry(self, entry_id: str, update_data: Dict[str, Any]) -> Optional[ResumeBankEntryDocument]:
        """Update a resume bank entry."""
        try:
            update_data["updated_at"] = datetime.utcnow()
            result = await self.resume_bank.update_one(
                {"_id": ObjectId(entry_id)},
                {"$set": update_data}
            )
            if result.modified_count > 0:
                return await self.get_resume_entry_by_id(entry_id)
            return None
        except Exception as e:
            print(f"Error updating resume bank entry: {e}")
            return None
    
    async def delete_resume_entry(self, entry_id: str) -> bool:
        """Delete a resume bank entry."""
        try:
            result = await self.resume_bank.delete_one({"_id": ObjectId(entry_id)})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting resume bank entry: {e}")
            return False
