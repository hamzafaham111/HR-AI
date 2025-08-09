"""
Resume repository for database operations.
"""

from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from app.models.database_models import ResumeAnalysis, ResumeBankEntry
from app.models.resume_bank import ResumeBankEntryCreate, ResumeBankEntryUpdate


class ResumeRepository:
    """Repository for resume operations."""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Resume Analysis operations
    def create_analysis(self, analysis_data: Dict[str, Any]) -> ResumeAnalysis:
        """Create a new resume analysis."""
        db_analysis = ResumeAnalysis(
            filename=analysis_data.get("filename", "unknown.pdf"),
            raw_text=analysis_data.get("raw_text"),
            extracted_skills=analysis_data.get("extracted_skills", []),
            experience_years=analysis_data.get("experience_years", 0),
            education_level=analysis_data.get("education_level", ""),
            expertise_areas=analysis_data.get("expertise_areas", []),
            strong_zones=analysis_data.get("strong_zones", []),
            summary=analysis_data.get("summary", ""),
            overall_assessment=analysis_data.get("overall_assessment", "No assessment available")
        )
        self.db.add(db_analysis)
        self.db.commit()
        self.db.refresh(db_analysis)
        return db_analysis
    
    def get_analysis_by_id(self, analysis_id: str) -> Optional[ResumeAnalysis]:
        """Get a resume analysis by ID."""
        return self.db.query(ResumeAnalysis).filter(ResumeAnalysis.id == analysis_id).first()
    
    def update_analysis_status(self, analysis_id: str, status: str) -> Optional[ResumeAnalysis]:
        """Update analysis status."""
        db_analysis = self.get_analysis_by_id(analysis_id)
        if not db_analysis:
            return None
        
        db_analysis.status = status
        self.db.commit()
        self.db.refresh(db_analysis)
        return db_analysis
    
    def update_analysis_results(self, analysis_id: str, results: Dict[str, Any]) -> Optional[ResumeAnalysis]:
        """Update analysis results."""
        db_analysis = self.get_analysis_by_id(analysis_id)
        if not db_analysis:
            return None
        
        for field, value in results.items():
            if hasattr(db_analysis, field):
                setattr(db_analysis, field, value)
        
        db_analysis.status = "completed"
        self.db.commit()
        self.db.refresh(db_analysis)
        return db_analysis
    
    # Resume Bank operations
    def create_resume_bank_entry(self, entry_data: ResumeBankEntryCreate) -> ResumeBankEntry:
        """Create a new resume bank entry."""
        from app.models.resume_bank import ResumeStatus
        
        db_entry = ResumeBankEntry(
            candidate_name=entry_data.candidate_name,
            candidate_email=entry_data.candidate_email,
            candidate_phone=entry_data.candidate_phone,
            candidate_location=entry_data.candidate_location,
            years_experience=entry_data.years_experience,
            current_role=entry_data.current_role,
            desired_role=entry_data.desired_role,
            salary_expectation=entry_data.salary_expectation,
            availability=entry_data.availability,
            tags=entry_data.tags,
            notes=entry_data.notes,
            status=ResumeStatus.ACTIVE,  # Default status
            filename=entry_data.filename,
            resume_analysis_id=entry_data.resume_analysis_id
        )
        self.db.add(db_entry)
        self.db.commit()
        self.db.refresh(db_entry)
        return db_entry
    
    def get_resume_bank_entry_by_id(self, entry_id: str) -> Optional[ResumeBankEntry]:
        """Get a resume bank entry by ID."""
        return self.db.query(ResumeBankEntry).filter(ResumeBankEntry.id == entry_id).first()
    
    def get_all_resume_bank_entries(self, skip: int = 0, limit: int = 100) -> List[ResumeBankEntry]:
        """Get all resume bank entries with pagination."""
        return self.db.query(ResumeBankEntry).offset(skip).limit(limit).all()
    
    def update_resume_bank_entry(self, entry_id: str, entry_data: ResumeBankEntryUpdate) -> Optional[ResumeBankEntry]:
        """Update a resume bank entry."""
        db_entry = self.get_resume_bank_entry_by_id(entry_id)
        if not db_entry:
            return None
        
        update_data = entry_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_entry, field, value)
        
        self.db.commit()
        self.db.refresh(db_entry)
        return db_entry
    
    def delete_resume_bank_entry(self, entry_id: str) -> bool:
        """Delete a resume bank entry."""
        db_entry = self.get_resume_bank_entry_by_id(entry_id)
        if not db_entry:
            return False
        
        self.db.delete(db_entry)
        self.db.commit()
        return True
    
    def search_resume_bank_entries(self, filters: Dict[str, Any]) -> List[ResumeBankEntry]:
        """Search resume bank entries with filters."""
        query = self.db.query(ResumeBankEntry)
        
        if filters.get("skills"):
            skills = filters["skills"]
            # Search in tags (assuming tags contain skills)
            for skill in skills:
                query = query.filter(ResumeBankEntry.tags.contains([skill]))
        
        if filters.get("location"):
            query = query.filter(ResumeBankEntry.candidate_location.ilike(f"%{filters['location']}%"))
        
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
                query = query.filter(
                    and_(
                        ResumeBankEntry.years_experience >= min_exp,
                        ResumeBankEntry.years_experience <= max_exp
                    )
                )
        
        if filters.get("status"):
            query = query.filter(ResumeBankEntry.status == filters["status"])
        
        return query.all()
    
    def get_resume_bank_stats(self) -> Dict[str, Any]:
        """Get resume bank statistics."""
        total_entries = self.db.query(func.count(ResumeBankEntry.id)).scalar()
        
        status_counts = self.db.query(
            ResumeBankEntry.status,
            func.count(ResumeBankEntry.id)
        ).group_by(ResumeBankEntry.status).all()
        
        return {
            "total_entries": total_entries,
            "status_breakdown": dict(status_counts)
        }
    
    # Note: Candidate matching is now handled dynamically by the CompatibilityService
    # No need to store matches permanently since we search the entire resume bank each time 