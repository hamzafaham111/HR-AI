"""
Dashboard API routes for viewing analysis history and statistics.

This module contains FastAPI routes for:
- Dashboard overview
- Analysis history
- Statistics and metrics
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from datetime import datetime, timedelta
from bson import ObjectId

# Resume analysis models removed - using simplified response models
from pydantic import BaseModel

class DashboardResponse(BaseModel):
    total_resumes: int
    total_jobs: int
    statistics: Dict[str, Any]


from app.core.logger import logger
from app.core.database import get_database
from app.repositories.mongodb_repository import MongoDBRepository
from app.models.mongodb_models import COLLECTIONS
from app.api.auth import get_current_user
from app.models.mongodb_models import UserDocument

router = APIRouter()


@router.get("/overview", response_model=DashboardResponse)
async def get_dashboard_overview(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get dashboard overview with statistics and recent analyses.
    
    Returns:
        DashboardResponse with overview data
    """
    try:
        repo = MongoDBRepository(database)
        
        # Get total number of resume bank entries for this user
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": current_user.id})
        
        # Get total number of job postings for this user
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": current_user.id})
        
        # Calculate statistics
        stats = await calculate_dashboard_statistics(database, current_user.id)
        
        return DashboardResponse(
            total_resumes=total_resumes,
            total_jobs=total_jobs,
            statistics=stats
        )
        
    except Exception as e:
        logger.error(f"Failed to get dashboard overview: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get dashboard overview"
        )


# Analyses endpoint removed - will be replaced with other stats


@router.get("/statistics")
async def get_statistics(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get detailed statistics about analyses.
    
    Returns:
        Detailed statistics and metrics
    """
    try:
        stats = await calculate_dashboard_statistics(database, current_user.id)
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get statistics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get statistics"
        )


# Search endpoint removed - will be replaced with other functionality


async def calculate_dashboard_statistics(database, user_id: ObjectId) -> Dict[str, Any]:
    """
    Calculate comprehensive dashboard statistics.
    
    Returns:
        Dictionary containing various statistics
    """
    try:
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": user_id})
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": user_id})
        
        if total_resumes == 0 and total_jobs == 0:
            return {
                "resume_stats": {
                    "total": 0,
                    "active": 0,
                    "recent_uploads": 0
                },
                "job_stats": {
                    "total": 0,
                    "active": 0,
                    "recent_postings": 0
                },
                "skills_distribution": {},
                "recent_activity": {}
            }
        
        # Resume statistics
        active_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": user_id, "status": "active"})
        week_ago = datetime.now() - timedelta(days=7)
        recent_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Job statistics
        active_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": user_id, "status": "active"})
        recent_jobs = await database[COLLECTIONS["job_postings"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Skills distribution from resumes
        skills_counts = {}
        cursor = database[COLLECTIONS["resume_bank_entries"]].find({"user_id": user_id})
        async for resume_data in cursor:
            if resume_data.get("skills"):
                for skill in resume_data["skills"]:
                    if isinstance(skill, str):
                        skills_counts[skill] = skills_counts.get(skill, 0) + 1
        
        # Recent activity
        day_ago = datetime.now() - timedelta(days=1)
        recent_24h_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": day_ago}
        })
        recent_24h_jobs = await database[COLLECTIONS["job_postings"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": day_ago}
        })
        
        recent_activity = {
            "resumes_last_7_days": recent_resumes,
            "resumes_last_24_hours": recent_24h_resumes,
            "jobs_last_7_days": recent_jobs,
            "jobs_last_24_hours": recent_24h_jobs
        }
        
        # Get Qdrant statistics
        qdrant_stats = {}
        try:
            qdrant_stats = await qdrant_service.get_collection_stats()
        except Exception as e:
            logger.warning(f"Failed to get Qdrant stats: {e}")
        
        return {
            "resume_stats": {
                "total": total_resumes,
                "active": active_resumes,
                "recent_uploads": recent_resumes
            },
            "job_stats": {
                "total": total_jobs,
                "active": active_jobs,
                "recent_postings": recent_jobs
            },
            "skills_distribution": skills_counts,
            "recent_activity": recent_activity,
            "qdrant_stats": qdrant_stats
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate statistics: {e}")
        raise 