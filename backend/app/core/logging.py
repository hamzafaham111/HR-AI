"""
Structured logging configuration for the AI Resume Analysis System.

This module provides centralized logging with correlation IDs,
structured formatting, and proper log levels for different environments.
"""

import logging
import sys
from typing import Optional
from contextvars import ContextVar
import uuid
from loguru import logger
from app.core.config import settings

# Context variable for correlation ID
correlation_id: ContextVar[Optional[str]] = ContextVar('correlation_id', default=None)


class CorrelationFilter:
    """Filter to add correlation ID to log records."""
    
    def filter(self, record) -> bool:
        """Add correlation ID to log record."""
        try:
            if hasattr(record, 'correlation_id'):
                record.correlation_id = correlation_id.get()
            else:
                # For loguru records, add to extra
                if not hasattr(record, 'extra'):
                    record.extra = {}
                record.extra['correlation_id'] = correlation_id.get()
        except:
            pass
        return True


def setup_logging():
    """Setup structured logging configuration."""
    
    # Remove default loguru handler
    logger.remove()
    
    # Configure loguru with structured formatting and colors
    logger.configure(
        handlers=[
            {
                "sink": sys.stdout,
                "format": "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | <level>{message}</level>",
                "level": settings.log_level,
                "filter": CorrelationFilter().filter,
                "colorize": True,  # Enable color output for terminal
            },
            {
                "sink": "logs/app.log",
                "format": "{time} | {level} | {name}:{function}:{line} | {message}",
                "level": "INFO",
                "filter": CorrelationFilter().filter,
                "rotation": "10 MB",
                "retention": "30 days",
                "compression": "gz",
            },
            {
                "sink": "logs/error.log",
                "format": "{time} | {level} | {name}:{function}:{line} | {message}",
                "level": "ERROR",
                "filter": CorrelationFilter().filter,
                "rotation": "10 MB",
                "retention": "30 days",
                "compression": "gz",
            }
        ]
    )
    
    # Intercept standard library logging
    class InterceptHandler(logging.Handler):
        def emit(self, record):
            try:
                level = logger.level(record.levelname).name
            except ValueError:
                level = record.levelno
            
            frame, depth = logging.currentframe(), 2
            while frame.f_code.co_filename == logging.__file__:
                frame = frame.f_back
                depth += 1
            
            logger.opt(depth=depth, exception=record.exc_info).log(
                level, record.getMessage()
            )
    
    # Replace standard library logging with loguru
    logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)
    
    # Set specific loggers to use loguru
    for name in logging.root.manager.loggerDict.keys():
        logging.getLogger(name).handlers = []
        logging.getLogger(name).propagate = True


def get_correlation_id() -> Optional[str]:
    """Get current correlation ID."""
    return correlation_id.get()


def set_correlation_id(corr_id: Optional[str] = None) -> str:
    """Set correlation ID for current context."""
    if corr_id is None:
        corr_id = str(uuid.uuid4())
    correlation_id.set(corr_id)
    return corr_id


def log_with_context(message: str, level: str = "INFO", **kwargs):
    """Log message with additional context."""
    extra_fields = {
        "correlation_id": get_correlation_id(),
        **kwargs
    }
    
    log_func = getattr(logger, level.lower())
    log_func(message, extra=extra_fields)


class LoggerMixin:
    """Mixin to add logging capabilities to classes."""
    
    @property
    def logger(self):
        """Get logger instance for this class."""
        return logger.bind(
            class_name=self.__class__.__name__,
            correlation_id=get_correlation_id()
        )
    
    def log_info(self, message: str, **kwargs):
        """Log info message with context."""
        self.logger.info(message, **kwargs)
    
    def log_error(self, message: str, **kwargs):
        """Log error message with context."""
        self.logger.error(message, **kwargs)
    
    def log_warning(self, message: str, **kwargs):
        """Log warning message with context."""
        self.logger.warning(message, **kwargs)
    
    def log_debug(self, message: str, **kwargs):
        """Log debug message with context."""
        self.logger.debug(message, **kwargs)


# Initialize logging on module import
setup_logging()


def get_logger():
    """
    Get the configured logger instance.
    
    This function provides backward compatibility with the old logger.py module.
    
    Returns:
        Logger: The configured loguru logger instance
    """
    return logger 