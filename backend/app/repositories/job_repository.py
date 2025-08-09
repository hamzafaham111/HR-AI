"""
Job repository for database operations.
"""

from sqlalchemy.orm import Session
from app.models.database_models import JobPosting
from app.models.job import JobPostingCreate
from typing import List, Optional
import json


class JobRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, job_data: JobPostingCreate) -> JobPosting:
        """Create a new job posting."""
        # Convert Pydantic objects to dictionaries for JSON serialization
        requirements_dict = [req.dict() for req in job_data.requirements]
        
        db_job = JobPosting(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            job_type=job_data.job_type,
            experience_level=job_data.experience_level,
            description=job_data.description,
            salary_range=job_data.salary_range,
            requirements=requirements_dict,
            responsibilities=job_data.responsibilities,
            benefits=job_data.benefits,
            status="active"
        )
        
        self.db.add(db_job)
        self.db.commit()
        self.db.refresh(db_job)
        return db_job

    def get_by_id(self, job_id: str) -> Optional[JobPosting]:
        """Get a job posting by ID."""
        return self.db.query(JobPosting).filter(JobPosting.id == job_id).first()

    def get_all(self) -> List[JobPosting]:
        """Get all job postings."""
        return self.db.query(JobPosting).filter(JobPosting.status == "active").all()

    def update(self, job_id: str, job_data: dict) -> Optional[JobPosting]:
        """Update a job posting."""
        job = self.get_by_id(job_id)
        if not job:
            return None
        
        for field, value in job_data.items():
            if hasattr(job, field):
                setattr(job, field, value)
        
        self.db.commit()
        self.db.refresh(job)
        return job

    def delete(self, job_id: str) -> bool:
        """Delete a job posting."""
        job = self.get_by_id(job_id)
        if not job:
            return False
        
        self.db.delete(job)
        self.db.commit()
        return True

    def get_by_company(self, company: str) -> List[JobPosting]:
        """Get job postings by company."""
        return self.db.query(JobPosting).filter(
            JobPosting.company == company,
            JobPosting.status == "active"
        ).all()

    def get_by_location(self, location: str) -> List[JobPosting]:
        """Get job postings by location."""
        return self.db.query(JobPosting).filter(
            JobPosting.location == location,
            JobPosting.status == "active"
        ).all()

    def get_by_experience_level(self, experience_level: str) -> List[JobPosting]:
        """Get job postings by experience level."""
        return self.db.query(JobPosting).filter(
            JobPosting.experience_level == experience_level,
            JobPosting.status == "active"
        ).all() 