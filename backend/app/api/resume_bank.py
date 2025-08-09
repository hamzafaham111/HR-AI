"""
Resume Bank API Module

This module handles all resume-related operations for the AI Resume Management System.

WHAT THIS MODULE DOES:
======================
1. **File Upload**: Handle PDF resume uploads from users
2. **AI Processing**: Extract candidate information using OpenAI
3. **Search & Matching**: Find candidates that match job requirements
4. **Statistics**: Provide resume bank analytics

KEY CONCEPTS FOR REACT DEVELOPERS:
==================================
- **FastAPI Routers**: Like Express Router for organizing endpoints
- **File Handling**: Similar to multer in Node.js for file uploads
- **Async Operations**: Database and AI calls are non-blocking
- **Type Validation**: Pydantic models ensure data integrity

REAL-WORLD ANALOGY:
==================
Think of this module like a smart HR assistant that can:
- Receive and process resumes automatically
- Extract key information from each resume
- Find the best candidates for any job opening
- Keep statistics on the talent pool
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form, Depends
from typing import List, Optional
from datetime import datetime
from bson import ObjectId  # MongoDB's unique identifier

# Import data models (like TypeScript interfaces)
from app.models.resume_bank import (
    ResumeBankEntry, ResumeSearchFilters, CandidateMatch, ResumeBankStats,
    ResumeBankResponse, CandidateSearchResponse, ResumeBankEntryCreate,
    ResumeBankEntryUpdate, ResumeStatus, ResumeSource
)

# Import core services
from app.core.database import get_database              # Database connection
from app.repositories.mongodb_repository import MongoDBRepository  # Database operations
from app.models.mongodb_models import COLLECTIONS       # Collection names
from app.services.openai_service import openai_service  # AI processing
from app.utils.pdf_processor import PDFProcessor        # PDF text extraction
from app.core.logger import logger                      # Logging utility
from app.api.auth import get_current_user              # Authentication
from app.models.mongodb_models import UserDocument      # User data model

# Create router instance (like Express Router)
router = APIRouter()


@router.post("/upload", response_model=ResumeBankEntry)
async def upload_resume_to_bank(
    file: UploadFile = File(...),
    candidate_name: str = Form(""),
    candidate_email: str = Form(""),
    candidate_phone: str = Form(""),
    candidate_location: str = Form(""),
    years_experience: str = Form(""),
    current_role: str = Form(""),
    desired_role: str = Form(""),
    salary_expectation: str = Form(""),
    availability: str = Form(""),
    tags: str = Form(""),
    notes: str = Form(""),
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    logger.warning(f"Resume upload attempt by user: {current_user.email if current_user else 'No user'}")
    """
    Upload a resume directly to the resume bank.
    
    Args:
        file: Resume PDF file
        candidate_name: Candidate's full name
        candidate_email: Candidate's email address
        candidate_phone: Candidate's phone number (optional)
        candidate_location: Candidate's location (optional)
        years_experience: Years of experience (optional)
        current_role: Current role (optional)
        desired_role: Desired role (optional)
        salary_expectation: Salary expectation (optional)
        availability: Availability (optional)
        tags: Comma-separated tags (optional)
        notes: Additional notes (optional)
        
    Returns:
        ResumeBankEntry: Created resume bank entry
    """
    try:
        # Validate file type
        if not file.content_type or not file.content_type.startswith('application/pdf'):
            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed"
            )
        
        # Process PDF file
        resume_text, filename = await PDFProcessor.process_pdf(file)
        
        # Extract candidate information from resume text using AI-powered extraction
        extracted_info = await PDFProcessor.extract_candidate_info_from_text(resume_text, filename)
        
        # Use extracted info if form data is empty (no fallback values)
        candidate_name = candidate_name if candidate_name else extracted_info.get("name", "")
        candidate_email = candidate_email if candidate_email else extracted_info.get("email", "")
        candidate_phone = candidate_phone if candidate_phone else extracted_info.get("phone", "")
        candidate_location = candidate_location if candidate_location else extracted_info.get("location", "")
        
        # Handle years_experience conversion
        years_exp = None
        if years_experience:
            try:
                years_exp = int(years_experience)
            except ValueError:
                years_exp = None
        elif extracted_info.get("experience_years"):
            years_exp = extracted_info["experience_years"]
        
        # Use extracted current role if not provided
        current_role = current_role if current_role else extracted_info.get("current_role")
        
        # Extract skills and create summary from extracted information
        extracted_skills = extracted_info.get("skills", [])
        
        # Create summary from extracted information
        summary_parts = []
        if candidate_name and candidate_name != "Unknown":
            summary_parts.append(f"Professional resume for {candidate_name}")
        if current_role:
            summary_parts.append(f"Current role: {current_role}")
        if years_exp:
            summary_parts.append(f"Experience: {years_exp} years")
        if extracted_skills:
            summary_parts.append(f"Key skills: {', '.join(extracted_skills[:3])}")
        
        summary = ". ".join(summary_parts) if summary_parts else "Professional resume with relevant experience and skills"
        
        # Create overall assessment
        assessment_parts = []
        if years_exp and years_exp >= 3:
            assessment_parts.append("Experienced professional")
        if extracted_skills:
            assessment_parts.append(f"Skilled in {len(extracted_skills)} technologies")
        if extracted_info.get("education"):
            assessment_parts.append("Educated candidate")
        
        overall_assessment = ". ".join(assessment_parts) if assessment_parts else "Qualified candidate with relevant experience"
        
        # Determine experience level
        experience_level = "Entry"
        if years_exp:
            if years_exp >= 5:
                experience_level = "Senior"
            elif years_exp >= 3:
                experience_level = "Mid"
            elif years_exp >= 1:
                experience_level = "Junior"
        
        # Get education information
        education = extracted_info.get("education", "Not specified")
        
        # Prepare candidate info - only include fields that have actual data
        candidate_info = {
            "filename": filename,
            "tags": tags.split(',') if tags else [],  # Convert string to list
            "notes": notes,
            "skills": extracted_skills  # Add extracted skills
        }
        
        # Only add fields that have actual data (no fallback values)
        if candidate_name:
            candidate_info["candidate_name"] = candidate_name
        if candidate_email:
            candidate_info["candidate_email"] = candidate_email
        if candidate_phone:
            candidate_info["candidate_phone"] = candidate_phone
        if candidate_location:
            candidate_info["candidate_location"] = candidate_location
        if years_exp:
            candidate_info["years_experience"] = years_exp
        if current_role:
            candidate_info["current_role"] = current_role
        if desired_role:
            candidate_info["desired_role"] = desired_role
        if salary_expectation:
            candidate_info["salary_expectation"] = salary_expectation
        if availability:
            candidate_info["availability"] = availability
        
        # Add to resume bank using MongoDB
        repo = MongoDBRepository(database)
        
        # Create resume bank entry directly without analysis
        
        # Create resume bank entry with all parsed data
        from bson import ObjectId
        entry_data = {
            "user_id": ObjectId(current_user.id),
            "filename": filename,
            "candidate_name": candidate_name or "Unknown Candidate",
            "candidate_email": candidate_email or "no-email@example.com",
            "candidate_phone": candidate_phone,
            "candidate_location": candidate_location,
            "years_experience": years_exp,
            "current_role": current_role,
            "desired_role": desired_role,
            "salary_expectation": salary_expectation,
            "availability": availability,
            "tags": tags.split(',') if tags else [],
            "notes": notes,
            # No resume_analysis_id needed
            "status": "active",
            # Include AI analysis results directly
            "summary": summary,
            "skills": extracted_skills,
            "education": extracted_info.get("education"),
            "experience_level": "Senior" if years_exp and years_exp >= 5 else "Mid" if years_exp and years_exp >= 2 else "Junior" if years_exp else "Unknown",
            "overall_assessment": overall_assessment
        }
        
        created_entry = await repo.create_resume_bank_entry(entry_data)
        
        # Add to Qdrant for vector search
        try:
            from app.services.openai_service import openai_service
            from app.services.qdrant_service import qdrant_service
            
            # Generate embedding for the resume text
            embedding = await openai_service.generate_embedding(resume_text)
            
            # Add to Qdrant collection
            await qdrant_service.store_resume_embedding(
                analysis_id=str(created_entry.id),
                embedding=embedding,
                metadata={
                    "resume_id": str(created_entry.id),
                    "filename": filename,
                    "candidate_name": candidate_name or "Unknown",
                    "skills": extracted_skills,
                    "experience_years": years_exp or 0,
                    "current_role": current_role or "",
                    "location": candidate_location or ""
                }
            )
            
            logger.info(f"Successfully added resume to Qdrant vector database: {filename}")
        except Exception as e:
            logger.warning(f"Failed to add resume to Qdrant: {e}")
        
        logger.info(f"Successfully uploaded resume to bank: {filename}")
        
        # Convert MongoDB document to response model
        return ResumeBankEntry(
            id=str(created_entry.id),
            filename=created_entry.filename,
            candidate_name=created_entry.candidate_name,
            candidate_email=created_entry.candidate_email,
            candidate_phone=created_entry.candidate_phone,
            candidate_location=created_entry.candidate_location,
            years_experience=created_entry.years_experience,
            current_role=created_entry.current_role,
            desired_role=created_entry.desired_role,
            salary_expectation=created_entry.salary_expectation,
            availability=created_entry.availability,
            tags=created_entry.tags,
            notes=created_entry.notes,
            summary=created_entry.summary,
            skills=created_entry.skills,
            education=created_entry.education,
            experience_level=created_entry.experience_level,
            overall_assessment=created_entry.overall_assessment,
            status=created_entry.status,
            last_contact_date=created_entry.last_contact_date,
            created_date=created_entry.created_at,
            updated_date=created_entry.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to upload resume to bank: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload resume to bank"
        )


# Removed add_resume_to_bank function - use upload_resume_to_bank instead


@router.get("/", response_model=List[ResumeBankEntry])
async def get_resume_bank(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Results per page"),
    skills: Optional[str] = Query(None, description="Comma-separated skills"),
    experience_level: Optional[str] = Query(None, description="Experience level"),
    location: Optional[str] = Query(None, description="Location filter"),
    status: Optional[ResumeStatus] = Query(None, description="Resume status"),
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get resumes from the bank with optional filtering.
    
    Args:
        page: Page number for pagination
        page_size: Number of results per page
        skills: Comma-separated list of required skills
        experience_level: Experience level filter
        location: Location filter
        status: Resume status filter
        tags: Comma-separated list of required tags
        
    Returns:
        List[ResumeBankEntry]: List of resumes
    """
    try:
        repo = MongoDBRepository(database)
        
        # Build filters for MongoDB
        filters = {}
        
        if skills:
            skills_list = [skill.strip() for skill in skills.split(",")]
            filters["tags"] = {"$in": skills_list}
        
        if location:
            filters["candidate_location"] = {"$regex": location, "$options": "i"}
        
        if status:
            filters["status"] = status.value if hasattr(status, 'value') else status
        
        if tags:
            tags_list = [tag.strip() for tag in tags.split(",")]
            filters["tags"] = {"$in": tags_list}
        
        # Calculate skip for pagination
        skip = (page - 1) * page_size
        
        # Get resumes from MongoDB filtered by user
        from bson import ObjectId
        user_object_id = ObjectId(current_user.id)
        entries = await repo.get_resume_bank_entries_by_user(user_object_id, skip=skip, limit=page_size)
        
        # Convert MongoDB documents to response models
        response_entries = []
        for i, entry in enumerate(entries):
            try:
                # Handle location field - convert dict to string if needed
                location = entry.candidate_location
                if isinstance(location, dict):
                    if 'city' in location and 'country' in location:
                        location = f"{location['city']}, {location['country']}"
                    elif 'city' in location:
                        location = location['city']
                    elif 'country' in location:
                        location = location['country']
                    else:
                        location = str(location)
                
                response_entries.append(ResumeBankEntry(
                    id=str(entry.id),
                    filename=entry.filename,
                    candidate_name=entry.candidate_name,
                    candidate_email=entry.candidate_email,
                    candidate_phone=entry.candidate_phone,
                    candidate_location=location,
                    years_experience=entry.years_experience,
                    current_role=entry.current_role,
                    desired_role=entry.desired_role,
                    salary_expectation=entry.salary_expectation,
                    availability=entry.availability,
                    tags=entry.tags,
                    notes=entry.notes,
                    summary=entry.summary,
                    skills=entry.skills,
                    education=entry.education,
                    experience_level=entry.experience_level,
                    overall_assessment=entry.overall_assessment,
                    status=entry.status,
                    last_contact_date=entry.last_contact_date,
                    created_date=entry.created_at,
                    updated_date=entry.updated_at,
                    source="direct_upload"  # Add missing required field
                ))
            except Exception as e:
                logger.error(f"Error converting entry {i}: {e}")
                raise
        
        return response_entries
        
    except Exception as e:
        logger.error(f"Failed to get resume bank: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get resume bank"
        )


