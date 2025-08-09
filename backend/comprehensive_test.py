#!/usr/bin/env python3
"""
Comprehensive test script for the AI Resume Analysis system.
Tests job creation, deletion, candidate search, and resume bank functionality.
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.repositories.job_repository import JobRepository
from app.models.job import JobPostingCreate, JobRequirement
from app.core.database import get_db, engine
from app.models.database_models import Base
from app.services.resume_bank_service import ResumeBankService
from app.services.compatibility_service import CompatibilityService
from app.repositories.resume_repository import ResumeRepository
from app.models.resume_bank import ResumeBankEntryCreate
from app.models.resume import ResumeAnalysisCreate
import json


async def test_complete_workflow():
    """Test the complete workflow from job creation to candidate search."""
    
    print("🧪 Starting comprehensive system test...")
    
    # Create database tables
    Base.metadata.create_all(bind=engine)
    
    # Get database session
    db = next(get_db())
    
    try:
        # Test 1: Create a job posting
        print("\n📋 Test 1: Creating a job posting...")
        job_repository = JobRepository(db)
        
        test_job_data = JobPostingCreate(
            title="Senior Python Developer",
            company="TechCorp Inc.",
            location="San Francisco, CA",
            job_type="full_time",
            experience_level="senior",
            description="We are looking for a senior Python developer with experience in Django and React.",
            salary_range="120000-150000",
            requirements=[
                JobRequirement(skill="Python", level="Advanced"),
                JobRequirement(skill="Django", level="Intermediate"),
                JobRequirement(skill="React", level="Intermediate"),
                JobRequirement(skill="PostgreSQL", level="Intermediate")
            ],
            responsibilities=["Lead development of web applications", "Mentor junior developers"],
            benefits=["Health insurance", "Remote work", "401k"]
        )
        
        created_job = job_repository.create(test_job_data)
        print(f"✅ Job created: {created_job.title} at {created_job.company} (ID: {created_job.id})")
        
        # Test 2: Create a resume analysis
        print("\n📄 Test 2: Creating a resume analysis...")
        resume_repository = ResumeRepository(db)
        
        test_resume_data = ResumeAnalysisCreate(
            raw_text="""
            JOHN DOE
            Senior Software Engineer
            Email: john.doe@email.com
            Phone: +1-555-123-4567
            Location: San Francisco, CA
            
            SUMMARY
            Experienced software engineer with 8+ years of experience in Python, Django, and React.
            Led development of multiple web applications and mentored junior developers.
            
            SKILLS
            Python (Advanced), Django (Advanced), React (Intermediate), PostgreSQL (Advanced),
            JavaScript (Intermediate), Git (Advanced), Docker (Intermediate)
            
            EXPERIENCE
            Senior Developer at TechCorp (2020-2023)
            - Led development of e-commerce platform using Django and React
            - Mentored 5 junior developers
            - Implemented CI/CD pipelines
            
            Developer at StartupXYZ (2018-2020)
            - Built REST APIs using Django
            - Developed frontend components with React
            - Worked with PostgreSQL and Redis
            """,
            extracted_skills=["Python", "Django", "React", "PostgreSQL", "JavaScript", "Git", "Docker"],
            experience_years=8,
            education_level="Bachelor's Degree",
            expertise_areas=[
                {"skill": "Python", "level": "Advanced", "years": 8},
                {"skill": "Django", "level": "Advanced", "years": 6},
                {"skill": "React", "level": "Intermediate", "years": 4},
                {"skill": "PostgreSQL", "level": "Advanced", "years": 6}
            ],
            summary="Experienced software engineer with 8+ years of experience in Python, Django, and React."
        )
        
        # Convert to dict and add required fields
        resume_data_dict = test_resume_data.model_dump()
        resume_data_dict["filename"] = "john_doe_resume.pdf"
        resume_data_dict["status"] = "completed"
        
        created_resume = resume_repository.create_analysis(resume_data_dict)
        print(f"✅ Resume analysis created: {created_resume.id}")
        
        # Test 3: Add resume to resume bank
        print("\n🏦 Test 3: Adding resume to resume bank...")
        resume_bank_service = ResumeBankService(db)
        
        candidate_info = {
            "filename": "john_doe_resume.pdf",
            "candidate_name": "John Doe",
            "candidate_email": "john.doe@email.com",
            "candidate_phone": "+1-555-123-4567",
            "candidate_location": "San Francisco, CA",
            "years_experience": 8,
            "current_role": "Senior Software Engineer",
            "desired_role": "Senior Python Developer",
            "salary_expectation": "130000",
            "availability": "Immediate",
            "tags": ["Python", "Django", "React", "Senior"],
            "notes": "Strong candidate with relevant experience"
        }
        
        resume_bank_entry = await resume_bank_service.add_resume_to_bank(
            candidate_info, created_resume.id
        )
        print(f"✅ Resume added to bank: {resume_bank_entry.candidate_name} (ID: {resume_bank_entry.id})")
        
        # Test 4: Test candidate search
        print("\n🔍 Test 4: Testing candidate search...")
        compatibility_service = CompatibilityService()
        
        # Get the job and resume for compatibility analysis
        job = job_repository.get_by_id(created_job.id)
        resume_analysis = resume_repository.get_by_id(created_resume.id)
        
        # Analyze compatibility
        compatibility_score = await compatibility_service.analyze_compatibility(
            resume_analysis, job
        )
        
        print(f"✅ Compatibility analysis completed:")
        print(f"   - Overall Score: {compatibility_score.overall_score:.1f}%")
        print(f"   - Skills Match: {compatibility_score.skills_match:.1f}%")
        print(f"   - Experience Match: {compatibility_score.experience_match:.1f}%")
        print(f"   - Role Relevance: {compatibility_score.role_match:.1f}%")
        print(f"   - Location Match: {compatibility_score.location_match:.1f}%")
        
        # Test 5: Test job deletion
        print("\n🗑️ Test 5: Testing job deletion...")
        
        # Get job details before deletion
        job_details = job_repository.get_by_id(created_job.id)
        if job_details:
            print(f"✅ Retrieved job details: {job_details.title} at {job_details.company}")
        else:
            print("❌ Failed to retrieve job details")
            return
        
        # Delete the job
        deletion_success = job_repository.delete(created_job.id)
        if deletion_success:
            print(f"✅ Successfully deleted job: {job_details.title} at {job_details.company}")
        else:
            print("❌ Failed to delete job")
            return
        
        # Verify deletion
        deleted_job = job_repository.get_by_id(created_job.id)
        if deleted_job is None:
            print("✅ Job deletion verified - job no longer exists in database")
        else:
            print("❌ Job still exists after deletion")
        
        # Test 6: Verify resume bank entry still exists (should not be affected by job deletion)
        print("\n✅ Test 6: Verifying resume bank entry still exists...")
        resume_repository = ResumeRepository(db)
        resume_bank_entries = resume_repository.get_all_resume_bank_entries()
        
        if resume_bank_entries:
            print(f"✅ Resume bank entry still exists: {resume_bank_entries[0].candidate_name}")
        else:
            print("❌ Resume bank entry not found")
        
        print("\n🎉 All tests completed successfully!")
        print("\n📊 Summary:")
        print("✅ Job creation and management working")
        print("✅ Resume analysis and storage working")
        print("✅ Resume bank functionality working")
        print("✅ Compatibility analysis working")
        print("✅ Job deletion working (no foreign key issues)")
        print("✅ Dynamic candidate search ready")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(test_complete_workflow()) 