"""
MongoDB repository for database operations.

This module provides MongoDB-specific database operations,
replacing the SQLAlchemy repository with flexible document operations.
"""

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import MongoClient
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from loguru import logger

from app.models.mongodb_models import (
    JobPostingDocument,
    ResumeAnalysisDocument,
    ResumeBankEntryDocument,
    UserDocument,
    COLLECTIONS
)


class MongoDBRepository:
    """MongoDB repository for database operations."""
    
    def __init__(self, database: AsyncIOMotorDatabase):
        self.db = database
        self.job_postings = database[COLLECTIONS["job_postings"]]
        self.resume_analyses = database[COLLECTIONS["resume_analyses"]]
        self.resume_bank_entries = database[COLLECTIONS["resume_bank_entries"]]
        self.users = database[COLLECTIONS["users"]]
    
    # Job Posting operations
    async def create_job_posting(self, job_data: Dict[str, Any]) -> JobPostingDocument:
        """Create a new job posting."""
        job_data["created_at"] = datetime.utcnow()
        job_data["updated_at"] = datetime.utcnow()
        
        result = await self.job_postings.insert_one(job_data)
        job_data["_id"] = result.inserted_id
        
        return JobPostingDocument(**job_data)
    
    async def get_job_posting_by_id(self, job_id: str) -> Optional[JobPostingDocument]:
        """Get a job posting by ID."""
        try:
            job_data = await self.job_postings.find_one({"_id": ObjectId(job_id)})
            if job_data:
                return JobPostingDocument(**job_data)
            return None
        except Exception as e:
            logger.error(f"Error getting job posting {job_id}: {e}")
            return None
    
    async def get_all_job_postings(self) -> List[JobPostingDocument]:
        """Get all job postings."""
        cursor = self.job_postings.find()
        jobs = []
        async for job_data in cursor:
            jobs.append(JobPostingDocument(**job_data))
        return jobs
    
    async def get_job_postings_by_user(self, user_id: ObjectId) -> List[JobPostingDocument]:
        """Get job postings for a specific user."""
        cursor = self.job_postings.find({"user_id": user_id})
        jobs = []
        async for job_data in cursor:
            jobs.append(JobPostingDocument(**job_data))
        return jobs
    
    async def update_job_posting(self, job_id: str, update_data: Dict[str, Any]) -> Optional[JobPostingDocument]:
        """Update a job posting."""
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.job_postings.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_job_posting_by_id(job_id)
        return None
    
    async def delete_job_posting(self, job_id: str) -> bool:
        """Delete a job posting."""
        result = await self.job_postings.delete_one({"_id": ObjectId(job_id)})
        return result.deleted_count > 0
    
    # Resume Analysis operations
    async def create_resume_analysis(self, analysis_data: Dict[str, Any]) -> ResumeAnalysisDocument:
        """Create a new resume analysis."""
        analysis_data["created_at"] = datetime.utcnow()
        analysis_data["updated_at"] = datetime.utcnow()
        
        result = await self.resume_analyses.insert_one(analysis_data)
        analysis_data["_id"] = result.inserted_id
        
        return ResumeAnalysisDocument(**analysis_data)
    
    async def get_resume_analysis_by_id(self, analysis_id: str) -> Optional[ResumeAnalysisDocument]:
        """Get a resume analysis by ID."""
        try:
            analysis_data = await self.resume_analyses.find_one({"_id": ObjectId(analysis_id)})
            if analysis_data:
                return ResumeAnalysisDocument(**analysis_data)
            return None
        except Exception as e:
            logger.error(f"Error getting resume analysis {analysis_id}: {e}")
            return None
    
    async def get_all_resume_analyses(self, skip: int = 0, limit: int = 100) -> List[ResumeAnalysisDocument]:
        """Get all resume analyses with pagination."""
        cursor = self.resume_analyses.find().skip(skip).limit(limit).sort("created_at", -1)
        analyses = []
        async for analysis_data in cursor:
            analyses.append(ResumeAnalysisDocument(**analysis_data))
        return analyses
    
    async def search_resume_analyses(self, query: str) -> List[ResumeAnalysisDocument]:
        """Search resume analyses by text."""
        cursor = self.resume_analyses.find({
            "$text": {"$search": query}
        }).sort("created_at", -1)
        
        analyses = []
        async for analysis_data in cursor:
            analyses.append(ResumeAnalysisDocument(**analysis_data))
        return analyses
    
    # Resume Bank operations
    async def create_resume_bank_entry(self, entry_data: Dict[str, Any]) -> ResumeBankEntryDocument:
        """Create a new resume bank entry."""
        entry_data["created_at"] = datetime.utcnow()
        entry_data["updated_at"] = datetime.utcnow()
        
        result = await self.resume_bank_entries.insert_one(entry_data)
        entry_data["_id"] = result.inserted_id
        
        return ResumeBankEntryDocument(**entry_data)
    
    async def get_resume_bank_entry_by_id(self, entry_id: str) -> Optional[ResumeBankEntryDocument]:
        """Get a resume bank entry by ID."""
        try:
            entry_data = await self.resume_bank_entries.find_one({"_id": ObjectId(entry_id)})
            if entry_data:
                return ResumeBankEntryDocument(**entry_data)
            return None
        except Exception as e:
            logger.error(f"Error getting resume bank entry {entry_id}: {e}")
            return None
    
    async def get_all_resume_bank_entries(self, skip: int = 0, limit: int = 100) -> List[ResumeBankEntryDocument]:
        """Get all resume bank entries with pagination."""
        cursor = self.resume_bank_entries.find().skip(skip).limit(limit).sort("created_at", -1)
        entries = []
        async for entry_data in cursor:
            entries.append(ResumeBankEntryDocument(**entry_data))
        return entries
    
    async def get_resume_bank_entries_by_user(self, user_id: ObjectId, skip: int = 0, limit: int = 100) -> List[ResumeBankEntryDocument]:
        """Get resume bank entries for a specific user."""
        # Handle both string and ObjectId user_ids for backward compatibility
        user_id_str = str(user_id)
        cursor = self.resume_bank_entries.find({
            "$or": [
                {"user_id": user_id},
                {"user_id": user_id_str}
            ]
        }).skip(skip).limit(limit).sort("created_at", -1)
        entries = []
        async for entry_data in cursor:
            entries.append(ResumeBankEntryDocument(**entry_data))
        return entries
    
    async def update_resume_bank_entry(self, entry_id: str, update_data: Dict[str, Any]) -> Optional[ResumeBankEntryDocument]:
        """Update a resume bank entry."""
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.resume_bank_entries.update_one(
            {"_id": ObjectId(entry_id)},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_resume_bank_entry_by_id(entry_id)
        return None
    
    async def delete_resume_bank_entry(self, entry_id: str) -> bool:
        """Delete a resume bank entry."""
        result = await self.resume_bank_entries.delete_one({"_id": ObjectId(entry_id)})
        return result.deleted_count > 0
    
    async def search_resume_bank_entries(self, filters: Dict[str, Any]) -> List[ResumeBankEntryDocument]:
        """Search resume bank entries with filters."""
        query = {}
        
        if filters.get("skills"):
            skills = filters["skills"]
            query["tags"] = {"$in": skills}
        
        if filters.get("location"):
            query["candidate_location"] = {"$regex": filters["location"], "$options": "i"}
        
        if filters.get("experience_level"):
            # Map experience level to years
            exp_mapping = {
                "entry": (0, 2),
                "junior": (1, 3),
                "mid": (3, 7),
                "senior": (5, 10),
                "lead": (8, 15)
            }
            if filters["experience_level"] in exp_mapping:
                min_exp, max_exp = exp_mapping[filters["experience_level"]]
                query["years_experience"] = {"$gte": min_exp, "$lte": max_exp}
        
        if filters.get("status"):
            query["status"] = filters["status"]
        
        cursor = self.resume_bank_entries.find(query).sort("created_at", -1)
        entries = []
        async for entry_data in cursor:
            entries.append(ResumeBankEntryDocument(**entry_data))
        return entries
    
    async def get_resume_bank_stats(self) -> Dict[str, Any]:
        """Get resume bank statistics."""
        pipeline = [
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        cursor = self.resume_bank_entries.aggregate(pipeline)
        status_counts = {}
        async for result in cursor:
            status_counts[result["_id"]] = result["count"]
        
        total_entries = await self.resume_bank_entries.count_documents({})
        
        return {
            "total_entries": total_entries,
            "status_breakdown": status_counts
        }
    
    async def get_resume_bank_stats_by_user(self, user_id: ObjectId) -> Dict[str, Any]:
        """Get resume bank statistics for a specific user."""
        # Handle both string and ObjectId user_ids for backward compatibility
        user_id_str = str(user_id)
        pipeline = [
            {
                "$match": {
                    "$or": [
                        {"user_id": user_id},
                        {"user_id": user_id_str}
                    ]
                }
            },
            {
                "$group": {
                    "_id": "$status",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        cursor = self.resume_bank_entries.aggregate(pipeline)
        status_counts = {}
        async for result in cursor:
            status_counts[result["_id"]] = result["count"]
        
        total_entries = await self.resume_bank_entries.count_documents({
            "$or": [
                {"user_id": user_id},
                {"user_id": user_id_str}
            ]
        })
        
        return {
            "total_entries": total_entries,
            "status_breakdown": status_counts
        }
    
    # User operations
    async def create_user(self, user_data: Dict[str, Any]) -> UserDocument:
        """Create a new user."""
        user_data["created_at"] = datetime.utcnow()
        user_data["updated_at"] = datetime.utcnow()
        
        result = await self.users.insert_one(user_data)
        user_data["_id"] = result.inserted_id
        
        return UserDocument(**user_data)
    
    async def get_user_by_email(self, email: str) -> Optional[UserDocument]:
        """Get a user by email."""
        user_data = await self.users.find_one({"email": email})
        if user_data:
            return UserDocument(**user_data)
        return None
    
    async def get_user_by_username(self, username: str) -> Optional[UserDocument]:
        """Get a user by username."""
        user_data = await self.users.find_one({"username": username})
        if user_data:
            return UserDocument(**user_data)
        return None 