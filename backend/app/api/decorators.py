"""
Common decorators for API endpoints.

This module provides reusable decorators for API endpoints to ensure
consistent behavior across all routes.
"""

from typing import Callable, TypeVar, Any
from functools import wraps
from fastapi import HTTPException, status

from app.core.logging import logger, get_correlation_id
from app.exceptions import NotFoundError, ValidationError

F = TypeVar('F', bound=Callable[..., Any])


def handle_not_found(resource_name: str = "Resource"):
    """
    Decorator to handle not found errors consistently.
    
    Args:
        resource_name: Name of the resource for error messages
        
    Usage:
        @router.get("/{id}")
        @handle_not_found("User")
        async def get_user(id: str):
            user = await get_user_by_id(id)
            if not user:
                raise NotFoundError(f"{resource_name} not found")
            return user
    """
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            try:
                result = await func(*args, **kwargs)
                if result is None:
                    raise NotFoundError(f"{resource_name} not found")
                return result
            except NotFoundError:
                raise
            except Exception as e:
                logger.error(
                    f"Error in {func.__name__}",
                    error_type=type(e).__name__,
                    error_message=str(e),
                    correlation_id=get_correlation_id()
                )
                raise
        
        return wrapper  # type: ignore
    
    return decorator


def validate_input(validator: Callable[[Any], bool], error_message: str = "Invalid input"):
    """
    Decorator to validate input before processing.
    
    Args:
        validator: Function that returns True if input is valid
        error_message: Error message if validation fails
        
    Usage:
        @router.post("/")
        @validate_input(lambda x: x > 0, "Value must be positive")
        async def create_item(value: int):
            ...
    """
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Validate all arguments
            for arg in args:
                if not validator(arg):
                    raise ValidationError(error_message)
            for key, value in kwargs.items():
                if not validator(value):
                    raise ValidationError(f"{key}: {error_message}")
            
            return await func(*args, **kwargs)
        
        return wrapper  # type: ignore
    
    return decorator


def cache_response(ttl: int = 300):
    """
    Decorator to cache API responses (placeholder for future implementation).
    
    Args:
        ttl: Time to live in seconds
        
    Note: This is a placeholder. Actual caching will be implemented in Phase 3.
    """
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # TODO: Implement caching in Phase 3
            return await func(*args, **kwargs)
        
        return wrapper  # type: ignore
    
    return decorator


def rate_limit(max_requests: int = 100, window_seconds: int = 60):
    """
    Decorator for endpoint-specific rate limiting (placeholder).
    
    Args:
        max_requests: Maximum requests per window
        window_seconds: Time window in seconds
        
    Note: Global rate limiting is handled by security middleware.
    This can be used for endpoint-specific limits.
    """
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # TODO: Implement endpoint-specific rate limiting if needed
            return await func(*args, **kwargs)
        
        return wrapper  # type: ignore
    
    return decorator

