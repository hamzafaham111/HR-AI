"""
Utility functions for converting between SQLAlchemy and Pydantic models.
"""

from typing import List, Optional
from app.models.database_models import ResumeBankEntry as DBResumeBankEntry, ResumeAnalysis as DBResumeAnalysis
from app.models.resume_bank import ResumeBankEntry, ResumeStatus, ResumeSource
from app.models.resume import ResumeAnalysis, Expertise, StrongZone


def convert_db_resume_bank_entry_to_pydantic(db_entry: DBResumeBankEntry) -> ResumeBankEntry:
    """
    Convert a database ResumeBankEntry to a Pydantic ResumeBankEntry.
    
    Args:
        db_entry: Database model instance
        
    Returns:
        ResumeBankEntry: Pydantic model instance
    """
    # Convert resume analysis if it exists
    resume_analysis = None
    if db_entry.resume_analysis:
        resume_analysis = convert_db_resume_analysis_to_pydantic(db_entry.resume_analysis)
    
    return ResumeBankEntry(
        id=db_entry.id,
        filename=db_entry.filename,
        candidate_name=db_entry.candidate_name or "",
        candidate_email=db_entry.candidate_email or "",
        candidate_phone=db_entry.candidate_phone,
        candidate_location=db_entry.candidate_location,
        years_experience=db_entry.years_experience,
        current_role=db_entry.current_role,
        desired_role=db_entry.desired_role,
        salary_expectation=db_entry.salary_expectation,
        availability=db_entry.availability,
        status=ResumeStatus(db_entry.status) if db_entry.status else ResumeStatus.ACTIVE,
        source=ResumeSource.DIRECT_UPLOAD,  # Default source
        tags=db_entry.tags or [],
        notes=db_entry.notes,
        resume_analysis=resume_analysis,
        created_date=db_entry.created_at,
        updated_date=db_entry.updated_at,
        last_contact_date=db_entry.last_contact_date
    )


def convert_db_resume_analysis_to_pydantic(db_analysis: DBResumeAnalysis) -> ResumeAnalysis:
    """
    Convert a database ResumeAnalysis to a Pydantic ResumeAnalysis.
    
    Args:
        db_analysis: Database model instance
        
    Returns:
        ResumeAnalysis: Pydantic model instance
    """
    # Convert expertise areas
    expertise_areas = []
    if db_analysis.expertise_areas:
        for exp in db_analysis.expertise_areas:
            if isinstance(exp, dict):
                expertise_areas.append(Expertise(
                    name=exp.get("name", ""),
                    level=exp.get("level", "Intermediate"),
                    description=exp.get("description", ""),
                    confidence=exp.get("confidence", 0.5)
                ))
    
    # Convert strong zones
    strong_zones = []
    if db_analysis.strong_zones:
        for zone in db_analysis.strong_zones:
            if isinstance(zone, dict):
                strong_zones.append(StrongZone(
                    name=zone.get("name", ""),
                    description=zone.get("description", ""),
                    evidence=zone.get("evidence", ""),
                    impact=zone.get("impact", "Medium")
                ))
    
    return ResumeAnalysis(
        summary=db_analysis.summary or "",
        expertise_areas=expertise_areas,
        strong_zones=strong_zones,
        overall_assessment=db_analysis.overall_assessment or "No assessment available",
        raw_text=db_analysis.raw_text or ""
    )


def convert_db_resume_bank_entries_to_pydantic(db_entries: List[DBResumeBankEntry]) -> List[ResumeBankEntry]:
    """
    Convert a list of database ResumeBankEntry to Pydantic models.
    
    Args:
        db_entries: List of database model instances
        
    Returns:
        List[ResumeBankEntry]: List of Pydantic model instances
    """
    return [convert_db_resume_bank_entry_to_pydantic(entry) for entry in db_entries] 