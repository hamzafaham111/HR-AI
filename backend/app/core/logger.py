"""
Logging configuration for the AI Resume Analysis System.

This module configures structured logging using loguru for
better debugging and monitoring capabilities.
"""

import sys
import os
from loguru import logger
from pathlib import Path


def setup_logger():
    """
    Configure the application logger with structured logging.
    
    This function sets up loguru logger with:
    - Console output for development
    - File output for production
    - Structured JSON logging
    - Different log levels for different environments
    """
    
    # Remove default logger
    logger.remove()
    
    # Get log level from environment
    log_level = os.getenv("LOG_LEVEL", "INFO")
    
    # Console logging format
    console_format = (
        "<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
        "<level>{level: <8}</level> | "
        "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
        "<level>{message}</level>"
    )
    
    # File logging format (JSON for structured logging)
    file_format = (
        '{{"time": "{time:YYYY-MM-DD HH:mm:ss}", '
        '"level": "{level}", '
        '"name": "{name}", '
        '"function": "{function}", '
        '"line": {line}, '
        '"message": "{message}"}}'
    )
    
    # Add console handler
    logger.add(
        sys.stdout,
        format=console_format,
        level=log_level,
        colorize=True,
        backtrace=True,
        diagnose=True
    )
    
    # Create logs directory if it doesn't exist
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    # Add file handler for all logs
    logger.add(
        logs_dir / "app.log",
        format=file_format,
        level=log_level,
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True
    )
    
    # Add file handler for errors only
    logger.add(
        logs_dir / "error.log",
        format=file_format,
        level="ERROR",
        rotation="10 MB",
        retention="30 days",
        compression="zip",
        backtrace=True,
        diagnose=True
    )


# Setup logger when module is imported
setup_logger()


def get_logger():
    """
    Get the configured logger instance.
    
    Returns:
        Logger: The configured loguru logger instance
    """
    return logger 