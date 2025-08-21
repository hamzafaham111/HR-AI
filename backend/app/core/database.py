"""
Database configuration and session management.
"""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from typing import Optional

# MongoDB client
client: Optional[AsyncIOMotorClient] = None
database: Optional[AsyncIOMotorDatabase] = None

def get_mongodb_client() -> AsyncIOMotorClient:
    """Get MongoDB client instance."""
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongodb_url)
    return client

def get_mongodb_database() -> AsyncIOMotorDatabase:
    """Get MongoDB database instance."""
    global database
    if database is None:
        client = get_mongodb_client()
        database = client[settings.database_name]
    return database

async def get_database() -> AsyncIOMotorDatabase:
    """Dependency to get MongoDB database connection."""
    return get_mongodb_database()

# Legacy SQLAlchemy support (for backward compatibility)
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL for SQL databases (if needed)
if settings.database_url:
    # Production: Use PostgreSQL
    database_url = settings.database_url
else:
    # Development: Use SQLite
    database_url = "sqlite:///./resume_analysis.db"

# Create engine
engine = create_engine(
    database_url,
    connect_args={"check_same_thread": False} if "sqlite" in database_url else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def close_mongodb_connection():
    """Close MongoDB connection."""
    global client
    if client:
        client.close() 