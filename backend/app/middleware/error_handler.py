"""
Error handling middleware for the AI Resume Analysis System.

This module provides centralized error handling, logging,
and standardized error responses.
"""

import traceback
from typing import Union, Dict, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy import exc as SQLAlchemyError
from pydantic import ValidationError
import json

from app.core.logging import logger, get_correlation_id, set_correlation_id
from app.core.config import settings


class ErrorHandler:
    """Centralized error handler for the application."""
    
    @staticmethod
    async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
        """Handle Pydantic validation errors."""
        correlation_id = set_correlation_id()
        
        error_details = []
        for error in exc.errors():
            error_details.append({
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        error_response = {
            "error": "Validation Error",
            "message": "Invalid request data",
            "details": error_details,
            "correlation_id": correlation_id,
            "path": request.url.path,
            "method": request.method
        }
        
        logger.error(
            "Validation error",
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            details=error_details
        )
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content=error_response
        )
    
    @staticmethod
    async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        """Handle HTTP exceptions."""
        correlation_id = set_correlation_id()
        
        error_response = {
            "error": "HTTP Error",
            "message": exc.detail,
            "status_code": exc.status_code,
            "correlation_id": correlation_id,
            "path": request.url.path,
            "method": request.method
        }
        
        logger.warning(
            "HTTP exception",
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            status_code=exc.status_code,
            detail=exc.detail
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    @staticmethod
    async def handle_database_error(request: Request, exc: SQLAlchemyError) -> JSONResponse:
        """Handle database errors."""
        correlation_id = set_correlation_id()
        
        error_response = {
            "error": "Database Error",
            "message": "An error occurred while accessing the database",
            "correlation_id": correlation_id,
            "path": request.url.path,
            "method": request.method
        }
        
        # Log the actual error for debugging
        logger.error(
            "Database error",
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            error_type=type(exc).__name__,
            error_message=str(exc),
            traceback=traceback.format_exc()
        )
        
        # In production, don't expose internal database errors
        if not settings.debug:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response
            )
        else:
            # In debug mode, include more details
            error_response.update({
                "debug_info": {
                    "error_type": type(exc).__name__,
                    "error_message": str(exc)
                }
            })
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response
            )
    
    @staticmethod
    async def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
        """Handle generic exceptions."""
        correlation_id = set_correlation_id()
        
        error_response = {
            "error": "Internal Server Error",
            "message": "An unexpected error occurred",
            "correlation_id": correlation_id,
            "path": request.url.path,
            "method": request.method
        }
        
        # Log the error with full traceback
        logger.error(
            "Unhandled exception",
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            error_type=type(exc).__name__,
            error_message=str(exc),
            traceback=traceback.format_exc()
        )
        
        # In production, don't expose internal errors
        if not settings.debug:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response
            )
        else:
            # In debug mode, include more details
            error_response.update({
                "debug_info": {
                    "error_type": type(exc).__name__,
                    "error_message": str(exc),
                    "traceback": traceback.format_exc()
                }
            })
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content=error_response
            )


class ErrorHandlingMiddleware:
    """Middleware for handling errors and adding correlation IDs."""
    
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # Set correlation ID for each request
            correlation_id = set_correlation_id()
            
            # Log incoming request
            logger.info(
                "Incoming request",
                correlation_id=correlation_id,
                method=scope["method"],
                path=scope["path"],
                client=scope.get("client", ("unknown", 0))[0]
            )
            
            # Create a custom receive function to capture request body
            async def receive_with_logging():
                message = await receive()
                if message["type"] == "http.request":
                    logger.debug(
                        "Request body received",
                        correlation_id=correlation_id,
                        body_size=len(message.get("body", b""))
                    )
                return message
            
            # Create a custom send function to capture response
            async def send_with_logging(message):
                if message["type"] == "http.response.start":
                    logger.info(
                        "Response sent",
                        correlation_id=correlation_id,
                        status_code=message["status"]
                    )
                await send(message)
            
            try:
                await self.app(scope, receive_with_logging, send_with_logging)
            except Exception as exc:
                # Handle exceptions at the middleware level
                logger.error(
                    "Middleware exception",
                    correlation_id=correlation_id,
                    error_type=type(exc).__name__,
                    error_message=str(exc),
                    traceback=traceback.format_exc()
                )
                raise
        else:
            await self.app(scope, receive, send)


def setup_error_handlers(app):
    """Setup error handlers for the FastAPI application."""
    
    # Add error handlers
    app.add_exception_handler(RequestValidationError, ErrorHandler.handle_validation_error)
    app.add_exception_handler(StarletteHTTPException, ErrorHandler.handle_http_exception)
    app.add_exception_handler(SQLAlchemyError, ErrorHandler.handle_database_error)
    app.add_exception_handler(Exception, ErrorHandler.handle_generic_exception)
    
    logger.info("Error handlers configured successfully")


class APIError(Exception):
    """Base class for API-specific errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = None,
        details: Dict[str, Any] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(APIError):
    """Raised when data validation fails."""
    
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details
        )


class NotFoundError(APIError):
    """Raised when a resource is not found."""
    
    def __init__(self, message: str, resource_type: str = None):
        details = {"resource_type": resource_type} if resource_type else {}
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            details=details
        )


class AuthenticationError(APIError):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="AUTHENTICATION_ERROR"
        )


class AuthorizationError(APIError):
    """Raised when authorization fails."""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="AUTHORIZATION_ERROR"
        )


class RateLimitError(APIError):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(
            message=message,
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            error_code="RATE_LIMIT_ERROR"
        ) 