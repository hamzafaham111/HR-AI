"""
Configuration module for the HR-AI application.

This module provides environment-specific configuration management
with proper validation and type safety.
"""

from app.core.config.settings import Settings, get_settings, validate_settings, settings

__all__ = ["Settings", "get_settings", "validate_settings", "settings"]

