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
    app_name: str = "HR API"
    app_version: str = "1.0.0"
    debug: bool = False
    environment: str = "development"
    
    # OpenAI API configuration (REQUIRED)
    openai_api_key: str  # Must be provided via OPENAI_API_KEY env var
    openai_api_base: str = "https://api.openai.com/v1"
    openai_model: str = "gpt-3.5-turbo"
    

    
    # File upload settings
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: str = "application/pdf"  # Will be split into list when needed
    upload_folder: str = "uploads"
    
    # AI analysis settings
    max_tokens: int = 2000
    temperature: float = 0.3
    analysis_timeout: int = 60  # seconds
    
    # Security settings (REQUIRED)
    secret_key: str  # Must be provided via SECRET_KEY env var
    refresh_secret_key: Optional[str] = None  # Optional, will use SECRET_KEY if not provided
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    
    # Logging settings
    log_level: str = "INFO"
    
    # MongoDB settings
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "resume_analysis"
    

    
    def get_allowed_file_types(self) -> list:
        """Get allowed file types as a list."""
        return [ft.strip() for ft in self.allowed_file_types.split(",")]
    
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
    # OpenAI Configuration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    if not OPENAI_API_KEY:
        # Warning: OPENAI_API_KEY not set. Please set it in your .env file.
        pass
    
    # Create upload directory if it doesn't exist
    os.makedirs(settings.upload_folder, exist_ok=True) 