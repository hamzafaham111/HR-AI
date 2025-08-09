"""
Qdrant vector database service for storing and retrieving resume embeddings.

This module handles all interactions with the Qdrant vector database,
including initialization, storing embeddings, and similarity search.
"""

from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from typing import List, Dict, Any, Optional
import numpy as np
import uuid
from datetime import datetime

from app.core.config import settings
from app.core.logger import logger


class QdrantService:
    """
    Service class for managing Qdrant vector database operations.
    
    This class handles:
    - Database initialization and connection
    - Storing resume embeddings
    - Retrieving similar resumes
    - Managing collections
    """
    
    def __init__(self):
        """Initialize the Qdrant service with client connection."""
        self.client = QdrantClient(
            host=settings.qdrant_host,
            port=settings.qdrant_port
        )
        self.collection_name = settings.qdrant_collection_name
        self.vector_size = settings.qdrant_vector_size
    
    async def init_collection(self):
        """
        Initialize the resume collection in Qdrant.
        
        Creates the collection if it doesn't exist and configures
        the vector parameters for storing resume embeddings.
        """
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                # Create new collection
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.vector_size,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created Qdrant collection: {self.collection_name}")
            else:
                logger.info(f"Qdrant collection already exists: {self.collection_name}")
                
        except Exception as e:
            logger.error(f"Failed to initialize Qdrant collection: {e}")
            raise
    
    async def store_resume_embedding(
        self,
        analysis_id: str,
        embedding: List[float],
        metadata: Dict[str, Any]
    ):
        """
        Store a resume embedding in the vector database.
        
        Args:
            analysis_id: Unique identifier for the analysis
            embedding: Vector embedding of the resume
            metadata: Additional metadata to store
        """
        try:
            # Convert string ID to UUID if it's not already a valid UUID
            import uuid
            try:
                point_id = uuid.UUID(analysis_id)
            except ValueError:
                # If not a valid UUID, create a hash-based UUID
                point_id = uuid.uuid5(uuid.NAMESPACE_DNS, analysis_id)
            
            point = PointStruct(
                id=str(point_id),
                vector=embedding,
                payload={
                    "analysis_id": analysis_id,
                    "upload_date": datetime.now().isoformat(),
                    **metadata
                }
            )
            
            self.client.upsert(
                collection_name=self.collection_name,
                points=[point]
            )
            
            logger.info(f"Stored resume embedding for analysis_id: {analysis_id}")
            
        except Exception as e:
            logger.error(f"Failed to store resume embedding: {e}")
            raise
    
    async def find_similar_resumes(
        self,
        embedding: List[float],
        limit: int = 5,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """
        Find similar resumes based on embedding similarity.
        
        Args:
            embedding: Query embedding to search for
            limit: Maximum number of results to return
            score_threshold: Minimum similarity score threshold
            
        Returns:
            List of similar resumes with their metadata and similarity scores
        """
        try:
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=embedding,
                limit=limit,
                score_threshold=score_threshold
            )
            
            similar_resumes = []
            for result in search_result:
                similar_resumes.append({
                    "analysis_id": result.payload.get("analysis_id"),
                    "similarity_score": result.score,
                    "metadata": result.payload
                })
            
            logger.info(f"Found {len(similar_resumes)} similar resumes")
            return similar_resumes
            
        except Exception as e:
            logger.error(f"Failed to find similar resumes: {e}")
            raise
    
    async def get_resume_by_id(self, analysis_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a specific resume by its analysis ID.
        
        Args:
            analysis_id: Unique identifier for the analysis
            
        Returns:
            Resume data if found, None otherwise
        """
        try:
            points = self.client.retrieve(
                collection_name=self.collection_name,
                ids=[analysis_id]
            )
            
            if points:
                point = points[0]
                return {
                    "analysis_id": point.payload.get("analysis_id"),
                    "embedding": point.vector,
                    "metadata": point.payload
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to retrieve resume by ID: {e}")
            raise
    
    async def delete_resume(self, analysis_id: str):
        """
        Delete a resume from the vector database.
        
        Args:
            analysis_id: Unique identifier for the analysis to delete
        """
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=[analysis_id]
            )
            
            logger.info(f"Deleted resume with analysis_id: {analysis_id}")
            
        except Exception as e:
            logger.error(f"Failed to delete resume: {e}")
            raise
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about the resume collection.
        
        Returns:
            Dictionary containing collection statistics
        """
        try:
            collection_info = self.client.get_collection(self.collection_name)
            
            stats = {
                "collection_name": self.collection_name,
                "vector_size": collection_info.config.params.vectors.size,
                "distance": collection_info.config.params.vectors.distance,
                "points_count": collection_info.points_count,
                "segments_count": collection_info.segments_count,
                "status": collection_info.status
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Failed to get collection stats: {e}")
            raise


# Global Qdrant service instance
qdrant_service = QdrantService()


async def init_qdrant():
    """Initialize the Qdrant service and collection."""
    await qdrant_service.init_collection() 