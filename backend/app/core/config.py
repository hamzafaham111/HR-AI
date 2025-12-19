"""
Configuration module for backward compatibility.

This module re-exports settings from the new config structure
to maintain backward compatibility with existing imports.
"""

# Re-export from new config structure
from app.core.config.settings import (
    Settings,
    get_settings,
    validate_settings,
    settings
)

__all__ = ["Settings", "get_settings", "validate_settings", "settings"]
