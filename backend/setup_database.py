#!/usr/bin/env python3
"""
Database setup script for the AI Resume Analysis System.

This script initializes the database, creates tables, and optionally
adds sample data for development and testing.
"""

import sys
import os
import uuid

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.init_db import init_db, drop_db
from app.core.database import SessionLocal
from app.repositories.job_repository import JobRepository
from app.repositories.resume_repository import ResumeRepository
from app.models.job import JobPostingCreate
from app.models.resume_bank import ResumeBankEntryCreate
from app.core.logger import logger


def create_sample_data():
    """Create sample data for development."""
    db = SessionLocal()
    try:
        # Create sample job
        job_repo = JobRepository(db)
        sample_job = JobPostingCreate(
            title="Senior Software Engineer",
            company="TechCorp Inc.",
            location="San Francisco, CA",
            job_type="full_time",
            experience_level="senior",
            description="We are looking for a Senior Software Engineer to join our team...",
            salary_range="$120,000 - $180,000",
            requirements=[
                {"skill": "Python", "level": "advanced", "is_required": True, "weight": 1.0},
                {"skill": "React", "level": "intermediate", "is_required": True, "weight": 0.8},
                {"skill": "PostgreSQL", "level": "intermediate", "is_required": False, "weight": 0.6}
            ],
            responsibilities=[
                "Lead development of new features",
                "Mentor junior developers",
                "Collaborate with cross-functional teams"
            ],
            benefits=[
                "Competitive salary",
                "Health insurance",
                "Remote work options"
            ]
        )
        
        job = job_repo.create(sample_job)
        logger.info(f"Created sample job: {job.title}")
        
        # Create sample resume bank entry
        resume_repo = ResumeRepository(db)
        # Create a dummy resume analysis first
        dummy_analysis = {
            "id": str(uuid.uuid4()),
            "filename": "john_doe_resume.pdf",
            "raw_text": "Sample resume text...",
            "summary": "Experienced software engineer with 5+ years in web development",
            "expertise_areas": [],
            "strong_zones": [],
            "overall_assessment": "Strong candidate with good technical skills",
            "status": "completed"
        }
        
        # Create resume analysis in database
        from app.models.database_models import ResumeAnalysis
        db_analysis = ResumeAnalysis(**dummy_analysis)
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        
        sample_resume = ResumeBankEntryCreate(
            candidate_name="John Doe",
            candidate_email="john.doe@example.com",
            candidate_phone="+1 (555) 123-4567",
            candidate_location="San Francisco, CA",
            years_experience=5,
            current_role="Software Engineer",
            desired_role="Senior Software Engineer",
            salary_expectation="$130,000 - $160,000",
            availability="2_weeks",
            tags=["python", "react", "javascript", "node.js", "postgresql"],
            notes="Strong backend developer with frontend experience",
            status="active",
            filename="john_doe_resume.pdf",
            resume_analysis_id=db_analysis.id
        )
        
        resume = resume_repo.create_resume_bank_entry(sample_resume)
        logger.info(f"Created sample resume: {resume.candidate_name}")
        
    except Exception as e:
        logger.error(f"Error creating sample data: {e}")
        raise
    finally:
        db.close()


def main():
    """Main setup function."""
    print("🚀 Setting up AI Resume Analysis Database...")
    
    # Check if user wants to drop existing tables
    if len(sys.argv) > 1 and sys.argv[1] == "--drop":
        print("⚠️  Dropping existing tables...")
        drop_db()
        print("✅ Tables dropped successfully")
    
    # Initialize database
    print("📊 Creating database tables...")
    init_db()
    print("✅ Database tables created successfully")
    
    # Ask if user wants sample data
    if len(sys.argv) > 1 and sys.argv[1] == "--sample":
        print("📝 Creating sample data...")
        create_sample_data()
        print("✅ Sample data created successfully")
    else:
        response = input("Would you like to create sample data? (y/n): ")
        if response.lower() in ['y', 'yes']:
            print("📝 Creating sample data...")
            create_sample_data()
            print("✅ Sample data created successfully")
    
    print("🎉 Database setup completed successfully!")
    print("\nNext steps:")
    print("1. Start the backend server: python main.py")
    print("2. Start the frontend: npm start (in frontend directory)")
    print("3. Visit http://localhost:3000 to use the application")


if __name__ == "__main__":
    main() 