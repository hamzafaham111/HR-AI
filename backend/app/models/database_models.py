"""
SQLAlchemy database models for the AI Resume Analysis System.
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class JobPosting(Base):
    __tablename__ = "job_postings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, nullable=False)
    job_type = Column(String, nullable=False)
    experience_level = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    salary_range = Column(String, nullable=False)
    requirements = Column(JSON, nullable=False)
    responsibilities = Column(JSON, nullable=False)
    benefits = Column(JSON, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ResumeAnalysis(Base):
    __tablename__ = "resume_analyses"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text, nullable=False)
    extracted_skills = Column(JSON, nullable=False)
    experience_years = Column(Integer, nullable=False)
    education_level = Column(String, nullable=False)
    expertise_areas = Column(JSON, nullable=False)
    strong_zones = Column(JSON, nullable=False, default=list)
    summary = Column(Text, nullable=False)
    overall_assessment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class ResumeBankEntry(Base):
    __tablename__ = "resume_bank_entries"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    candidate_name = Column(String, nullable=True)
    candidate_email = Column(String, nullable=True)
    candidate_phone = Column(String, nullable=True)
    candidate_location = Column(String, nullable=True)
    years_experience = Column(Integer, nullable=True)
    current_role = Column(String, nullable=True)
    desired_role = Column(String, nullable=True)
    salary_expectation = Column(String, nullable=True)
    availability = Column(String, nullable=True)
    tags = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True)
    resume_analysis_id = Column(String, ForeignKey("resume_analyses.id"), nullable=True)
    status = Column(String, default="active")
    last_contact_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    resume_analysis = relationship("ResumeAnalysis", backref="resume_bank_entries")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow) 