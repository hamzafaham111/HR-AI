"""
Response and request schemas for the HR-AI application.

This module provides standardized response models and request schemas
for consistent API responses across all endpoints.
"""

from app.schemas.responses import (
    APIResponse,
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
)
from app.schemas.pagination import PaginationParams, PaginationMeta

__all__ = [
    "APIResponse",
    "SuccessResponse",
    "ErrorResponse",
    "PaginatedResponse",
    "PaginationParams",
    "PaginationMeta",
]

