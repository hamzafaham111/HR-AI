"""
AI-powered job parsing service using OpenAI.

This module provides intelligent parsing of job posting text to extract
structured data for job creation forms.
"""

import json
import asyncio
from typing import Dict, List, Optional
from openai import AsyncOpenAI
from loguru import logger

from ..core.config import settings


class JobParserService:
    """
    Service for parsing job posting text using AI to extract structured data.
    
    This service uses OpenAI's GPT models to intelligently parse job descriptions
    and extract all relevant fields for job creation.
    """
    
    def __init__(self):
        """Initialize the job parser service with OpenAI configuration."""
        self.client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_api_base
        )
        self.model = settings.openai_model
        self.max_tokens = settings.max_tokens
        self.temperature = settings.temperature
        
    async def parse_job_text(self, job_text: str) -> Dict:
        """
        Parse job posting text using AI to extract structured data.
        
        Args:
            job_text: The raw job posting text
            
        Returns:
            Dict: Structured job data with all form fields
        """
        try:
            prompt = self._create_parsing_prompt(job_text)
            response = await self._call_openai_api(prompt)
            return self._parse_response(response)
        except Exception as e:
            logger.error(f"Job parsing API error: {e}")
            # Return basic parsed data if API fails
            return self._get_fallback_parsing(job_text)
    
    def _create_parsing_prompt(self, job_text: str) -> str:
        """
        Create a structured prompt for job text parsing.
        
        Args:
            job_text: The job posting text to parse
            
        Returns:
            str: Formatted prompt for OpenAI API
        """
        return f"""
        Analyze the following job posting and extract all relevant information in a structured format.
        
        Job Posting Text:
        {job_text[:4000]}  # Limit to first 4000 characters
        
        Please extract and structure the following information in JSON format:
        {{
            "title": "Job title (e.g., 'Senior Software Engineer')",
            "company": "Company name",
            "location": "Job location (city, state, or remote)",
            "job_type": "full_time, part_time, contract, internship, or freelance",
            "experience_level": "entry, junior, mid, senior, or executive",
            "description": "Detailed job description (2-3 paragraphs)",
            "salary_range": "Salary range if mentioned (e.g., '$80,000 - $120,000')",
            "requirements": [
                {{
                    "skill": "Required skill or qualification",
                    "level": "required, preferred, or nice_to_have"
                }}
            ],
            "responsibilities": [
                "Key responsibility or duty"
            ],
            "benefits": [
                "Benefit or perk offered"
            ]
        }}
        
        Guidelines for extraction:
        1. **Title**: Extract the main job title, not department or team names
        2. **Company**: Look for company name in headers, signatures, or context
        3. **Location**: Include city/state or specify "Remote" if mentioned
        4. **Job Type**: Infer from keywords like "full-time", "part-time", "contract"
        5. **Experience Level**: Determine from requirements and job description
        6. **Description**: Create a comprehensive description based on the posting
        7. **Salary**: Extract if mentioned, otherwise null
        8. **Requirements**: List specific skills, technologies, and qualifications
        9. **Responsibilities**: List main duties and expectations
        10. **Benefits**: Extract perks, insurance, time-off, etc.
        
        For experience level mapping:
        - entry: 0-1 years, recent graduates
        - junior: 1-3 years experience
        - mid: 3-5 years experience
        - senior: 5+ years experience, leadership
        - executive: 10+ years, management roles
        
        For job type mapping:
        - full_time: permanent, salaried positions
        - part_time: reduced hours, flexible schedules
        - contract: temporary, project-based
        - internship: student positions
        - freelance: independent contractor
        
        Return only valid JSON without any additional text or explanations.
        """
    
    async def _call_openai_api(self, prompt: str) -> str:
        """Make API call to OpenAI for job parsing"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are an expert HR professional specializing in job posting analysis and data extraction. You excel at parsing job descriptions and extracting structured information accurately."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=self.max_tokens,
                temperature=self.temperature
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI API call failed for job parsing: {e}")
            raise e
    
    def _parse_response(self, response: str) -> Dict:
        """
        Parse OpenAI API response into structured job data.
        
        Args:
            response: Raw API response string
            
        Returns:
            Dict: Parsed job data
        """
        try:
            # Extract JSON from response
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            json_str = response[json_start:json_end]
            
            data = json.loads(json_str)
            
            # Ensure all required fields are present
            parsed_data = {
                "title": data.get("title", ""),
                "company": data.get("company", ""),
                "location": data.get("location", ""),
                "job_type": data.get("job_type", "full_time"),
                "experience_level": data.get("experience_level", "mid"),
                "description": data.get("description", ""),
                "salary_range": data.get("salary_range", ""),
                "requirements": data.get("requirements", []),
                "responsibilities": data.get("responsibilities", []),
                "benefits": data.get("benefits", [])
            }
            
            logger.info(f"Successfully parsed job data: {parsed_data['title']} at {parsed_data['company']}")
            return parsed_data
            
        except (json.JSONDecodeError, KeyError) as e:
            logger.error(f"Failed to parse job parsing response: {e}")
            return self._get_fallback_parsing("")
    
    def _get_fallback_parsing(self, job_text: str) -> Dict:
        """
        Generate fallback parsing when AI parsing fails.
        
        Args:
            job_text: Original job text
            
        Returns:
            Dict: Basic parsed job data
        """
        # Simple fallback parsing
        lines = job_text.split('\n') if job_text else []
        
        # Extract title from first line
        title = lines[0].strip() if lines else ""
        
        # Try to extract company from text
        company = ""
        for line in lines[:10]:  # Check first 10 lines
            if any(keyword in line.lower() for keyword in ['company', 'inc', 'corp', 'ltd', 'llc']):
                company = line.strip()
                break
        
        # Try to extract location
        location = ""
        for line in lines[:10]:
            if any(keyword in line.lower() for keyword in ['location', 'remote', 'hybrid', 'on-site']):
                location = line.strip()
                break
        
        # Determine experience level from title
        experience_level = "mid"
        if any(word in title.lower() for word in ['senior', 'lead', 'principal']):
            experience_level = "senior"
        elif any(word in title.lower() for word in ['junior', 'entry', 'associate']):
            experience_level = "junior"
        elif any(word in title.lower() for word in ['intern', 'internship']):
            experience_level = "entry"
        
        # Determine job type
        job_type = "full_time"
        if any(word in job_text.lower() for word in ['part-time', 'part time', 'contract', 'freelance']):
            job_type = "part_time"
        elif 'contract' in job_text.lower():
            job_type = "contract"
        elif 'intern' in job_text.lower():
            job_type = "internship"
        
        return {
            "title": title,
            "company": company,
            "location": location,
            "job_type": job_type,
            "experience_level": experience_level,
            "description": job_text[:500] if job_text else "",  # First 500 chars as description
            "salary_range": "",
            "requirements": [],
            "responsibilities": [],
            "benefits": []
        }


# Create global service instance
job_parser_service = JobParserService() 