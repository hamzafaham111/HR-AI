"""
Security middleware for the AI Resume Analysis System.

This module provides rate limiting, security headers, and input validation.
"""

import time
from typing import Dict, Set
from collections import defaultdict
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import re

from app.core.logging import logger, get_correlation_id
from app.core.config import settings


# Rate limiter instance
limiter = Limiter(key_func=get_remote_address)

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


class SecurityMiddleware:
    """Security middleware for request validation and rate limiting."""
    
    def __init__(self, app):
        self.app = app
        self.rate_limit_window = 60  # 1 minute
        self.max_requests_per_window = 100
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            request = Request(scope, receive)
            
            # Get client IP
            client_ip = self.get_client_ip(request)
            
            # Check rate limiting
            if not self.check_rate_limit(client_ip):
                await self.send_rate_limit_response(send)
                return
            
            # Validate request
            if not self.validate_request(request):
                await self.send_validation_error_response(send)
                return
            
            # Add security headers
            await self.add_security_headers(scope, receive, send)
        else:
            await self.app(scope, receive, send)
    
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
    
    def check_rate_limit(self, client_ip: str) -> bool:
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
                correlation_id=get_correlation_id(),
                client_ip=client_ip,
                count=request_counts[client_ip]["count"]
            )
            return False
        
        return True
    
    def validate_request(self, request: Request) -> bool:
        """Validate request for security threats."""
        # Check URL for SQL injection
        if self.contains_sql_injection(request.url.path):
            logger.warning(
                "SQL injection attempt detected in URL",
                correlation_id=get_correlation_id(),
                client_ip=self.get_client_ip(request),
                url=request.url.path
            )
            return False
        
        # Check query parameters
        for param_name, param_value in request.query_params.items():
            if self.contains_sql_injection(str(param_value)):
                logger.warning(
                    "SQL injection attempt detected in query parameter",
                    correlation_id=get_correlation_id(),
                    client_ip=self.get_client_ip(request),
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
    
    async def send_rate_limit_response(self, send):
        """Send rate limit exceeded response."""
        response = JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={
                "error": "Rate Limit Exceeded",
                "message": "Too many requests. Please try again later.",
                "retry_after": 60
            }
        )
        await send({
            "type": "http.response.start",
            "status": response.status_code,
            "headers": response.headers.raw
        })
        await send({
            "type": "http.response.body",
            "body": response.body
        })
    
    async def send_validation_error_response(self, send):
        """Send validation error response."""
        response = JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Invalid Request",
                "message": "Request contains invalid or malicious content."
            }
        )
        await send({
            "type": "http.response.start",
            "status": response.status_code,
            "headers": response.headers.raw
        })
        await send({
            "type": "http.response.body",
            "body": response.body
        })
    
    async def add_security_headers(self, scope, receive, send):
        """Add security headers to responses."""
        async def send_with_headers(message):
            if message["type"] == "http.response.start":
                # Add security headers
                headers = list(message.get("headers", []))
                headers.extend([
                    (b"X-Content-Type-Options", b"nosniff"),
                    (b"X-Frame-Options", b"DENY"),
                    (b"X-XSS-Protection", b"1; mode=block"),
                    (b"Strict-Transport-Security", b"max-age=31536000; includeSubDomains"),
                    (b"Content-Security-Policy", b"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"),
                    (b"Referrer-Policy", b"strict-origin-when-cross-origin"),
                    (b"Permissions-Policy", b"geolocation=(), microphone=(), camera=()"),
                ])
                message["headers"] = headers
            await send(message)
        
        await self.app(scope, receive, send_with_headers)


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


def setup_security_middleware(app):
    """Setup security middleware for the FastAPI application."""
    app.add_middleware(SecurityMiddleware)
    logger.info("Security middleware configured successfully") 