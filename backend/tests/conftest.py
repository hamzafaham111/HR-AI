"""
Pytest configuration and fixtures for the AI Resume Analysis System.

This module provides common fixtures and configuration for all tests.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import get_db, Base
from app.main import app
from app.core.config import settings
from app.models.database_models import User, JobPosting, ResumeAnalysis, ResumeBankEntry
from app.utils.email_service import send_welcome_email, send_password_reset_email
import factory
from factory.fuzzy import FuzzyText, FuzzyEmail
import uuid


# Test database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override database dependency for testing."""
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


# Override database dependency
app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client() -> Generator:
    """Create a test client for the FastAPI application."""
    with TestClient(app) as c:
        yield c


# Factory classes for test data
class UserFactory(factory.Factory):
    """Factory for creating test users."""
    class Meta:
        model = User

    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    name = factory.Faker('name')
    email = factory.Faker('email')
    password_hash = factory.LazyFunction(lambda: "hashed_password")
    role = "user"
    company = factory.Faker('company')
    is_active = True


class JobPostingFactory(factory.Factory):
    """Factory for creating test job postings."""
    class Meta:
        model = JobPosting

    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    title = factory.Faker('job')
    company = factory.Faker('company')
    location = factory.Faker('city')
    description = factory.Faker('text')
    requirements = factory.LazyFunction(lambda: [{"skill": "Python", "level": "Intermediate"}])
    salary_range = factory.Faker('text')
    status = "active"


class ResumeAnalysisFactory(factory.Factory):
    """Factory for creating test resume analyses."""
    class Meta:
        model = ResumeAnalysis

    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    filename = factory.Faker('file_name', extension='pdf')
    summary = factory.Faker('text')
    expertise_areas = factory.LazyFunction(lambda: [{"name": "Python", "level": "Expert"}])
    strong_zones = factory.LazyFunction(lambda: [{"name": "Backend Development", "description": "Strong backend skills"}])
    overall_assessment = factory.Faker('text')
    raw_text = factory.Faker('text')


class ResumeBankEntryFactory(factory.Factory):
    """Factory for creating test resume bank entries."""
    class Meta:
        model = ResumeBankEntry

    id = factory.LazyFunction(lambda: str(uuid.uuid4()))
    filename = factory.Faker('file_name', extension='pdf')
    candidate_name = factory.Faker('name')
    candidate_email = factory.Faker('email')
    candidate_phone = factory.Faker('phone_number')
    candidate_location = factory.Faker('city')
    years_experience = factory.Faker('random_int', min=1, max=10)
    current_role = factory.Faker('job')
    desired_role = factory.Faker('job')
    salary_expectation = factory.Faker('text')
    availability = "2_weeks"
    status = "active"
    source = "direct_upload"
    tags = factory.LazyFunction(lambda: ["python", "react"])
    notes = factory.Faker('text')


# Test fixtures
@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = UserFactory()
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_job_posting(db_session):
    """Create a test job posting."""
    job = JobPostingFactory()
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    return job


@pytest.fixture
def test_resume_analysis(db_session):
    """Create a test resume analysis."""
    analysis = ResumeAnalysisFactory()
    db_session.add(analysis)
    db_session.commit()
    db_session.refresh(analysis)
    return analysis


@pytest.fixture
def test_resume_bank_entry(db_session):
    """Create a test resume bank entry."""
    entry = ResumeBankEntryFactory()
    db_session.add(entry)
    db_session.commit()
    db_session.refresh(entry)
    return entry


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for testing."""
    # This would normally create a JWT token
    # For now, we'll use a mock token
    return {"Authorization": f"Bearer mock_token_{test_user.id}"}


# Mock email service
@pytest.fixture(autouse=True)
def mock_email_service(monkeypatch):
    """Mock email service to prevent actual emails during testing."""
    def mock_send_welcome_email(email: str, name: str) -> bool:
        return True
    
    def mock_send_password_reset_email(email: str, reset_token: str) -> bool:
        return True
    
    monkeypatch.setattr("app.utils.email_service.send_welcome_email", mock_send_welcome_email)
    monkeypatch.setattr("app.utils.email_service.send_password_reset_email", mock_send_password_reset_email)


# Test utilities
def create_test_file(content: str = "Test resume content", filename: str = "test_resume.pdf") -> bytes:
    """Create a test file for upload testing."""
    return content.encode('utf-8')


@pytest.fixture
def sample_pdf_content():
    """Sample PDF content for testing."""
    return create_test_file("John Doe\nSoftware Engineer\njohn.doe@example.com\nPython, React, Node.js")


@pytest.fixture
def sample_resume_data():
    """Sample resume data for testing."""
    return {
        "candidate_name": "John Doe",
        "candidate_email": "john.doe@example.com",
        "candidate_phone": "+1234567890",
        "candidate_location": "San Francisco, CA",
        "years_experience": "5",
        "current_role": "Software Engineer",
        "desired_role": "Senior Software Engineer",
        "salary_expectation": "$100,000 - $150,000",
        "availability": "2_weeks",
        "tags": "python,react,node.js",
        "notes": "Strong backend developer"
    } 