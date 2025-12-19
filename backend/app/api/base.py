"""
Base API router class for standardizing API endpoints.

This module provides a base router class and common decorators
for consistent API endpoint patterns across the application.
"""

from typing import Any, Callable, Optional, TypeVar, Dict
from functools import wraps
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.logging import logger, get_correlation_id
from app.core.database import get_database
from app.utils.responses import success_response, error_response
from app.exceptions import BaseAPIException

F = TypeVar('F', bound=Callable[..., Any])


class BaseRouter:
    """
    Base router class for standardizing API endpoints.
    
    This class provides common functionality for all API routers,
    including error handling, response formatting, and logging.
    """
    
    def __init__(self, prefix: str = "", tags: Optional[list] = None):
        """
        Initialize the base router.
        
        Args:
            prefix: URL prefix for all routes
            tags: OpenAPI tags for documentation
        """
        self.router = APIRouter(prefix=prefix, tags=tags or [])
        self.prefix = prefix
        self.tags = tags or []
    
    @staticmethod
    def handle_errors(func: F) -> F:
        """
        Decorator to handle errors in API endpoints.
        
        This decorator catches exceptions and returns standardized error responses.
        
        Usage:
            @router.get("/endpoint")
            @BaseRouter.handle_errors
            async def my_endpoint():
                ...
        """
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                return await func(*args, **kwargs)
            except BaseAPIException as e:
                correlation_id = get_correlation_id()
                logger.warning(
                    "API exception in endpoint",
                    correlation_id=correlation_id,
                    endpoint=func.__name__,
                    error_code=e.error_code,
                    message=e.message
                )
                return error_response(
                    message=e.message,
                    error_code=e.error_code,
                    status_code=e.status_code,
                    correlation_id=correlation_id,
                    errors=e.details if e.details else None
                )
            except HTTPException:
                # Re-raise HTTP exceptions (they're already formatted)
                raise
            except Exception as e:
                correlation_id = get_correlation_id()
                logger.error(
                    "Unexpected error in endpoint",
                    correlation_id=correlation_id,
                    endpoint=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e),
                    exc_info=True
                )
                return error_response(
                    message="An unexpected error occurred",
                    error_code="INTERNAL_SERVER_ERROR",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    correlation_id=correlation_id
                )
        
        return wrapper  # type: ignore
    
    @staticmethod
    def standardize_response(func: F) -> F:
        """
        Decorator to standardize API responses.
        
        This decorator wraps responses in the standard response format.
        
        Usage:
            @router.get("/endpoint")
            @BaseRouter.standardize_response
            async def my_endpoint():
                return {"data": "value"}  # Will be wrapped in SuccessResponse
        """
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> JSONResponse:
            result = await func(*args, **kwargs)
            
            # If result is already a JSONResponse, return it
            if isinstance(result, JSONResponse):
                return result
            
            # If result is a dict with 'success' key, it's already formatted
            if isinstance(result, dict) and 'success' in result:
                return JSONResponse(content=result)
            
            # Otherwise, wrap in success response
            return success_response(
                data=result,
                message="Success"
            )
        
        return wrapper  # type: ignore
    
    @staticmethod
    def log_request(func: F) -> F:
        """
        Decorator to log API requests.
        
        This decorator logs incoming requests with correlation IDs.
        
        Usage:
            @router.get("/endpoint")
            @BaseRouter.log_request
            async def my_endpoint():
                ...
        """
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            correlation_id = get_correlation_id()
            logger.info(
                "API request",
                correlation_id=correlation_id,
                endpoint=func.__name__,
                method=func.__name__
            )
            
            try:
                result = await func(*args, **kwargs)
                logger.debug(
                    "API request completed",
                    correlation_id=correlation_id,
                    endpoint=func.__name__
                )
                return result
            except Exception as e:
                logger.error(
                    "API request failed",
                    correlation_id=correlation_id,
                    endpoint=func.__name__,
                    error_type=type(e).__name__,
                    error_message=str(e)
                )
                raise
        
        return wrapper  # type: ignore


def require_auth(func: F) -> F:
    """
    Decorator to require authentication for an endpoint.
    
    This is a placeholder - actual auth is handled via Depends(get_current_user).
    This decorator can be used for additional auth checks if needed.
    
    Usage:
        @router.get("/endpoint")
        @require_auth
        async def my_endpoint(current_user: UserDocument = Depends(get_current_user)):
            ...
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Auth is handled by Depends(get_current_user) in function signature
        # This decorator can be extended for additional checks
        return await func(*args, **kwargs)
    
    return wrapper  # type: ignore


def validate_database(func: F) -> F:
    """
    Decorator to validate database connection.
    
    Usage:
        @router.get("/endpoint")
        @validate_database
        async def my_endpoint(database: AsyncIOMotorDatabase = Depends(get_database)):
            ...
    """
    @wraps(func)
    async def wrapper(*args: Any, **kwargs: Any) -> Any:
        # Check if database is in kwargs
        database = kwargs.get('database')
        if database is None:
            # Try to get from args (if database is a positional arg)
            for arg in args:
                if isinstance(arg, AsyncIOMotorDatabase):
                    database = arg
                    break
        
        if database is None:
            logger.warning("Database not found in endpoint arguments")
        
        return await func(*args, **kwargs)
    
    return wrapper  # type: ignore

