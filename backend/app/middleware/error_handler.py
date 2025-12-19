"""
Error handling middleware for the AI Resume Analysis System.

This module provides centralized error handling, logging,
and standardized error responses.
"""

import traceback
from typing import Dict, Any
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from pymongo import errors as MongoErrors
from pymongo.errors import PyMongoError

from app.core.logging import logger, get_correlation_id, set_correlation_id
from app.core.config import settings
from app.exceptions import BaseAPIException


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
    async def handle_database_error(request: Request, exc: PyMongoError) -> JSONResponse:
        """Handle MongoDB database errors."""
        correlation_id = set_correlation_id()
        
        # Determine appropriate status code based on error type
        if isinstance(exc, MongoErrors.DuplicateKeyError):
            status_code = status.HTTP_409_CONFLICT
            error_message = "A resource with this identifier already exists"
        elif isinstance(exc, MongoErrors.OperationFailure):
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            error_message = "Database operation failed"
        elif isinstance(exc, MongoErrors.ServerSelectionTimeoutError):
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            error_message = "Database connection timeout"
        else:
            status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
            error_message = "An error occurred while accessing the database"
        
        error_response = {
            "error": "DATABASE_ERROR",
            "message": error_message,
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
                status_code=status_code,
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
                status_code=status_code,
                content=error_response
            )
    
    @staticmethod
    async def handle_api_exception(request: Request, exc: BaseAPIException) -> JSONResponse:
        """Handle custom API exceptions."""
        correlation_id = set_correlation_id()
        
        error_response = exc.to_dict()
        error_response["correlation_id"] = correlation_id
        error_response["path"] = request.url.path
        error_response["method"] = request.method
        
        logger.warning(
            "API exception",
            correlation_id=correlation_id,
            path=request.url.path,
            method=request.method,
            error_code=exc.error_code,
            message=exc.message
        )
        
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response
        )
    
    @staticmethod
    async def handle_generic_exception(request: Request, exc: Exception) -> JSONResponse:
        """Handle generic exceptions."""
        correlation_id = set_correlation_id()
        
        error_response = {
            "error": "INTERNAL_SERVER_ERROR",
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
    
    # Add error handlers in order of specificity (most specific first)
    # Custom API exceptions (most specific)
    app.add_exception_handler(BaseAPIException, ErrorHandler.handle_api_exception)
    
    # Pydantic validation errors
    app.add_exception_handler(RequestValidationError, ErrorHandler.handle_validation_error)
    
    # HTTP exceptions (FastAPI/Starlette)
    app.add_exception_handler(StarletteHTTPException, ErrorHandler.handle_http_exception)
    
    # MongoDB database errors
    app.add_exception_handler(PyMongoError, ErrorHandler.handle_database_error)
    
    # Generic exceptions (catch-all, must be last)
    app.add_exception_handler(Exception, ErrorHandler.handle_generic_exception)
    
    logger.info("Error handlers configured successfully") 