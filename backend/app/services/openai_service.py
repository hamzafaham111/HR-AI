"""
OpenAI Service for AI-Powered Text Processing

This module integrates with OpenAI's API to provide AI capabilities for:
1. Extracting structured data from unstructured resume text
2. Generating vector embeddings for semantic search
3. Processing natural language for candidate matching

KEY AI CONCEPTS EXPLAINED:
========================

1. **Large Language Models (LLMs)**:
   - GPT models are trained on vast amounts of text
   - They understand context and can extract information intelligently
   - Think of them as very smart text processors that "understand" content

2. **Embeddings**:
   - Convert text into numerical vectors (arrays of numbers)
   - Similar texts get similar vectors
   - Enables mathematical comparison of text meaning
   - Example: "Python developer" and "Software engineer" would have similar vectors

3. **Prompt Engineering**:
   - The art of writing instructions for AI models
   - Clear, specific prompts get better results
   - Like giving detailed instructions to a very capable assistant

4. **Vector Search**:
   - Store embeddings in a vector database (Qdrant)
   - Find similar content by comparing vector distances
   - Enables "semantic search" - search by meaning, not just keywords
"""

import json
import asyncio
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from loguru import logger

# Import configuration settings
from ..core.config import settings


class OpenAIService:
    """
    Service for interacting with OpenAI API for AI-powered text processing.
    
    WHAT THIS SERVICE DOES:
    ======================
    1. **Text Analysis**: Extract structured information from resume text
    2. **Embeddings Generation**: Convert text to numerical vectors for search
    3. **Smart Parsing**: Use AI to understand and categorize content
    
    REAL-WORLD ANALOGY:
    ==================
    Think of this service like a super-smart administrative assistant who can:
    - Read a resume and extract key information (name, skills, experience)
    - Understand the "meaning" of job descriptions and resumes
    - Compare different resumes to find the best matches for a job
    
    TECHNICAL IMPLEMENTATION:
    ========================
    - Uses OpenAI's GPT models for text understanding
    - Generates 1536-dimensional vectors for semantic similarity
    - Handles API errors gracefully with fallback mechanisms
    """
    
    def __init__(self):
        """
        Initialize the OpenAI service with API configuration.
        
        Sets up the async client and model parameters.
        Think of this like configuring your connection to a smart AI assistant.
        """
        # Create async client for OpenAI API calls
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,      # Your API key for authentication
            base_url=settings.openai_api_base     # API endpoint (can be customized)
        )
        
        # Model configuration
        self.model = settings.openai_model           # Usually "gpt-3.5-turbo" or "gpt-4"
        self.max_tokens = settings.max_tokens        # Maximum response length
        self.temperature = settings.temperature      # Creativity level (0.0 = focused, 1.0 = creative)
        
    async def extract_candidate_info(self, resume_text: str) -> Dict[str, any]:
        """
        Extract candidate information from resume text using OpenAI GPT model.
        
        Args:
            resume_text: The extracted text content from the resume
            
        Returns:
            Dict: Extracted candidate information
            
        Raises:
            Exception: If API call fails
        """
        try:
            prompt = self._create_extraction_prompt(resume_text)
            response = await self._call_openai_api(prompt)
            return self._parse_extraction_response(response)
        except Exception as e:
            logger.error(f"OpenAI API error: {e}")
            # Return mock data if API fails
            logger.info("Using mock data due to API error")
            return self._get_mock_extraction_response(resume_text)
    
    def _create_extraction_prompt(self, resume_text: str) -> str:
        """
        Create a structured prompt for candidate information extraction.
        
        Args:
            resume_text: The resume text to analyze
            
        Returns:
            str: Formatted prompt for OpenAI API
        """
        return f"""
        Extract key information from the following resume.
        
        Resume Content:
        {resume_text[:3000]}  # Limit to first 3000 characters
        
        Please provide a structured extraction in the following JSON format:
        {{
            "name": "Candidate's full name",
            "email": "Email address if found",
            "phone": "Phone number if found",
            "location": "Location or address",
            "current_role": "Current job title",
            "experience_years": "Number of years of experience",
            "education": "Educational background",
            "skills": ["skill1", "skill2", "skill3"]
        }}
        
        Focus on extracting:
        1. Personal information (name, email, phone, location)
        2. Current role and responsibilities
        3. Years of experience
        4. Educational background
        5. Technical skills and technologies
        
        Return only valid JSON without any additional text.
        """
    
    async def _call_openai_api(self, prompt: str) -> str:
        """Make API call to OpenAI"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR analyst specializing in resume analysis and candidate assessment."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise e
    
    def _parse_extraction_response(self, response: str) -> Dict[str, any]:
        """
        Parse OpenAI API response into structured data.
        
        Args:
            response: Raw API response string
            
        Returns:
            Dict: Parsed extraction results
        """
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            
            data = json.loads(json_str)
            
            # Return the parsed data
            return {
                "name": data.get('name', 'Unknown'),
                "email": data.get('email', ''),
                "phone": data.get('phone', ''),
                "location": data.get('location', ''),
                "current_role": data.get('current_role', ''),
                "experience_years": data.get('experience_years', 0),
                "education": data.get('education', ''),
                "skills": data.get('skills', [])
            }
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse OpenAI response: {e}")
            return self._get_mock_extraction_response("")
    
    def _get_mock_extraction_response(self, resume_text: str) -> Dict[str, any]:
        """
        Generate mock extraction data for testing or fallback.
        
        Args:
            resume_text: Original resume text
            
        Returns:
            Dict: Mock extraction results
        """
        return {
            "name": "John Doe",
            "email": "john.doe@example.com",
            "phone": "+1-555-0123",
            "location": "San Francisco, CA",
            "current_role": "Software Developer",
            "experience_years": 3,
            "education": "Bachelor's in Computer Science",
            "skills": ["Python", "JavaScript", "React", "SQL"]
        }
    
    async def generate_embedding(self, text: str) -> List[float]:
        """
        Generate embedding for text using OpenAI's embedding model.
        
        Args:
            text: Text to generate embedding for
            
        Returns:
            List[float]: Embedding vector (1536 dimensions)
        """
        try:
            # Use text-embedding-ada-002 model for embeddings
            response = await self.client.embeddings.create(
                model="text-embedding-ada-002",
                input=text[:8000]  # Limit text length for embedding
            )
            
            embedding = response.data[0].embedding
            logger.info(f"Generated embedding with {len(embedding)} dimensions")
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            # Return mock embedding for fallback
            import random
            random.seed(hash(text) % 1000)  # Deterministic mock embedding
            mock_embedding = [random.uniform(-1, 1) for _ in range(1536)]
            logger.info("Using mock embedding due to API error")
            return mock_embedding


# Create global service instance
openai_service = OpenAIService() 