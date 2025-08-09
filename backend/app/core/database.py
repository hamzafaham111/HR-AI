"""
MongoDB database configuration and connection management.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from app.core.config import settings
from loguru import logger

# MongoDB connection
class MongoDB:
    client: AsyncIOMotorClient = None
    sync_client: MongoClient = None
    
    @classmethod
    async def connect_to_mongo(cls):
        """Create database connection."""
        try:
            # Get MongoDB URL from settings or use default
            mongodb_url = getattr(settings, 'mongodb_url', 'mongodb://localhost:27017')
            database_name = getattr(settings, 'database_name', 'resume_analysis')
            
            logger.info(f"Connecting to MongoDB: {mongodb_url}")
            
            # Create async client
            cls.client = AsyncIOMotorClient(mongodb_url)
            
            # Create sync client for operations that need it
            cls.sync_client = MongoClient(mongodb_url)
            
            # Test connection
            await cls.client.admin.command('ping')
            logger.info("Successfully connected to MongoDB")
            
            return cls.client[database_name]
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    @classmethod
    async def close_mongo_connection(cls):
        """Close database connection."""
        if cls.client:
            cls.client.close()
            logger.info("MongoDB connection closed")
        
        if cls.sync_client:
            cls.sync_client.close()

# Database instance
db = MongoDB()

# Dependency to get database
async def get_database():
    """Get database instance."""
    if not db.client:
        await db.connect_to_mongo()
    return db.client[getattr(settings, 'database_name', 'resume_analysis')]

# Legacy function for compatibility (will be removed)
def get_db():
    """Legacy function - use get_database() instead."""
    raise DeprecationWarning("Use get_database() instead of get_db()") 