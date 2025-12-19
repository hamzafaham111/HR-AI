"""
Custom exception classes for the HR-AI application.

This module provides a hierarchy of custom exceptions for better error handling
and more descriptive error messages.
"""

from app.exceptions.base import (
    BaseAPIException,
    APIError,
    ValidationError,
    NotFoundError,
    AuthenticationError,
    AuthorizationError,
    RateLimitError,
    DatabaseError,
    ServiceError,
)

__all__ = [
    "BaseAPIException",
    "APIError",
    "ValidationError",
    "NotFoundError",
    "AuthenticationError",
    "AuthorizationError",
    "RateLimitError",
    "DatabaseError",
    "ServiceError",
]

