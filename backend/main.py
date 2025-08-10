"""
Main FastAPI application entry point for the AI Resume Analysis System.

This module initializes the FastAPI application, configures CORS,
and includes all API routes for resume analysis functionality.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Import API routes
from app.api.dashboard import router as dashboard_router
from app.api.jobs import router as jobs_router
from app.api.resume_bank import router as resume_bank_router
from app.api.auth import router as auth_router
from app.api.hiring_processes import router as hiring_processes_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI application."""
    # Startup
    logger.info("Starting AI Resume Management API...")
    
    # Initialize MongoDB
    try:
        await db.connect_to_mongo()
        logger.info("MongoDB initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize MongoDB: {e}")
        raise
    
    # Initialize Qdrant vector database
    try:
        from app.services.qdrant_service import init_qdrant
        await init_qdrant()
        logger.info("Qdrant vector database initialized successfully")
    except Exception as e:
        logger.warning(f"Failed to initialize Qdrant: {e}")
        logger.info("System will work without vector database for basic functionality")
    
    logger.info("AI Resume Management API started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down AI Resume Management API...")
    await db.close_mongo_connection()
from app.core.config import settings
from app.core.logging import logger, setup_logging
from app.core.database import db

# Import middleware and error handling
# from app.middleware.error_handler import setup_error_handlers
# from app.middleware.security import setup_security_middleware

# Load environment variables
load_dotenv()

# Create FastAPI application instance
app = FastAPI(
    title="HR API",
    description="A production-ready HR management system for storing and matching resumes with job opportunities.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Setup error handlers and middleware
# setup_error_handlers(app)

# Configure CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://127.0.0.1:3000",
        "http://localhost:5173",  # Vite development server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])
app.include_router(jobs_router, prefix="/api/v1/jobs", tags=["Job Management"])
app.include_router(resume_bank_router, prefix="/api/v1/resume-bank", tags=["Resume Bank"])
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(hiring_processes_router, prefix="/api/v1", tags=["Hiring Processes"])

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Health check endpoint to verify the API is running.
    
    Returns:
        dict: Status information about the API
    """
    return {
        "status": "healthy",
        "message": "AI Resume Management API is running",
        "version": "1.0.0"
    }

# Root endpoint
@app.get("/")
async def root():
    """
    Root endpoint providing basic API information.
    
    Returns:
        dict: API information and available endpoints
    """
    return {
        "message": "Welcome to AI Resume Management API",
        "docs": "/docs",
        "health": "/health",
        "endpoints": {
            "resume_bank": "/api/v1/resume-bank",
            "dashboard": "/api/v1/dashboard"
        }
    }

# Removed deprecated on_event handlers - using lifespan context manager instead

if __name__ == "__main__":
    import uvicorn
    
    # Run the application with uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 