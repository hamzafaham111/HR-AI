"""
Configuration settings for the AI Resume Analysis System.

This module contains all configuration settings using Pydantic's
Settings class for type-safe environment variable management.
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class manages all configuration settings for the application,
    including API keys, database connections, and application behavior.
    """
    
    # Application settings
    app_name: str = "AI Resume Analysis API"
    app_version: str = "1.0.0"
    debug: bool = False
    
    # OpenAI API configuration
    openai_api_key: str = "your-openai-api-key"
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-4o-mini"
    
    # Qdrant vector database configuration
    qdrant_host: str = "localhost"
    qdrant_port: int = 6333
    qdrant_collection_name: str = "resumes"
    qdrant_vector_size: int = 1536  # OpenAI embedding dimension
    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = ["application/pdf"]
    upload_folder: str = "uploads"
    
    # AI analysis settings
    max_tokens: int = 2000
    temperature: float = 0.3
    analysis_timeout: int = 60  # seconds
    
    # Security settings
    secret_key: str = "your-secret-key-change-in-production"
    refresh_secret_key: str = "your-refresh-secret-key-here"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Logging settings
    log_level: str = "INFO"
    
    # MongoDB settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "resume_analysis"
    
    # Legacy database settings (for migration)
    database_url: Optional[str] = None
    DATABASE_URL: Optional[str] = None
    database_echo: bool = False
    
    class Config:
        """
        Pydantic configuration for environment variable loading.
        """
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"  # Allow extra fields


# Create global settings instance
settings = Settings()


def get_settings() -> Settings:
    """
    Get the application settings instance.
    
    Returns:
        Settings: The application settings instance
    """
    return settings


# Validate required settings
def validate_settings():
    """
    Validate that all required settings are properly configured.
    
    Raises:
        ValueError: If required settings are missing
    """
    if not settings.openai_api_key or settings.openai_api_key == "your-openai-api-key":
        print("Warning: OPENAI_API_KEY not set. Please set it in your .env file.")
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_folder, exist_ok=True) 