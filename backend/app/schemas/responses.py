"""
Standard response models for API endpoints.

This module defines the standard response structures used throughout the API
to ensure consistency and better client-side handling.
"""

from typing import Any, Dict, List, Optional, Generic, TypeVar
from pydantic import BaseModel, Field
from datetime import datetime

from app.schemas.pagination import PaginationMeta

T = TypeVar('T')


class APIResponse(BaseModel, Generic[T]):
    """
    Base API response model.
    
    All API responses should follow this structure for consistency.
    """
    success: bool = Field(..., description="Whether the request was successful")
    message: str = Field(..., description="Human-readable message")
    data: Optional[T] = Field(None, description="Response data (if successful)")
    errors: Optional[List[Dict[str, Any]]] = Field(None, description="Error details (if failed)")
    correlation_id: Optional[str] = Field(None, description="Request correlation ID for tracking")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class SuccessResponse(BaseModel, Generic[T]):
    """
    Standard success response model.
    
    Use this for successful operations that return data.
    """
    success: bool = Field(True, description="Always true for success responses")
    message: str = Field(..., description="Success message")
    data: T = Field(..., description="Response data")
    correlation_id: Optional[str] = Field(None, description="Request correlation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    
    Use this for error responses to provide consistent error information.
    """
    success: bool = Field(False, description="Always false for error responses")
    message: str = Field(..., description="Error message")
    error_code: str = Field(..., description="Machine-readable error code")
    errors: Optional[List[Dict[str, Any]]] = Field(None, description="Detailed error information")
    correlation_id: Optional[str] = Field(None, description="Request correlation ID")
    path: Optional[str] = Field(None, description="Request path that caused the error")
    method: Optional[str] = Field(None, description="HTTP method that caused the error")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Paginated response model.
    
    Use this for endpoints that return paginated data.
    """
    success: bool = Field(True, description="Always true for successful paginated responses")
    message: str = Field(..., description="Success message")
    data: List[T] = Field(..., description="List of items for current page")
    pagination: PaginationMeta = Field(..., description="Pagination metadata")
    correlation_id: Optional[str] = Field(None, description="Request correlation ID")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")

