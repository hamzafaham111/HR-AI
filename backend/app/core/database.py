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
    """
    Get MongoDB client instance.
    
    Returns:
        AsyncIOMotorClient: MongoDB client instance
    """
    global client
    if client is None:
        client = AsyncIOMotorClient(settings.mongodb_url)
    return client


def get_mongodb_database() -> AsyncIOMotorDatabase:
    """
    Get MongoDB database instance.
    
    Returns:
        AsyncIOMotorDatabase: MongoDB database instance
    """
    global database
    if database is None:
        client = get_mongodb_client()
        database = client[settings.database_name]
    return database


async def get_database() -> AsyncIOMotorDatabase:
    """
    Dependency to get MongoDB database connection.
    
    Returns:
        AsyncIOMotorDatabase: MongoDB database instance
    """
    return get_mongodb_database()


async def close_mongodb_connection() -> None:
    """
    Close MongoDB connection.
    
    This should be called during application shutdown.
    """
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed") 