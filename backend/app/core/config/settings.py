"""
Application settings with environment-specific configuration.

This module provides centralized configuration management with:
- Environment-specific settings
- Type-safe configuration
- Validation
- Default values
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, List
import os
from pathlib import Path


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    This class manages all configuration settings for the application,
    including API keys, database connections, and application behavior.
    """
    
    # Application settings
    app_name: str = Field(default="HR API", description="Application name")
    app_version: str = Field(default="1.0.0", description="Application version")
    debug: bool = Field(default=False, description="Debug mode")
    environment: str = Field(default="development", description="Environment (development, staging, production)")
    
    @field_validator('environment')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        allowed = ['development', 'staging', 'production', 'test']
        if v.lower() not in allowed:
            raise ValueError(f"Environment must be one of: {', '.join(allowed)}")
        return v.lower()
    
    # OpenAI API configuration
    openai_api_key: str = Field(
        default="your-openai-api-key-here",
        description="OpenAI API key"
    )
    openai_api_base: str = Field(
        default="https://api.openai.com/v1",
        description="OpenAI API base URL"
    )
    openai_model: str = Field(
        default="gpt-3.5-turbo",
        description="OpenAI model to use"
    )
    
    # File upload settings
    max_file_size: int = Field(
        default=10 * 1024 * 1024,  # 10MB
        description="Maximum file size in bytes"
    )
    allowed_file_types: str = Field(
        default="application/pdf",
        description="Comma-separated list of allowed file types"
    )
    upload_folder: str = Field(
        default="uploads",
        description="Folder for file uploads"
    )
    
    # AI analysis settings
    max_tokens: int = Field(
        default=2000,
        ge=1,
        le=4000,
        description="Maximum tokens for AI responses"
    )
    temperature: float = Field(
        default=0.3,
        ge=0.0,
        le=2.0,
        description="AI temperature (creativity level)"
    )
    analysis_timeout: int = Field(
        default=60,
        ge=1,
        description="AI analysis timeout in seconds"
    )
    
    # Security settings (REQUIRED)
    secret_key: str = Field(
        ...,
        min_length=32,
        description="Secret key for JWT tokens (REQUIRED)"
    )
    refresh_secret_key: Optional[str] = Field(
        default=None,
        description="Refresh token secret key (optional, uses SECRET_KEY if not provided)"
    )
    algorithm: str = Field(
        default="HS256",
        description="JWT algorithm"
    )
    access_token_expire_minutes: int = Field(
        default=15,
        ge=1,
        description="Access token expiration in minutes"
    )
    refresh_token_expire_days: int = Field(
        default=7,
        ge=1,
        description="Refresh token expiration in days"
    )
    
    # Logging settings
    log_level: str = Field(
        default="INFO",
        description="Logging level"
    )
    
    @field_validator('log_level')
    @classmethod
    def validate_log_level(cls, v: str) -> str:
        """Validate log level."""
        allowed = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if v.upper() not in allowed:
            raise ValueError(f"Log level must be one of: {', '.join(allowed)}")
        return v.upper()
    
    # MongoDB settings
    mongodb_url: str = Field(
        default="mongodb://localhost:27017",
        description="MongoDB connection URL"
    )
    database_name: str = Field(
        default="resume_analysis",
        description="MongoDB database name"
    )
    
    # Security settings
    enable_security_middleware: bool = Field(
        default=True,
        description="Enable security middleware"
    )
    rate_limit_enabled: bool = Field(
        default=True,
        description="Enable rate limiting"
    )
    rate_limit_window_seconds: int = Field(
        default=60,
        ge=1,
        description="Rate limit window in seconds"
    )
    rate_limit_max_requests: int = Field(
        default=100,
        ge=1,
        description="Maximum requests per window"
    )
    cors_origins: str = Field(
        default="http://localhost:3000,http://localhost:3001,http://localhost:5173",
        description="Comma-separated list of allowed CORS origins"
    )
    cors_allow_credentials: bool = Field(
        default=True,
        description="Allow credentials in CORS"
    )
    cors_allow_methods: str = Field(
        default="*",
        description="Comma-separated list of allowed HTTP methods"
    )
    cors_allow_headers: str = Field(
        default="*",
        description="Comma-separated list of allowed headers"
    )
    
    def get_allowed_file_types(self) -> List[str]:
        """
        Get allowed file types as a list.
        
        Returns:
            List of allowed file type strings
        """
        return [ft.strip() for ft in self.allowed_file_types.split(",") if ft.strip()]
    
    def get_cors_origins(self) -> List[str]:
        """
        Get CORS origins as a list.
        
        Returns:
            List of allowed CORS origin strings
        """
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
    
    def get_cors_methods(self) -> List[str]:
        """
        Get CORS allowed methods as a list.
        
        Returns:
            List of allowed HTTP method strings
        """
        if self.cors_allow_methods == "*":
            return ["*"]
        return [method.strip() for method in self.cors_allow_methods.split(",") if method.strip()]
    
    def get_cors_headers(self) -> List[str]:
        """
        Get CORS allowed headers as a list.
        
        Returns:
            List of allowed header strings
        """
        if self.cors_allow_headers == "*":
            return ["*"]
        return [header.strip() for header in self.cors_allow_headers.split(",") if header.strip()]
    
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.environment == "production"
    
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.environment == "development"
    
    def is_testing(self) -> bool:
        """Check if running in test environment."""
        return self.environment == "test"
    
    class Config:
        """
        Pydantic configuration for environment variable loading.
        """
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "allow"  # Allow extra fields for flexibility


def get_settings() -> Settings:
    """
    Get the application settings instance.
    
    Returns:
        Settings: The application settings instance
    """
    return settings


def validate_settings() -> None:
    """
    Validate that all required settings are properly configured.
    
    This function checks for required environment variables and creates
    necessary directories. It logs warnings for missing optional settings.
    
    Raises:
        ValueError: If required settings are missing or invalid
    """
    # Validate secret key
    if not settings.secret_key or settings.secret_key == "your-secret-key-here":
        raise ValueError(
            "SECRET_KEY is required and must be set in environment variables. "
            "It should be at least 32 characters long."
        )
    
    # Validate MongoDB URL
    if not settings.mongodb_url:
        raise ValueError("MONGODB_URL is required")
    
    # Create upload directory if it doesn't exist
    upload_path = Path(settings.upload_folder)
    upload_path.mkdir(parents=True, exist_ok=True)
    
    # Log configuration status (lazy import to avoid circular dependency)
    try:
        from app.core.logging import logger
        logger.info(
            "Configuration validated",
            environment=settings.environment,
            debug=settings.debug,
            database=settings.database_name
        )
    except (ImportError, AttributeError):
        # If logger is not available yet, just print (shouldn't happen in normal flow)
        print(f"Configuration validated - Environment: {settings.environment}, Debug: {settings.debug}")


# Create global settings instance
settings = Settings()

# Note: validate_settings() should be called explicitly from main.py
# after all modules are loaded to avoid circular import issues

