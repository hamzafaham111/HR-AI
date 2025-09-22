"""
Enhanced Dashboard API routes for comprehensive HR system overview.

This module contains FastAPI routes for:
- Dashboard overview with complete system metrics
- Hiring process analytics
- AI analysis insights
- Performance metrics
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from pydantic import BaseModel, Field

class DashboardResponse(BaseModel):
    total_resumes: int = Field(..., description="Total resumes in bank")
    total_jobs: int = Field(..., description="Total job postings")
    total_hiring_processes: int = Field(..., description="Total hiring processes")
    total_meetings: int = Field(..., description="Total meetings scheduled")
    total_applications: int = Field(..., description="Total job applications")
    statistics: Dict[str, Any] = Field(..., description="Detailed statistics")
    recent_activity: List[Dict[str, Any]] = Field(..., description="Recent system activity")
    ai_insights: Dict[str, Any] = Field(..., description="AI-generated insights")


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
    Get fast dashboard overview with essential metrics only.
    
    Returns:
        DashboardResponse with basic overview data
    """
    try:
        # Get basic counts only (fast queries)
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": current_user.id})
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": current_user.id})
        total_hiring_processes = await database[COLLECTIONS["hiring_processes"]].count_documents({"user_id": current_user.id})
        total_applications = await database[COLLECTIONS["job_applications"]].count_documents({"user_id": current_user.id})
        total_meetings = await database[COLLECTIONS["meetings"]].count_documents({"user_id": current_user.id})
        
        # Simple statistics (minimal queries)
        week_ago = datetime.now() - timedelta(days=7)
        
        # Get recent counts
        recent_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": week_ago}
        })
        
        recent_jobs = await database[COLLECTIONS["job_postings"]].count_documents({
            "user_id": current_user.id,
            "created_at": {"$gte": week_ago}
        })
        
        # Simple statistics object
        stats = {
            "resume_stats": {
                "total": total_resumes,
                "recent": recent_resumes
            },
            "job_stats": {
                "total": total_jobs,
                "recent": recent_jobs
            },
            "hiring_process_stats": {
                "total": total_hiring_processes
            },
            "meeting_stats": {
                "total": total_meetings
            },
            "application_stats": {
                "total": total_applications
            }
        }
        
        # Simple recent activity (limit to 5 items)
        recent_activity = []
        
        # Get 3 most recent resumes
        cursor = database[COLLECTIONS["resume_bank_entries"]].find({"user_id": current_user.id}).sort("created_at", -1).limit(3)
        async for resume in cursor:
            recent_activity.append({
                "type": "resume_upload",
                "title": f"Resume: {resume.get('candidate_name', 'Unknown')}",
                "timestamp": resume.get("created_at")
            })
        
        # Get 2 most recent jobs
        cursor = database[COLLECTIONS["job_postings"]].find({"user_id": current_user.id}).sort("created_at", -1).limit(2)
        async for job in cursor:
            recent_activity.append({
                "type": "job_posting",
                "title": f"Job: {job.get('title', 'Unknown')}",
                "timestamp": job.get("created_at")
            })
        
        # Simple AI insights
        ai_insights = {
            "summary": f"Your HR system has {total_resumes} resumes and {total_jobs} jobs",
            "recommendations": []
        }
        
        if total_resumes < 5:
            ai_insights["recommendations"].append("Add more resumes to your talent pool")
        
        if total_jobs < 2:
            ai_insights["recommendations"].append("Create more job postings")
        
        return DashboardResponse(
            total_resumes=total_resumes,
            total_jobs=total_jobs,
            total_hiring_processes=total_hiring_processes,
            total_meetings=total_meetings,
            total_applications=total_applications,
            statistics=stats,
            recent_activity=recent_activity,
            ai_insights=ai_insights
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
    Get detailed statistics about all system components.
    
    Returns:
        Detailed statistics and metrics for resumes, jobs, hiring processes, meetings, and applications
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


@router.get("/analytics")
async def get_analytics(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get comprehensive analytics and insights (detailed version).
    
    Returns:
        Detailed analytics data including trends, patterns, and insights
    """
    try:
        # Get comprehensive statistics
        stats = await calculate_dashboard_statistics(database, current_user.id)
        
        # Get detailed recent activity
        recent_activity = await get_recent_activity(database, current_user.id)
        
        # Generate detailed AI insights
        ai_insights = await generate_ai_insights(database, current_user.id)
        
        return {
            "statistics": stats,
            "recent_activity": recent_activity,
            "ai_insights": ai_insights,
            "generated_at": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get analytics: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get analytics"
        )


@router.get("/quick-stats")
async def get_quick_stats(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get very fast basic stats only.
    
    Returns:
        Minimal statistics for quick loading
    """
    try:
        # Only essential counts
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": current_user.id})
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": current_user.id})
        total_hiring_processes = await database[COLLECTIONS["hiring_processes"]].count_documents({"user_id": current_user.id})
        
        return {
            "total_resumes": total_resumes,
            "total_jobs": total_jobs,
            "total_hiring_processes": total_hiring_processes,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get quick stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get quick stats"
        )


# Search endpoint removed - will be replaced with other functionality


async def calculate_dashboard_statistics(database, user_id: ObjectId) -> Dict[str, Any]:
    """
    Calculate comprehensive dashboard statistics for all system components.
    
    Returns:
        Dictionary containing detailed statistics for resumes, jobs, hiring processes, meetings, and applications
    """
    try:
        week_ago = datetime.now() - timedelta(days=7)
        day_ago = datetime.now() - timedelta(days=1)
        
        # Resume Statistics
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": user_id})
        active_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": user_id, "status": "active"})
        recent_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Job Statistics
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": user_id})
        active_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": user_id, "status": "active"})
        recent_jobs = await database[COLLECTIONS["job_postings"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Hiring Process Statistics
        total_hiring_processes = await database[COLLECTIONS["hiring_processes"]].count_documents({"user_id": user_id})
        active_hiring_processes = await database[COLLECTIONS["hiring_processes"]].count_documents({"user_id": user_id, "status": "active"})
        recent_hiring_processes = await database[COLLECTIONS["hiring_processes"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Meeting Statistics (handle missing collection gracefully)
        try:
            total_meetings = await database["meetings"].count_documents({"user_id": user_id})
            upcoming_meetings = await database["meetings"].count_documents({
                "user_id": user_id,
                "scheduled_date": {"$gte": datetime.now()}
            })
            recent_meetings = await database["meetings"].count_documents({
                "user_id": user_id,
                "created_at": {"$gte": week_ago}
            })
        except:
            total_meetings = 0
            upcoming_meetings = 0
            recent_meetings = 0
        
        # Job Application Statistics
        total_applications = await database[COLLECTIONS["job_applications"]].count_documents({"user_id": user_id})
        pending_applications = await database[COLLECTIONS["job_applications"]].count_documents({"user_id": user_id, "status": "pending"})
        recent_applications = await database[COLLECTIONS["job_applications"]].count_documents({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        })
        
        # Skills Distribution Analysis
        skills_counts = {}
        experience_distribution = {"0-2": 0, "3-5": 0, "6-10": 0, "10+": 0}
        location_distribution = {}
        
        cursor = database[COLLECTIONS["resume_bank_entries"]].find({"user_id": user_id})
        async for resume_data in cursor:
            # Skills analysis
            if resume_data.get("skills"):
                for skill in resume_data["skills"]:
                    if isinstance(skill, str):
                        skills_counts[skill] = skills_counts.get(skill, 0) + 1
            
            # Experience distribution
            years_exp = resume_data.get("years_experience")
            if years_exp:
                if years_exp <= 2:
                    experience_distribution["0-2"] += 1
                elif years_exp <= 5:
                    experience_distribution["3-5"] += 1
                elif years_exp <= 10:
                    experience_distribution["6-10"] += 1
                else:
                    experience_distribution["10+"] += 1
            
            # Location distribution
            location = resume_data.get("candidate_location")
            if location:
                location_distribution[location] = location_distribution.get(location, 0) + 1
        
        # Top skills (limit to top 10)
        top_skills = sorted(skills_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "resume_stats": {
                "total": total_resumes,
                "active": active_resumes,
                "recent_uploads": recent_resumes,
                "archived": total_resumes - active_resumes
            },
            "job_stats": {
                "total": total_jobs,
                "active": active_jobs,
                "recent_postings": recent_jobs,
                "closed": total_jobs - active_jobs
            },
            "hiring_process_stats": {
                "total": total_hiring_processes,
                "active": active_hiring_processes,
                "recent": recent_hiring_processes,
                "completed": total_hiring_processes - active_hiring_processes
            },
            "meeting_stats": {
                "total": total_meetings,
                "upcoming": upcoming_meetings,
                "recent": recent_meetings,
                "completed": total_meetings - upcoming_meetings
            },
            "application_stats": {
                "total": total_applications,
                "pending": pending_applications,
                "recent": recent_applications,
                "processed": total_applications - pending_applications
            },
            "analytics": {
                "skills_distribution": dict(top_skills),
                "experience_distribution": experience_distribution,
                "location_distribution": location_distribution,
                "top_locations": sorted(location_distribution.items(), key=lambda x: x[1], reverse=True)[:5]
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to calculate statistics: {e}")
        raise


async def get_recent_activity(database, user_id: ObjectId) -> List[Dict[str, Any]]:
    """
    Get recent activity across all system components.
    
    Returns:
        List of recent activities with timestamps and details
    """
    try:
        recent_activity = []
        week_ago = datetime.now() - timedelta(days=7)
        
        # Recent resume uploads
        cursor = database[COLLECTIONS["resume_bank_entries"]].find({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        }).sort("created_at", -1).limit(5)
        
        async for resume in cursor:
            recent_activity.append({
                "type": "resume_upload",
                "title": f"Resume uploaded: {resume.get('candidate_name', 'Unknown')}",
                "description": f"Added to resume bank",
                "timestamp": resume.get("created_at"),
                "data": {
                    "candidate_name": resume.get("candidate_name"),
                    "current_role": resume.get("current_role"),
                    "years_experience": resume.get("years_experience")
                }
            })
        
        # Recent job postings
        cursor = database[COLLECTIONS["job_postings"]].find({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        }).sort("created_at", -1).limit(5)
        
        async for job in cursor:
            recent_activity.append({
                "type": "job_posting",
                "title": f"Job posted: {job.get('title', 'Unknown')}",
                "description": f"New job opportunity created",
                "timestamp": job.get("created_at"),
                "data": {
                    "job_title": job.get("title"),
                    "location": job.get("location"),
                    "job_type": job.get("job_type")
                }
            })
        
        # Recent hiring processes
        cursor = database[COLLECTIONS["hiring_processes"]].find({
            "user_id": user_id,
            "created_at": {"$gte": week_ago}
        }).sort("created_at", -1).limit(5)
        
        async for process in cursor:
            recent_activity.append({
                "type": "hiring_process",
                "title": f"Hiring process: {process.get('title', 'Unknown')}",
                "description": f"New hiring process initiated",
                "timestamp": process.get("created_at"),
                "data": {
                    "process_title": process.get("title"),
                    "status": process.get("status"),
                    "candidate_count": len(process.get("candidates", []))
                }
            })
        
        # Recent meetings (handle missing collection gracefully)
        try:
            cursor = database["meetings"].find({
                "user_id": user_id,
                "created_at": {"$gte": week_ago}
            }).sort("created_at", -1).limit(5)
            
            async for meeting in cursor:
                recent_activity.append({
                    "type": "meeting",
                    "title": f"Meeting scheduled: {meeting.get('title', 'Unknown')}",
                    "description": f"New meeting scheduled",
                    "timestamp": meeting.get("created_at"),
                    "data": {
                        "meeting_title": meeting.get("title"),
                        "scheduled_date": meeting.get("scheduled_date"),
                        "meeting_type": meeting.get("meeting_type")
                    }
                })
        except:
            pass  # Skip meetings if collection doesn't exist
        
        # Sort all activities by timestamp
        recent_activity.sort(key=lambda x: x["timestamp"], reverse=True)
        return recent_activity[:10]  # Return top 10 most recent
        
    except Exception as e:
        logger.error(f"Failed to get recent activity: {e}")
        return []


async def generate_ai_insights(database, user_id: ObjectId) -> Dict[str, Any]:
    """
    Generate AI-powered insights about the HR system data.
    
    Returns:
        Dictionary containing AI-generated insights and recommendations
    """
    try:
        insights = {
            "summary": "",
            "recommendations": [],
            "trends": {},
            "highlights": []
        }
        
        # Get basic counts for insights
        total_resumes = await database[COLLECTIONS["resume_bank_entries"]].count_documents({"user_id": user_id})
        total_jobs = await database[COLLECTIONS["job_postings"]].count_documents({"user_id": user_id})
        total_applications = await database[COLLECTIONS["job_applications"]].count_documents({"user_id": user_id})
        
        if total_resumes == 0 and total_jobs == 0:
            insights["summary"] = "Welcome to your HR system! Start by adding resumes and creating job postings to see insights."
            insights["recommendations"] = [
                "Upload your first resume to the resume bank",
                "Create your first job posting",
                "Set up a hiring process to manage candidates"
            ]
            return insights
        
        # Generate insights based on data
        if total_resumes > 0:
            insights["highlights"].append(f"You have {total_resumes} resumes in your talent pool")
            
            if total_resumes < 10:
                insights["recommendations"].append("Consider expanding your resume bank for better candidate matching")
        
        if total_jobs > 0:
            insights["highlights"].append(f"You have {total_jobs} active job postings")
            
            if total_jobs < 3:
                insights["recommendations"].append("Create more job postings to attract diverse candidates")
        
        if total_applications > 0:
            insights["highlights"].append(f"You've received {total_applications} job applications")
            
            # Check application processing
            pending_apps = await database[COLLECTIONS["job_applications"]].count_documents({
                "user_id": user_id, 
                "status": "pending"
            })
            
            if pending_apps > 0:
                insights["recommendations"].append(f"Review {pending_apps} pending applications")
        
        # Skills analysis
        skills_counts = {}
        cursor = database[COLLECTIONS["resume_bank_entries"]].find({"user_id": user_id})
        async for resume_data in cursor:
            if resume_data.get("skills"):
                for skill in resume_data["skills"]:
                    if isinstance(skill, str):
                        skills_counts[skill] = skills_counts.get(skill, 0) + 1
        
        if skills_counts:
            top_skill = max(skills_counts.items(), key=lambda x: x[1])
            insights["highlights"].append(f"Most common skill: {top_skill[0]} ({top_skill[1]} candidates)")
        
        # Generate summary
        if insights["highlights"]:
            insights["summary"] = f"Your HR system is active with {total_resumes} resumes and {total_jobs} jobs. " + \
                                " ".join(insights["highlights"][:2])
        
        return insights
        
    except Exception as e:
        logger.error(f"Failed to generate AI insights: {e}")
        return {
            "summary": "Unable to generate insights at this time",
            "recommendations": [],
            "trends": {},
            "highlights": []
        } 