"""
Dependency Injection Container for the HR-AI application.

This module provides a centralized service container for managing
all service and repository instances with proper lifecycle management.
"""

from typing import Dict, Type, TypeVar, Optional, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.database import get_database
from app.core.logging import logger
from app.services.openai_service import OpenAIService, get_openai_service

# Type variable for generic service types
T = TypeVar('T')


class ServiceContainer:
    """
    Service container for dependency injection.
    
    This container manages the lifecycle of all services and repositories,
    ensuring they are properly initialized and can be reused across requests.
    """
    
    def __init__(self):
        """Initialize the service container."""
        self._services: Dict[Type, Any] = {}
        self._repositories: Dict[Type, Any] = {}
        self._database: Optional[AsyncIOMotorDatabase] = None
        self._openai_service: Optional[OpenAIService] = None
        self._initialized = False
    
    def initialize(self, database: AsyncIOMotorDatabase) -> None:
        """
        Initialize the container with required dependencies.
        
        Args:
            database: MongoDB database instance
        """
        self._database = database
        try:
            self._openai_service = get_openai_service()
        except Exception as e:
            logger.warning(f"OpenAI service not available: {e}")
            self._openai_service = None
        
        self._initialized = True
        logger.info("Service container initialized")
    
    def get_database(self) -> AsyncIOMotorDatabase:
        """Get the database instance."""
        if not self._database:
            from app.core.database import get_mongodb_database
            self._database = get_mongodb_database()
        return self._database
    
    def get_openai_service(self) -> Optional[OpenAIService]:
        """Get the OpenAI service instance."""
        if self._openai_service is None:
            try:
                self._openai_service = get_openai_service()
            except Exception as e:
                logger.warning(f"OpenAI service not available: {e}")
                return None
        return self._openai_service
    
    def register_repository(self, repository_class: Type[T], instance: T) -> None:
        """
        Register a repository instance.
        
        Args:
            repository_class: The repository class type
            instance: The repository instance
        """
        self._repositories[repository_class] = instance
        logger.debug(f"Registered repository: {repository_class.__name__}")
    
    def get_repository(self, repository_class: Type[T]) -> T:
        """
        Get a repository instance, creating it if necessary.
        
        Args:
            repository_class: The repository class type
            
        Returns:
            Repository instance
        """
        if repository_class not in self._repositories:
            # Create repository instance
            database = self.get_database()
            instance = repository_class(database)
            self._repositories[repository_class] = instance
            logger.debug(f"Created repository instance: {repository_class.__name__}")
        
        return self._repositories[repository_class]
    
    def register_service(self, service_class: Type[T], instance: T) -> None:
        """
        Register a service instance.
        
        Args:
            service_class: The service class type
            instance: The service instance
        """
        self._services[service_class] = instance
        logger.debug(f"Registered service: {service_class.__name__}")
    
    def get_service(self, service_class: Type[T]) -> T:
        """
        Get a service instance, creating it if necessary.
        
        Args:
            service_class: The service class type
            
        Returns:
            Service instance
        """
        if service_class not in self._services:
            # Service creation logic will be handled by specific getter functions
            # This is a fallback that should not normally be called
            raise ValueError(
                f"Service {service_class.__name__} not registered. "
                "Use specific getter functions from dependencies module."
            )
        
        return self._services[service_class]
    
    def clear(self) -> None:
        """Clear all registered services and repositories."""
        self._services.clear()
        self._repositories.clear()
        logger.debug("Service container cleared")


# Global service container instance
_container: Optional[ServiceContainer] = None


def get_container() -> ServiceContainer:
    """
    Get the global service container instance.
    
    Returns:
        ServiceContainer instance
    """
    global _container
    if _container is None:
        _container = ServiceContainer()
        # Initialize with database
        from app.core.database import get_mongodb_database
        _container.initialize(get_mongodb_database())
    return _container


def reset_container() -> None:
    """Reset the global container (useful for testing)."""
    global _container
    _container = None

