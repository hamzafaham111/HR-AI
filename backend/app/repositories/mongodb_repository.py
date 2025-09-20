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
    HiringProcessDocument,
    ProcessStatus,
    CandidateStageStatus,
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
        self.hiring_processes = database[COLLECTIONS["hiring_processes"]]
    
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
        entry_data["id"] = str(result.inserted_id)
        
        return ResumeBankEntryDocument(**entry_data)
    
    async def get_resume_bank_entry_by_id(self, entry_id: str) -> Optional[ResumeBankEntryDocument]:
        """Get a resume bank entry by ID."""
        try:
            entry_data = await self.resume_bank_entries.find_one({"_id": ObjectId(entry_id)})
            if entry_data:
                # Ensure the _id field is properly mapped to id
                if "_id" in entry_data:
                    entry_data["id"] = str(entry_data["_id"])
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
            # Ensure the _id field is properly mapped to id
            if "_id" in entry_data:
                entry_data["id"] = str(entry_data["_id"])
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
            # Ensure the _id field is properly mapped to id
            if "_id" in entry_data:
                entry_data["id"] = str(entry_data["_id"])
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
    
    # Hiring Process operations
    async def create_hiring_process(self, process_data: Dict[str, Any]) -> HiringProcessDocument:
        """Create a new hiring process."""
        process_data["created_at"] = datetime.utcnow()
        process_data["updated_at"] = datetime.utcnow()
        
        result = await self.hiring_processes.insert_one(process_data)
        process_data["_id"] = result.inserted_id
        
        return HiringProcessDocument(**process_data)
    
    async def get_hiring_process_by_id(self, process_id: str, user_id: str) -> Optional[HiringProcessDocument]:
        """Get a hiring process by ID for a specific user."""
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
        except Exception:
            return None
        
        process_data = await self.hiring_processes.find_one({
            "_id": process_object_id,
            "user_id": user_object_id
        })
        
        if process_data:
            try:
                # Handle existing data that might be missing required fields
                if 'candidates' in process_data:
                    # Clean up invalid candidates
                    valid_candidates = []
                    for candidate in process_data['candidates']:
                        try:
                            # Set default values for missing required fields
                            if 'application_source' not in candidate:
                                candidate['application_source'] = 'resume_bank'  # Default for existing data
                            if 'candidate_name' not in candidate:
                                candidate['candidate_name'] = 'Unknown Candidate'
                            if 'candidate_email' not in candidate:
                                candidate['candidate_email'] = 'unknown@example.com'
                            
                            valid_candidates.append(candidate)
                        except Exception as e:
                            logger.warning(f"Skipping invalid candidate: {e}")
                            continue
                    
                    process_data['candidates'] = valid_candidates
                
                return HiringProcessDocument(**process_data)
            except Exception as e:
                logger.warning(f"Error creating hiring process document: {e}")
                return None
        return None
    
    async def get_hiring_processes_by_user(
        self,
        user_id: str,
        status: Optional[ProcessStatus] = None,
        search: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> List[HiringProcessDocument]:
        """Get hiring processes for a user with optional filtering."""
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            logger.error(f"Invalid user_id format: {user_id}")
            return []
        
        # Build query - using $or to handle both ObjectId and string formats
        query = {"$or": [
            {"user_id": user_object_id},
            {"user_id": user_id}
        ]}
        
        # Add status filter
        if status:
            query["status"] = status
        
        # Add search filter
        if search:
            search_regex = {"$regex": search, "$options": "i"}
            query["$or"] = [
                {"process_name": search_regex},
                {"company_name": search_regex},
                {"position_title": search_regex}
            ]
        
        cursor = self.hiring_processes.find(query).sort("created_at", -1).skip(offset).limit(limit)
        processes = []
        
        async for process_data in cursor:
            try:
                # Handle existing data that might be missing required fields
                if 'candidates' in process_data:
                    # Clean up invalid candidates
                    valid_candidates = []
                    for candidate in process_data['candidates']:
                        try:
                            # Set default values for missing required fields
                            if 'application_source' not in candidate:
                                candidate['application_source'] = 'resume_bank'  # Default for existing data
                            if 'candidate_name' not in candidate:
                                candidate['candidate_name'] = 'Unknown Candidate'
                            if 'candidate_email' not in candidate:
                                candidate['candidate_email'] = 'unknown@example.com'
                            
                            valid_candidates.append(candidate)
                        except Exception as e:
                            logger.warning(f"Skipping invalid candidate: {e}")
                            continue
                    
                    process_data['candidates'] = valid_candidates
                
                processes.append(HiringProcessDocument(**process_data))
            except Exception as e:
                logger.warning(f"Skipping invalid hiring process document: {e}")
                continue
        
        return processes
    
    async def get_hiring_processes_by_user_and_status(
        self,
        user_id: str,
        status: ProcessStatus
    ) -> List[HiringProcessDocument]:
        """Get hiring processes for a user with specific status."""
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            logger.error(f"Invalid user_id format: {user_id}")
            return []
        
        # Build query - using $or to handle both ObjectId and string formats
        # Also handle documents with no status (default to active)
        query = {
            "$and": [
                {
                    "$or": [
                        {"user_id": user_object_id},
                        {"user_id": user_id}
                    ]
                },
                {
                    "$or": [
                        {"status": status.value},  # Status matches the requested status
                        {"status": {"$exists": False}},  # Status field doesn't exist (default to active)
                        {"status": None}  # Status is null (default to active)
                    ]
                }
            ]
        }
        
        cursor = self.hiring_processes.find(query).sort("created_at", -1)
        processes = []
        
        async for process_data in cursor:
            try:
                # Handle existing data that might be missing required fields
                if 'candidates' in process_data:
                    # Clean up invalid candidates
                    valid_candidates = []
                    for candidate in process_data['candidates']:
                        try:
                            # Set default values for missing required fields
                            if 'application_source' not in candidate:
                                candidate['application_source'] = 'resume_bank'  # Default for existing data
                            if 'candidate_name' not in candidate:
                                candidate['candidate_name'] = 'Unknown Candidate'
                            if 'candidate_email' not in candidate:
                                candidate['candidate_email'] = 'unknown@example.com'
                            
                            valid_candidates.append(candidate)
                        except Exception as e:
                            logger.warning(f"Skipping invalid candidate: {e}")
                            continue
                    
                    process_data['candidates'] = valid_candidates
                
                processes.append(HiringProcessDocument(**process_data))
            except Exception as e:
                logger.warning(f"Skipping invalid hiring process document: {e}")
                continue
        
        return processes
    
    async def update_hiring_process(self, process_id: str, user_id: str, update_data: Dict[str, Any]) -> Optional[HiringProcessDocument]:
        """Update a hiring process."""
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
        except Exception:
            return None
        
        update_data["updated_at"] = datetime.utcnow()
        
        result = await self.hiring_processes.update_one(
            {"_id": process_object_id, "user_id": user_object_id},
            {"$set": update_data}
        )
        
        if result.modified_count > 0:
            return await self.get_hiring_process_by_id(process_id, user_id)
        return None
    
    async def delete_hiring_process(self, process_id: str, user_id: str) -> bool:
        """Delete a hiring process."""
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
        except Exception:
            return False
        
        result = await self.hiring_processes.delete_one({
            "_id": process_object_id,
            "user_id": user_object_id
        })
        
        return result.deleted_count > 0
    
    async def add_candidate_to_process(
        self,
        process_id: str,
        user_id: str,
        resume_bank_entry_id: str,
        initial_stage_id: str,
        notes: Optional[str] = None
    ) -> Optional[HiringProcessDocument]:
        """Add a candidate to a hiring process."""
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
            resume_object_id = ObjectId(resume_bank_entry_id)
        except Exception as e:
            logger.error(f"Invalid ObjectId conversion: {e}")
            return None
        
        # Get resume bank entry to extract candidate information first
        resume_entry = None
        try:
            resume_entry = await self.get_resume_bank_entry_by_id(str(resume_object_id))
            if not resume_entry:
                logger.error(f"Resume bank entry not found: {resume_bank_entry_id}")
                return None
        except Exception as e:
            logger.error(f"Error fetching resume bank entry: {e}")
            return None
        
        # Check if candidate is already in this process (improved duplicate check)
        existing_process = await self.get_hiring_process_by_id(process_id, user_id)
        if existing_process:
            for existing_candidate in existing_process.candidates:
                # Check by resume_bank_entry_id
                if hasattr(existing_candidate, 'resume_bank_entry_id') and existing_candidate.resume_bank_entry_id:
                    if str(existing_candidate.resume_bank_entry_id) == resume_bank_entry_id:
                        logger.warning(f"Candidate already exists in process (resume_bank_entry_id): {resume_bank_entry_id}")
                        return None
                # Check by candidate email (additional safety check)
                if hasattr(existing_candidate, 'candidate_email') and existing_candidate.candidate_email:
                    if existing_candidate.candidate_email.lower() == resume_entry.candidate_email.lower():
                        logger.warning(f"Candidate already exists in process (email): {resume_entry.candidate_email}")
                        return None
        
        # Generate unique candidate ID for this process
        import uuid
        candidate_id = str(uuid.uuid4())
        
        # Create candidate data with proper structure and unique ID
        candidate_data = {
            "id": candidate_id,  # Unique ID for this candidate in this process
            "application_source": "resume_bank",
            "resume_bank_entry_id": resume_object_id,
            "current_stage_id": initial_stage_id,
            "status": CandidateStageStatus.PENDING,
            "notes": notes,
            "stage_history": [{
                "from_stage_id": None,
                "from_stage_name": None,
                "to_stage_id": initial_stage_id,
                "to_stage_name": "Initial Assignment",
                "status": CandidateStageStatus.PENDING,
                "notes": notes,
                "moved_at": datetime.utcnow(),
                "moved_by": user_id
            }],
            "assigned_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            # Include candidate information directly
            "candidate_name": resume_entry.candidate_name,
            "candidate_email": resume_entry.candidate_email,
            "candidate_phone": resume_entry.candidate_phone,
            "candidate_location": resume_entry.candidate_location
        }
        
        # Add candidate to process
        result = await self.hiring_processes.update_one(
            {"_id": process_object_id, "user_id": user_object_id},
            {
                "$push": {"candidates": candidate_data},
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        if result.modified_count > 0:
            logger.info(f"Successfully added candidate {resume_entry.candidate_name} (ID: {candidate_id}) to process {process_id}")
            return await self.get_hiring_process_by_id(process_id, user_id)
        else:
            logger.error(f"Failed to add candidate to process: {process_id}")
            return None
    
    async def move_candidate_stage(
        self,
        process_id: str,
        user_id: str,
        candidate_id: str,
        new_stage_id: str,
        new_status: CandidateStageStatus,
        notes: Optional[str] = None
    ) -> Optional[HiringProcessDocument]:
        """Move a candidate to a different stage."""
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
        except Exception:
            return None
        
        # Get current process to find stage names
        process = await self.get_hiring_process_by_id(process_id, user_id)
        if not process:
            return None
        
        # Find current candidate and stage names
        current_candidate = None
        current_stage_name = None
        new_stage_name = None
        
        # Try to find candidate by resume_bank_entry_id or job_application_id
        for candidate in process.candidates:
            candidate_identifier = None
            if hasattr(candidate, 'resume_bank_entry_id') and candidate.resume_bank_entry_id:
                candidate_identifier = str(candidate.resume_bank_entry_id)
            elif hasattr(candidate, 'job_application_id') and candidate.job_application_id:
                candidate_identifier = str(candidate.job_application_id)
            elif isinstance(candidate, dict):
                if candidate.get('resume_bank_entry_id'):
                    candidate_identifier = str(candidate['resume_bank_entry_id'])
                elif candidate.get('job_application_id'):
                    candidate_identifier = str(candidate['job_application_id'])
            
            if candidate_identifier == candidate_id:
                current_candidate = candidate
                break
        
        if not current_candidate:
            return None
        
        # Find stage names
        for stage in process.stages:
            if stage.id == current_candidate.current_stage_id:
                current_stage_name = stage.name
            if stage.id == new_stage_id:
                new_stage_name = stage.name
        
        # Create history entry
        history_entry = {
            "from_stage_id": current_candidate.current_stage_id,
            "from_stage_name": current_stage_name,
            "to_stage_id": new_stage_id,
            "to_stage_name": new_stage_name,
            "status": new_status,
            "notes": notes,
            "moved_at": datetime.utcnow(),
            "moved_by": user_id
        }
        
        # Use arrayFilters for more precise targeting
        # This approach is more reliable than positional operator
        array_filters = []
        
        if hasattr(current_candidate, 'resume_bank_entry_id') and current_candidate.resume_bank_entry_id:
            array_filters.append({"candidate.resume_bank_entry_id": current_candidate.resume_bank_entry_id})
        elif hasattr(current_candidate, 'job_application_id') and current_candidate.job_application_id:
            array_filters.append({"candidate.job_application_id": current_candidate.job_application_id})
        elif isinstance(current_candidate, dict):
            if current_candidate.get('resume_bank_entry_id'):
                array_filters.append({"candidate.resume_bank_entry_id": current_candidate['resume_bank_entry_id']})
            elif current_candidate.get('job_application_id'):
                array_filters.append({"candidate.job_application_id": current_candidate['job_application_id']})
        
        if not array_filters:
            logger.error(f"No valid candidate identifier found for candidate_id: {candidate_id}")
            return None
        
        result = await self.hiring_processes.update_one(
            {
                "_id": process_object_id,
                "user_id": user_object_id
            },
            {
                "$set": {
                    "candidates.$[candidate].current_stage_id": new_stage_id,
                    "candidates.$[candidate].status": new_status,
                    "candidates.$[candidate].notes": notes,
                    "candidates.$[candidate].updated_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                },
                "$push": {
                    "candidates.$[candidate].stage_history": history_entry
                }
            },
            array_filters=array_filters
        )
        
        if result.modified_count > 0:
            return await self.get_hiring_process_by_id(process_id, user_id)
        return None
    
    async def remove_candidate_from_process(
        self,
        process_id: str,
        user_id: str,
        candidate_id: str
    ) -> bool:
        """Remove a candidate from a hiring process."""
        logger.info(f"Attempting to remove candidate {candidate_id} from process {process_id}")
        try:
            process_object_id = ObjectId(process_id)
            user_object_id = ObjectId(user_id)
        except Exception as e:
            logger.error(f"Invalid ObjectId format: {e}")
            return False
        
        # Try to remove candidate by unique ID first (new approach)
        result = await self.hiring_processes.update_one(
            {
                "_id": process_object_id,
                "user_id": user_object_id
            },
            {
                "$pull": {
                    "candidates": {"id": candidate_id}
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        # If no candidate was removed by ID, try legacy approach (resume_bank_entry_id)
        if result.modified_count == 0:
            try:
                candidate_object_id = ObjectId(candidate_id)
                result = await self.hiring_processes.update_one(
                    {
                        "_id": process_object_id,
                        "user_id": user_object_id
                    },
                    {
                        "$pull": {
                            "candidates": {"resume_bank_entry_id": candidate_object_id}
                        },
                        "$set": {"updated_at": datetime.utcnow()}
                    }
                )
                
                # If still no candidate was removed, try job_application_id
                if result.modified_count == 0:
                    result = await self.hiring_processes.update_one(
                        {
                            "_id": process_object_id,
                            "user_id": user_object_id
                        },
                        {
                            "$pull": {
                                "candidates": {"job_application_id": candidate_object_id}
                            },
                            "$set": {"updated_at": datetime.utcnow()}
                        }
                    )
            except Exception as e:
                logger.error(f"Error in legacy candidate removal: {e}")
                return False
        
        logger.info(f"Update result: modified_count={result.modified_count}, matched_count={result.matched_count}")
        return result.modified_count > 0
    
    async def get_hiring_process_stats_by_user(self, user_id: str) -> Dict[str, Any]:
        """Get hiring process statistics for a user."""
        try:
            user_object_id = ObjectId(user_id)
        except Exception:
            return {}
        
        pipeline = [
            {"$match": {"user_id": user_object_id}},
            {
                "$group": {
                    "_id": None,
                    "total_processes": {"$sum": 1},
                    "active_processes": {
                        "$sum": {"$cond": [{"$eq": ["$status", ProcessStatus.ACTIVE]}, 1, 0]}
                    },
                    "completed_processes": {
                        "$sum": {"$cond": [{"$eq": ["$status", ProcessStatus.COMPLETED]}, 1, 0]}
                    },
                    "paused_processes": {
                        "$sum": {"$cond": [{"$eq": ["$status", ProcessStatus.PAUSED]}, 1, 0]}
                    },
                    "coming_soon_processes": {
                        "$sum": {"$cond": [{"$eq": ["$status", ProcessStatus.COMING_SOON]}, 1, 0]}
                    },
                    "all_candidates": {"$push": "$candidates"}
                }
            },
            {
                "$project": {
                    "total_processes": 1,
                    "active_processes": 1,
                    "completed_processes": 1,
                    "paused_processes": 1,
                    "coming_soon_processes": 1,
                    "total_candidates": {"$size": {"$reduce": {
                        "input": "$all_candidates",
                        "initialValue": [],
                        "in": {"$concatArrays": ["$$value", "$$this"]}
                    }}},
                    "candidates_hired": {"$size": {"$filter": {
                        "input": {"$reduce": {
                            "input": "$all_candidates",
                            "initialValue": [],
                            "in": {"$concatArrays": ["$$value", "$$this"]}
                        }},
                        "cond": {"$in": ["$$this.status", ["hired", "accepted"]]}
                    }}},
                    "candidates_rejected": {"$size": {"$filter": {
                        "input": {"$reduce": {
                            "input": "$all_candidates",
                            "initialValue": [],
                            "in": {"$concatArrays": ["$$value", "$$this"]}
                        }},
                        "cond": {"$eq": ["$$this.status", CandidateStageStatus.REJECTED]}
                    }}}
                }
            }
        ]
        
        result = await self.hiring_processes.aggregate(pipeline).to_list(1)
        
        if result:
            return result[0]
        else:
            return {
                "total_processes": 0,
                "active_processes": 0,
                "completed_processes": 0,
                "paused_processes": 0,
                "coming_soon_processes": 0,
                "total_candidates": 0,
                "candidates_hired": 0,
                "candidates_rejected": 0
            } 