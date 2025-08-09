"""
Database initialization script.
"""

from app.core.database import engine, Base
from app.models.database_models import JobPosting, ResumeAnalysis, ResumeBankEntry, User

def init_db():
    """Initialize the database by creating all tables."""
    # Drop all tables first to ensure clean schema
    print("Dropping existing tables...")
    Base.metadata.drop_all(bind=engine)
    
    # Create all tables with correct schema
    print("Creating tables with correct schema...")
    Base.metadata.create_all(bind=engine)
    
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db() 