@router.get("/stats", response_model=ResumeBankStats)
async def get_resume_bank_stats(
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Get statistics about the resume bank.
    
    Returns:
        ResumeBankStats: Bank statistics
    """
    try:
        repo = MongoDBRepository(database)
        from bson import ObjectId
        user_object_id = ObjectId(current_user.id)
        stats_data = await repo.get_resume_bank_stats_by_user(user_object_id)
        
        return ResumeBankStats(
            total_resumes=stats_data["total_entries"],
            active_resumes=stats_data.get("active", 0),
            shortlisted_resumes=stats_data.get("shortlisted", 0),
            recent_uploads=0,  # Can be calculated if needed
            top_skills=[],  # Can be calculated if needed
            experience_distribution={},  # Can be calculated if needed
            location_distribution={}  # Can be calculated if needed
        )
        
    except Exception as e:
        logger.error(f"Failed to get resume bank stats: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get resume bank stats"
        )


@router.post("/semantic-search", response_model=CandidateSearchResponse)
async def semantic_search_candidates(
    query: str = Query(..., description="Search query for semantic matching"),
    limit: int = Query(10, ge=1, le=50, description="Maximum number of candidates"),
    score_threshold: float = Query(0.3, ge=0.0, le=1.0, description="Minimum similarity score")
):
    """
    Perform semantic search for candidates using embeddings.
    
    Args:
        query: Search query (job description, skills, etc.)
        limit: Maximum number of candidates to return
        score_threshold: Minimum similarity score threshold
        
    Returns:
        CandidateSearchResponse: List of matching candidates
    """
    try:
        start_time = datetime.now()
        
        # Generate embedding for search query
        from app.services.openai_service import openai_service
        from app.services.qdrant_service import qdrant_service
        
        query_embedding = await openai_service.generate_embedding(query)
        
        # Find similar resumes using vector search
        similar_resumes = await qdrant_service.find_similar_resumes(
            embedding=query_embedding,
            limit=limit,
            score_threshold=score_threshold
        )
        
        # Convert to candidate format
        candidates = []
        for resume in similar_resumes:
            # Get resume details from resume bank
            resume_entry = await resume_bank_service.get_resume_by_analysis_id(
                resume["analysis_id"]
            )
            if resume_entry:
                candidates.append(resume_entry)
        
        search_time = (datetime.now() - start_time).total_seconds()
        
        return CandidateSearchResponse(
            candidates=candidates,
            total_count=len(candidates),
            search_criteria={
                "query": query,
                "limit": limit,
                "search_type": "semantic",
                "similarity_threshold": score_threshold
            },
            search_time=search_time
        )
        
    except Exception as e:
        logger.error(f"Failed to perform semantic search: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to perform semantic search"
        )


@router.post("/find-candidates", response_model=CandidateSearchResponse)
async def find_candidates_for_job_criteria(
    job_criteria: dict,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of candidates"),
    use_semantic_search: bool = Query(True, description="Use semantic search with embeddings")
):
    """
    Find candidates based on job criteria (for job creation).
    
    Args:
        job_criteria: Job criteria including title, skills, experience, location, etc.
        limit: Maximum number of candidates to return
        use_semantic_search: Whether to use semantic search with embeddings
        
    Returns:
        CandidateSearchResponse: List of matching candidates
    """
    try:
        start_time = datetime.now()
        
        if use_semantic_search:
            # Try semantic search first
            try:
                from app.services.qdrant_service import qdrant_service
                from app.services.openai_service import openai_service
                
                # Create job description for embedding
                job_description = f"""
                Job Title: {job_criteria.get('title', '')}
                Requirements: {', '.join([req.get('skill', '') if isinstance(req, dict) else req for req in job_criteria.get('requirements', [])])}
                Location: {job_criteria.get('location', '')}
                Experience Level: {job_criteria.get('experience_level', '')}
                Job Type: {job_criteria.get('job_type', '')}
                """
                
                # Generate embedding for job criteria
                job_embedding = await openai_service.generate_embedding(job_description)
                
                # Find similar resumes using vector search
                similar_resumes = await qdrant_service.find_similar_resumes(
                    embedding=job_embedding,
                    limit=limit,
                    score_threshold=0.3  # Lower threshold for broader matches
                )
                
                # Convert to candidate format
                candidates = []
                for resume in similar_resumes:
                    # Get resume details from resume bank
                    resume_entry = await resume_bank_service.get_resume_by_analysis_id(
                        resume["analysis_id"]
                    )
                    if resume_entry:
                        candidates.append(resume_entry)
                
                search_time = (datetime.now() - start_time).total_seconds()
                
                return CandidateSearchResponse(
                    candidates=candidates,
                    total_count=len(candidates),
                    search_criteria={
                        "job_title": job_criteria.get("title", "Unknown"),
                        "limit": limit,
                        "search_type": "semantic",
                        "similarity_threshold": 0.3
                    },
                    search_time=search_time
                )
                
            except Exception as e:
                logger.warning(f"Semantic search failed, falling back to rule-based search: {e}")
                # Fall back to rule-based search
        
        # Rule-based search (fallback or when semantic search is disabled)
        filters = ResumeSearchFilters()
        
        if job_criteria.get("requirements"):
            # Extract skills from requirements
            skills = []
            for req in job_criteria["requirements"]:
                if isinstance(req, dict) and req.get("skill"):
                    skills.append(req["skill"])
                elif isinstance(req, str):
                    skills.append(req)
            if skills:
                filters.skills = skills
        
        if job_criteria.get("location"):
            filters.location = job_criteria["location"]
        
        if job_criteria.get("experience_level"):
            # Map experience level to years
            exp_mapping = {
                "entry": (0, 2),
                "junior": (1, 3),
                "mid": (3, 7),
                "senior": (5, 10),
                "lead": (8, 15)
            }
            if job_criteria["experience_level"] in exp_mapping:
                min_exp, max_exp = exp_mapping[job_criteria["experience_level"]]
                filters.years_experience_min = min_exp
                filters.years_experience_max = max_exp
        
        # Search candidates
        candidates = await resume_bank_service.search_resumes(
            filters,
            1,  # page
            limit
        )
        search_time = (datetime.now() - start_time).total_seconds()
        
        # Build search criteria
        search_criteria = {
            "job_title": job_criteria.get("title", "Unknown"),
            "limit": limit,
            "skills": filters.skills if filters.skills else [],
            "location": filters.location,
            "experience_level": job_criteria.get("experience_level"),
            "search_type": "rule_based"
        }
        
        return CandidateSearchResponse(
            candidates=candidates,
            total_count=len(candidates),
            search_criteria=search_criteria,
            search_time=search_time
        )
        
    except Exception as e:
        logger.error(f"Failed to find candidates for job criteria: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to find candidates"
        )


@router.get("/search-candidates/{job_id}", response_model=CandidateSearchResponse)
async def search_candidates_for_job(
    job_id: str,
    limit: int = Query(10, ge=1, le=50, description="Maximum number of candidates"),
    page: int = Query(1, ge=1, description="Page number for pagination"),
    skills: Optional[str] = Query(None, description="Additional required skills"),
    location: Optional[str] = Query(None, description="Preferred location"),
    experience_min: Optional[int] = Query(None, description="Minimum years of experience"),
    experience_max: Optional[int] = Query(None, description="Maximum years of experience"),
    min_score: Optional[float] = Query(0.0, ge=0.0, le=100.0, description="Minimum compatibility score"),
    sort_by: str = Query("score", description="Sort by: score, experience, name"),
    sort_order: str = Query("desc", description="Sort order: asc, desc"),
    current_user: UserDocument = Depends(get_current_user),
    database = Depends(get_database)
):
    """
    Find the best candidates for a specific job posting with advanced filtering and pagination.
    
    Args:
        job_id: Job posting ID
        limit: Maximum number of candidates to return per page
        page: Page number for pagination
        skills: Additional required skills (comma-separated)
        location: Preferred location
        experience_min: Minimum years of experience
        experience_max: Maximum years of experience
        min_score: Minimum compatibility score (0-100)
        sort_by: Sort field (score, experience, name)
        sort_order: Sort order (asc, desc)
        database: Database instance
        
    Returns:
        CandidateSearchResponse: List of matching candidates with pagination info
    """
    try:
        # Get job posting from database using MongoDB
        repository = MongoDBRepository(database)
        
        db_job = await repository.get_job_posting_by_id(job_id)
        if not db_job:
            raise HTTPException(
                status_code=404,
                detail="Job posting not found"
            )
        
        # Convert to JobPosting model for compatibility analysis
        from app.models.job import JobPosting, JobType, ExperienceLevel, JobRequirement
        
        # Convert requirements from dict to JobRequirement objects
        job_requirements = []
        if db_job.requirements:
            for req in db_job.requirements:
                if isinstance(req, dict):
                    job_requirements.append(JobRequirement(
                        skill=req.get("skill", ""),
                        level=req.get("level", "Intermediate"),
                        weight=req.get("weight", 1.0)
                    ))
                else:
                    job_requirements.append(req)
        
        job_posting = JobPosting(
            id=str(db_job.id),
            title=db_job.title,
            company=db_job.company,
            location=db_job.location,
            job_type=JobType(db_job.job_type),
            experience_level=ExperienceLevel(db_job.experience_level),
            description=db_job.description,
            requirements=job_requirements,
            responsibilities=db_job.responsibilities or [],
            benefits=db_job.benefits or [],
            salary_range=db_job.salary_range,
            status=db_job.status,
            created_at=db_job.created_at,
            updated_at=db_job.updated_at or db_job.created_at
        )
        
        # Build additional filters
        filters = None
        if skills or location or experience_min or experience_max:
            filters = ResumeSearchFilters()
            
            if skills:
                filters.skills = [skill.strip() for skill in skills.split(",")]
            
            if location:
                filters.location = location
            
            if experience_min:
                filters.years_experience_min = experience_min
            
            if experience_max:
                filters.years_experience_max = experience_max
        
        # Get all resumes from the bank
        start_time = datetime.now()
        
        # Get all candidates from resume bank for the current user
        from bson import ObjectId
        user_object_id = ObjectId(current_user.id)
        all_resumes = await repository.get_resume_bank_entries_by_user(user_object_id, skip=0, limit=1000)
        
        # Convert to candidate format
        all_candidates = []
        for resume in all_resumes:
            # Enhanced compatibility scoring
            job_skills = [req.get("skill", "").lower() for req in db_job.requirements] if db_job.requirements else []
            resume_skills = [skill.lower() for skill in resume.skills] if resume.skills else []
            
            # 1. Skills Matching (40% weight)
            matching_skills = set(job_skills) & set(resume_skills)
            skills_score = (len(matching_skills) / max(len(job_skills), 1)) * 100 if job_skills else 60
            
            # 2. Experience Level Matching (30% weight)
            job_experience_level = db_job.experience_level.lower() if db_job.experience_level else "mid"
            resume_years = resume.years_experience or 0
            
            # Map experience levels to years
            experience_levels = {
                "entry": (0, 2),
                "junior": (1, 3),
                "mid": (3, 6),
                "senior": (5, 10),
                "lead": (8, 15)
            }
            
            expected_range = experience_levels.get(job_experience_level, (3, 6))
            if resume_years >= expected_range[0] and resume_years <= expected_range[1]:
                experience_score = 100
            elif resume_years > expected_range[1]:
                experience_score = 80  # Overqualified but still good
            elif resume_years > 0:
                experience_score = max(20, (resume_years / expected_range[0]) * 60)
            else:
                experience_score = 10
            
            # 3. Role Title Matching (20% weight)
            job_title = db_job.title.lower()
            current_role = (resume.current_role or "").lower()
            desired_role = (resume.desired_role or "").lower()
            
            # Check for role similarity
            role_keywords = ["developer", "engineer", "programmer", "software", "full stack", "frontend", "backend"]
            job_role_match = any(keyword in job_title for keyword in role_keywords)
            resume_role_match = any(keyword in current_role or keyword in desired_role for keyword in role_keywords)
            
            role_score = 100 if job_role_match and resume_role_match else 30
            
            # 4. Location Matching (10% weight)
            location_score = 0
            if location and resume.candidate_location:
                job_location = location.lower()
                resume_location = resume.candidate_location.lower()
                if job_location in resume_location or resume_location in job_location:
                    location_score = 100
                elif any(word in resume_location for word in job_location.split()):
                    location_score = 50
            
            # Calculate overall compatibility score
            overall_score = (skills_score * 0.4 + experience_score * 0.3 + role_score * 0.2 + location_score * 0.1)
            
            # Apply minimum score filter
            if min_score and min_score > 0 and overall_score < min_score:
                continue
            
            # Apply location filter
            if location and resume.candidate_location:
                if location.lower() not in resume.candidate_location.lower():
                    continue
            
            # Apply experience filter
            if experience_min and resume.years_experience:
                if resume.years_experience < experience_min:
                    continue
            
            if experience_max and resume.years_experience:
                if resume.years_experience > experience_max:
                    continue
            
            # Apply skills filter
            if skills:
                required_skills = [skill.strip().lower() for skill in skills.split(",")]
                resume_skills_lower = [skill.lower() for skill in resume.skills] if resume.skills else []
                if not any(skill in resume_skills_lower for skill in required_skills):
                    continue
            
            # Generate match reasons
            match_reasons = []
            if matching_skills:
                match_reasons.append(f"Matches {len(matching_skills)} required skills")
            if experience_score >= 80:
                match_reasons.append(f"Experience level suitable ({resume_years} years)")
            if role_score >= 80:
                match_reasons.append("Role alignment")
            if location_score >= 50:
                match_reasons.append("Location match")
            
            if not match_reasons:
                match_reasons = ["Basic profile match"]
            
            # Create candidate match
            from app.models.resume_bank import CandidateMatch, CompatibilityScore
            
            candidate = CandidateMatch(
                resume_id=str(resume.id),
                candidate_name=resume.candidate_name,
                candidate_email=resume.candidate_email,
                compatibility_score=CompatibilityScore(
                    overall_score=round(overall_score, 1),
                    skills_match=skills_score,
                    experience_match=experience_score,
                    role_match=role_score,
                    location_match=location_score,
                    match_confidence=min(95, max(50, overall_score + 10))  # Confidence based on overall score
                ),
                current_role=resume.current_role,
                years_experience=resume.years_experience,
                location=resume.candidate_location,
                status=resume.status,
                match_reasons=match_reasons
            )
            all_candidates.append(candidate)
        
        # Apply sorting
        if sort_by == "score":
            all_candidates.sort(
                key=lambda x: x.compatibility_score.overall_score,
                reverse=(sort_order.lower() == "desc")
            )
        elif sort_by == "experience":
            all_candidates.sort(
                key=lambda x: x.years_experience or 0,
                reverse=(sort_order.lower() == "desc")
            )
        elif sort_by == "name":
            all_candidates.sort(
                key=lambda x: x.candidate_name.lower(),
                reverse=(sort_order.lower() == "desc")
            )
        else:
            # Default sort by score descending
            all_candidates.sort(
                key=lambda x: x.compatibility_score.overall_score,
                reverse=True
            )
        
        # Apply pagination
        total_candidates = len(all_candidates)
        start_index = (page - 1) * limit
        end_index = start_index + limit
        paginated_candidates = all_candidates[start_index:end_index]
        
        search_time = (datetime.now() - start_time).total_seconds()
        
        # Calculate pagination info
        total_pages = (total_candidates + limit - 1) // limit
        has_next = page < total_pages
        has_previous = page > 1
        
        # Build search criteria
        search_criteria = {
            "job_id": job_id,
            "job_title": db_job.title,
            "limit": limit,
            "page": page,
            "total_pages": total_pages,
            "total_candidates": total_candidates,
            "min_score": min_score,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        if filters:
            if filters.skills:
                search_criteria["additional_skills"] = filters.skills
            if filters.location:
                search_criteria["preferred_location"] = filters.location
            if filters.years_experience_min:
                search_criteria["experience_min"] = filters.years_experience_min
            if filters.years_experience_max:
                search_criteria["experience_max"] = filters.years_experience_max
        
        # Build response
        response = CandidateSearchResponse(
            candidates=paginated_candidates,
            search_criteria=search_criteria,
            search_time=search_time,
            total_candidates=total_candidates,
            pagination={
                "page": page,
                "limit": limit,
                "total_pages": total_pages,
                "has_next": has_next,
                "has_previous": has_previous,
                "start_index": start_index + 1,
                "end_index": min(end_index, total_candidates)
            }
        )
        
        logger.info(f"Found {len(paginated_candidates)} candidates for job {job_posting.title} (page {page}/{total_pages}) in {search_time:.2f}s")
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to search candidates for job {job_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to search candidates"
        )


@router.get("/{resume_id}", response_model=ResumeBankEntry)
async def get_resume_from_bank(resume_id: str, database = Depends(get_database)):
    """
    Get a specific resume from the bank.
    
    Args:
        resume_id: Resume ID
        database: Database instance
        
    Returns:
        ResumeBankEntry: Resume details
    """
    try:
        repository = MongoDBRepository(database)
        resume_entry = await repository.get_resume_bank_entry_by_id(resume_id)
        
        if not resume_entry:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )
        
        # Convert MongoDB document to response model
        return ResumeBankEntry(
            id=str(resume_entry.id),
            filename=resume_entry.filename,
            candidate_name=resume_entry.candidate_name,
            candidate_email=resume_entry.candidate_email,
            candidate_phone=resume_entry.candidate_phone,
            candidate_location=resume_entry.candidate_location,
            years_experience=resume_entry.years_experience,
            current_role=resume_entry.current_role,
            desired_role=resume_entry.desired_role,
            salary_expectation=resume_entry.salary_expectation,
            availability=resume_entry.availability,
            tags=resume_entry.tags,
            notes=resume_entry.notes,
            summary=resume_entry.summary,
            skills=resume_entry.skills,
            education=resume_entry.education,
            experience_level=resume_entry.experience_level,
            overall_assessment=resume_entry.overall_assessment,
            status=resume_entry.status,
            last_contact_date=resume_entry.last_contact_date,
            created_date=resume_entry.created_at,
            updated_date=resume_entry.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get resume {resume_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get resume"
        )


@router.put("/{resume_id}", response_model=ResumeBankEntry)
async def update_resume_in_bank(resume_id: str, update_data: ResumeBankEntryUpdate, database = Depends(get_database)):
    """
    Update a resume in the bank.
    
    Args:
        resume_id: Resume ID
        update_data: Updated resume data
        database: Database instance
        
    Returns:
        ResumeBankEntry: Updated resume
    """
    try:
        repository = MongoDBRepository(database)
        
        # Check if resume exists
        resume_entry = await repository.get_resume_bank_entry_by_id(resume_id)
        if not resume_entry:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )
        
        # Update only provided fields
        update_dict = update_data.dict(exclude_unset=True)
        
        # Update the resume
        updated_resume = await repository.update_resume_bank_entry(resume_id, update_dict)
        
        if not updated_resume:
            raise HTTPException(
                status_code=500,
                detail="Failed to update resume"
            )
        
        logger.info(f"Resume updated: {updated_resume.candidate_name} (ID: {resume_id})")
        
        # Convert MongoDB document to response model
        return ResumeBankEntry(
            id=str(updated_resume.id),
            filename=updated_resume.filename,
            candidate_name=updated_resume.candidate_name,
            candidate_email=updated_resume.candidate_email,
            candidate_phone=updated_resume.candidate_phone,
            candidate_location=updated_resume.candidate_location,
            years_experience=updated_resume.years_experience,
            current_role=updated_resume.current_role,
            desired_role=updated_resume.desired_role,
            salary_expectation=updated_resume.salary_expectation,
            availability=updated_resume.availability,
            tags=updated_resume.tags,
            notes=updated_resume.notes,
            summary=updated_resume.summary,
            skills=updated_resume.skills,
            education=updated_resume.education,
            experience_level=updated_resume.experience_level,
            overall_assessment=updated_resume.overall_assessment,
            status=updated_resume.status,
            last_contact_date=updated_resume.last_contact_date,
            created_date=updated_resume.created_at,
            updated_date=updated_resume.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update resume {resume_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update resume"
        )


@router.delete("/{resume_id}")
async def delete_resume_from_bank(resume_id: str, database = Depends(get_database)):
    """
    Delete a resume from the bank.
    
    Args:
        resume_id: Resume ID
        database: Database instance
        
    Returns:
        dict: Success message
    """
    try:
        repository = MongoDBRepository(database)
        
        # Check if resume exists
        resume = await repository.get_resume_bank_entry_by_id(resume_id)
        if not resume:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )
        
        candidate_name = resume.candidate_name
        
        # Delete the resume
        success = await repository.delete_resume_bank_entry(resume_id)
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Failed to delete resume"
            )
        
        logger.info(f"Resume deleted: {candidate_name} (ID: {resume_id})")
        
        return {"message": "Resume deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete resume {resume_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete resume"
        )


@router.post("/{resume_id}/status")
async def update_resume_status(resume_id: str, status: ResumeStatus, database = Depends(get_database)):
    """
    Update the status of a resume in the bank.
    
    Args:
        resume_id: Resume ID
        status: New status
        db: Database session
        
    Returns:
        ResumeBankEntry: Updated resume
    """
    try:
        resume_bank_service = ResumeBankService(db)
        resume_entry = resume_bank_service.repository.get_resume_bank_entry_by_id(resume_id)
        
        if not resume_entry:
            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )
        
        resume_entry.status = status.value
        resume_entry.updated_at = datetime.now()
        
        db.commit()
        db.refresh(resume_entry)
        
        logger.info(f"Resume status updated: {resume_entry.candidate_name} -> {status}")
        
        # Convert database model to Pydantic model for response
        from app.utils.model_converter import convert_db_resume_bank_entry_to_pydantic
        return convert_db_resume_bank_entry_to_pydantic(resume_entry)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update resume status {resume_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update resume status"
        )


# Removed duplicate function - using the one from utils/ai_extractor.py 