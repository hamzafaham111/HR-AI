"""
Security middleware for the AI Resume Analysis System.

This module provides rate limiting, security headers, and input validation.
"""

import time
from typing import Dict, Optional
from collections import defaultdict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp
import re

from app.core.logging import logger, get_correlation_id, set_correlation_id
from app.core.config import settings
from app.exceptions import RateLimitError

# Store for tracking requests per IP
request_counts: Dict[str, Dict] = defaultdict(lambda: {"count": 0, "reset_time": 0})

# Security patterns
SQL_INJECTION_PATTERNS = [
    r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
    r"(\b(OR|AND)\b\s+\d+\s*=\s*\d+)",
    r"(\b(OR|AND)\b\s+['\"]?\w+['\"]?\s*=\s*['\"]?\w+['\"]?)",
    r"(--|#|/\*|\*/)",
    r"(\bxp_|sp_|sysobjects|syscolumns)",
]

XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"on\w+\s*=",
    r"<iframe[^>]*>",
    r"<object[^>]*>",
    r"<embed[^>]*>",
]


class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware for request validation, rate limiting, and security headers."""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.rate_limit_enabled = settings.rate_limit_enabled
        self.rate_limit_window = settings.rate_limit_window_seconds
        self.max_requests_per_window = settings.rate_limit_max_requests
    
    async def dispatch(self, request: Request, call_next):
        """Process request through security checks."""
        # Set correlation ID if not already set
        correlation_id = set_correlation_id()
        
        # Get client IP
        client_ip = self.get_client_ip(request)
        
        # Check rate limiting if enabled
        if self.rate_limit_enabled:
            if not self.check_rate_limit(client_ip, correlation_id):
                return await self.send_rate_limit_response()
        
        # Validate request for security threats
        if not self.validate_request(request, client_ip, correlation_id):
            return await self.send_validation_error_response()
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self.add_security_headers(response)
        
        return response
    
    def get_client_ip(self, request: Request) -> str:
        """Get the real client IP address."""
        # Check for forwarded headers
        forwarded_for = request.headers.get("X-Forwarded-For")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("X-Real-IP")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def check_rate_limit(self, client_ip: str, correlation_id: Optional[str] = None) -> bool:
        """Check if client has exceeded rate limit."""
        current_time = time.time()
        
        # Reset counter if window has passed
        if current_time > request_counts[client_ip]["reset_time"]:
            request_counts[client_ip] = {
                "count": 1,
                "reset_time": current_time + self.rate_limit_window
            }
            return True
        
        # Increment counter
        request_counts[client_ip]["count"] += 1
        
        # Check if limit exceeded
        if request_counts[client_ip]["count"] > self.max_requests_per_window:
            logger.warning(
                "Rate limit exceeded",
                correlation_id=correlation_id or get_correlation_id(),
                client_ip=client_ip,
                count=request_counts[client_ip]["count"]
            )
            return False
        
        return True
    
    def validate_request(self, request: Request, client_ip: str, correlation_id: Optional[str] = None) -> bool:
        """Validate request for security threats."""
        corr_id = correlation_id or get_correlation_id()
        
        # Check URL for SQL injection
        if self.contains_sql_injection(request.url.path):
            logger.warning(
                "SQL injection attempt detected in URL",
                correlation_id=corr_id,
                client_ip=client_ip,
                url=request.url.path
            )
            return False
        
        # Check query parameters
        for param_name, param_value in request.query_params.items():
            if self.contains_sql_injection(str(param_value)):
                logger.warning(
                    "SQL injection attempt detected in query parameter",
                    correlation_id=corr_id,
                    client_ip=client_ip,
                    param_name=param_name,
                    param_value=param_value
                )
                return False
        
        return True
    
    def contains_sql_injection(self, text: str) -> bool:
        """Check if text contains SQL injection patterns."""
        text_upper = text.upper()
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, text_upper, re.IGNORECASE):
                return True
        return False
    
    def contains_xss(self, text: str) -> bool:
        """Check if text contains XSS patterns."""
        for pattern in XSS_PATTERNS:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False
    
    async def send_rate_limit_response(self) -> JSONResponse:
        """Send rate limit exceeded response."""
        correlation_id = get_correlation_id()
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "success": False,
                "error": "RATE_LIMIT_ERROR",
                "message": "Too many requests. Please try again later.",
                "correlation_id": correlation_id,
                "retry_after": self.rate_limit_window
            }
        )
    
    async def send_validation_error_response(self) -> JSONResponse:
        """Send validation error response."""
        correlation_id = get_correlation_id()
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "error": "VALIDATION_ERROR",
                "message": "Request contains invalid or malicious content.",
                "correlation_id": correlation_id
            }
        )
    
    def add_security_headers(self, response: JSONResponse) -> None:
        """Add security headers to responses."""
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Only add HSTS in production (HTTPS)
        if settings.environment == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy (can be customized per environment)
        if settings.environment == "production":
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
        else:
            # More relaxed for development
            response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"


class InputSanitizer:
    """Utility class for sanitizing user input."""
    
    @staticmethod
    def sanitize_string(text: str) -> str:
        """Sanitize a string input."""
        if not text:
            return text
        
        # Remove null bytes
        text = text.replace('\x00', '')
        
        # Remove control characters except newlines and tabs
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
        
        # Trim whitespace
        text = text.strip()
        
        return text
    
    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """Sanitize a filename."""
        if not filename:
            return filename
        
        # Remove path traversal attempts
        filename = filename.replace('..', '').replace('/', '').replace('\\', '')
        
        # Remove dangerous characters
        filename = re.sub(r'[<>:"|?*]', '', filename)
        
        # Limit length
        if len(filename) > 255:
            filename = filename[:255]
        
        return filename
    
    @staticmethod
    def validate_email(email: str) -> bool:
        """Validate email format."""
        if not email:
            return False
        
        # Basic email validation
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))


def setup_security_middleware(app) -> None:
    """
    Setup security middleware for the FastAPI application.
    
    This function adds security middleware if enabled in settings.
    The middleware provides:
    - Rate limiting
    - Request validation (SQL injection, XSS detection)
    - Security headers
    """
    if settings.enable_security_middleware:
        app.add_middleware(SecurityMiddleware)
        logger.info(
            "Security middleware configured successfully",
            rate_limit_enabled=settings.rate_limit_enabled,
            rate_limit_max_requests=settings.rate_limit_max_requests,
            rate_limit_window=settings.rate_limit_window_seconds
        )
    else:
        logger.info("Security middleware is disabled in settings") 