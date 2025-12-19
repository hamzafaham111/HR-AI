"""
Response utility functions for creating standardized API responses.

This module provides helper functions to create consistent API responses
across all endpoints.
"""

from typing import Any, List, Optional
from fastapi.responses import JSONResponse
from fastapi import status

from app.schemas.responses import (
    SuccessResponse,
    ErrorResponse,
    PaginatedResponse,
)
from app.schemas.pagination import PaginationMeta
from app.core.logging import get_correlation_id


def success_response(
    data: Any,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
    correlation_id: Optional[str] = None,
) -> JSONResponse:
    """
    Create a standardized success response.
    
    Args:
        data: Response data
        message: Success message
        status_code: HTTP status code
        correlation_id: Request correlation ID (auto-generated if not provided)
        
    Returns:
        JSONResponse with standardized success format
    """
    if correlation_id is None:
        correlation_id = get_correlation_id()
    
    response = SuccessResponse(
        message=message,
        data=data,
        correlation_id=correlation_id,
    )
    
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True)
    )


def error_response(
    message: str,
    error_code: str = "ERROR",
    errors: Optional[List[dict]] = None,
    status_code: int = status.HTTP_400_BAD_REQUEST,
    correlation_id: Optional[str] = None,
    path: Optional[str] = None,
    method: Optional[str] = None,
) -> JSONResponse:
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        error_code: Machine-readable error code
        errors: List of detailed error information
        status_code: HTTP status code
        correlation_id: Request correlation ID (auto-generated if not provided)
        path: Request path
        method: HTTP method
        
    Returns:
        JSONResponse with standardized error format
    """
    if correlation_id is None:
        correlation_id = get_correlation_id()
    
    response = ErrorResponse(
        message=message,
        error_code=error_code,
        errors=errors,
        correlation_id=correlation_id,
        path=path,
        method=method,
    )
    
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True)
    )


def paginated_response(
    data: List[Any],
    page: int,
    page_size: int,
    total_items: int,
    message: str = "Success",
    status_code: int = status.HTTP_200_OK,
    correlation_id: Optional[str] = None,
) -> JSONResponse:
    """
    Create a standardized paginated response.
    
    Args:
        data: List of items for current page
        page: Current page number
        page_size: Items per page
        total_items: Total number of items
        message: Success message
        status_code: HTTP status code
        correlation_id: Request correlation ID (auto-generated if not provided)
        
    Returns:
        JSONResponse with standardized paginated format
    """
    if correlation_id is None:
        correlation_id = get_correlation_id()
    
    pagination = PaginationMeta.create(
        page=page,
        page_size=page_size,
        total_items=total_items,
    )
    
    response = PaginatedResponse(
        message=message,
        data=data,
        pagination=pagination,
        correlation_id=correlation_id,
    )
    
    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True)
    )

