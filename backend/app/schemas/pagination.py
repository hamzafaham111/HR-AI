"""
Pagination schemas for API endpoints.

This module provides pagination parameters and utilities for handling
paginated responses.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class PaginationParams(BaseModel):
    """
    Pagination parameters for API requests.
    
    Use this as a dependency in FastAPI endpoints that support pagination.
    """
    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(10, ge=1, le=100, description="Number of items per page (max 100)")
    
    @field_validator('page_size')
    @classmethod
    def validate_page_size(cls, v: int) -> int:
        """Ensure page size is within reasonable limits."""
        if v > 100:
            return 100
        if v < 1:
            return 10
        return v
    
    @property
    def skip(self) -> int:
        """Calculate number of items to skip."""
        return (self.page - 1) * self.page_size
    
    @property
    def limit(self) -> int:
        """Get the limit (same as page_size)."""
        return self.page_size


class PaginationMeta(BaseModel):
    """Pagination metadata for responses."""
    page: int = Field(..., description="Current page number")
    page_size: int = Field(..., description="Number of items per page")
    total_items: int = Field(..., description="Total number of items")
    total_pages: int = Field(..., description="Total number of pages")
    has_next: bool = Field(..., description="Whether there is a next page")
    has_previous: bool = Field(..., description="Whether there is a previous page")
    
    @classmethod
    def create(
        cls,
        page: int,
        page_size: int,
        total_items: int,
    ) -> "PaginationMeta":
        """
        Create pagination metadata from parameters.
        
        Args:
            page: Current page number
            page_size: Items per page
            total_items: Total number of items
            
        Returns:
            PaginationMeta instance
        """
        total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 0
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=total_pages,
            has_next=page < total_pages,
            has_previous=page > 1,
        )

