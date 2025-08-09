"""
AI-powered candidate information extraction using OpenAI.

This module provides intelligent extraction of candidate information
from any PDF content, whether it's a formal resume or rough candidate data.
"""

import json
import re
from typing import Dict, Any, Optional, List
from loguru import logger
from app.core.config import settings
from app.services.openai_service import OpenAIService


class AIExtractor:
    """
    AI-powered extractor for candidate information from PDF content.
    
    Uses OpenAI to intelligently extract and format candidate data
    from any type of PDF content (resumes, rough information, etc.).
    """
    
    def __init__(self):
        self.openai_service = OpenAIService()
    
    async def extract_candidate_info(self, pdf_text: str, filename: str) -> Dict[str, Any]:
        """
        Extract candidate information using AI from any PDF content.
        
        Args:
            pdf_text: Raw text extracted from PDF
            filename: Original PDF filename
            
        Returns:
            Dict containing intelligently extracted candidate information
        """
        try:
            # Create a comprehensive prompt for AI extraction
            prompt = self._create_extraction_prompt(pdf_text, filename)
            
            # Get AI response using the correct method
            response = await self.openai_service._call_openai_api(prompt)
            
            if not response:
                logger.warning("AI extraction failed, falling back to basic extraction")
                return self._fallback_extraction(pdf_text)
            
            # Parse AI response
            extracted_data = self._parse_ai_response(response)
            
            # Clean and validate the extracted data
            cleaned_data = self._clean_extracted_data(extracted_data)
            
            logger.info(f"AI extraction completed for {filename}")
            return cleaned_data
            
        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return self._fallback_extraction(pdf_text)
    
    def _create_extraction_prompt(self, pdf_text: str, filename: str) -> str:
        """Create a comprehensive prompt for AI extraction."""
        
        return f"""
You are an expert at extracting candidate information from any type of PDF content. 
Extract all available candidate information from the following text and return it in JSON format.

PDF Filename: {filename}
Text Content:
{pdf_text}

Please extract the following information if available (return null for missing information):

1. **name**: Full name of the candidate
2. **email**: Email address
3. **phone**: Phone number (any format)
4. **location**: Current location (city, state, country)
5. **current_role**: Current job title/position
6. **experience_years**: Years of experience (numeric)
7. **education**: Highest education level or degree
8. **skills**: List of technical skills, programming languages, tools, etc.
9. **summary**: Brief professional summary (2-3 sentences)
10. **work_history**: List of recent work experiences (company, role, duration)
11. **projects**: Notable projects or achievements
12. **certifications**: Any certifications mentioned
13. **languages**: Programming languages or spoken languages
14. **interests**: Professional interests or hobbies (if relevant)

Guidelines:
- Be intelligent and context-aware
- Extract information even from rough or informal content
- For skills, include both technical and soft skills
- For experience, try to calculate total years from work history
- Clean and format the data appropriately
- If information is unclear or missing, return null
- Do not make up information - only extract what's actually present

Return the result as a valid JSON object with these exact field names.
"""
    
    def _parse_ai_response(self, response: str) -> Dict[str, Any]:
        """Parse the AI response and extract JSON data."""
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                json_str = json_match.group()
                return json.loads(json_str)
            
            # If no JSON found, try to parse the entire response
            return json.loads(response)
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            logger.debug(f"AI Response: {response}")
            return {}
    
    def _clean_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and validate the extracted data."""
        cleaned = {}
        
        # Clean each field
        for field, value in data.items():
            if value is not None and value != "" and value != "null":
                if isinstance(value, str):
                    # Clean string values
                    cleaned_value = value.strip()
                    if cleaned_value and cleaned_value.lower() not in ['null', 'none', 'n/a', 'unknown']:
                        cleaned[field] = cleaned_value
                elif isinstance(value, list):
                    # Clean list values - handle both strings and other types
                    cleaned_list = []
                    for item in value:
                        if item:
                            if isinstance(item, str):
                                item_str = item.strip()
                                if item_str:
                                    cleaned_list.append(item_str)
                            else:
                                cleaned_list.append(str(item).strip())
                    if cleaned_list:
                        cleaned[field] = cleaned_list
                elif isinstance(value, (int, float)):
                    # Keep numeric values
                    cleaned[field] = value
                else:
                    # Keep other valid values
                    cleaned[field] = value
        
        return cleaned
    
    def _fallback_extraction(self, pdf_text: str) -> Dict[str, Any]:
        """Fallback extraction using basic regex patterns."""
        extracted = {}
        
        # Basic email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, pdf_text)
        if email_match:
            extracted['email'] = email_match.group()
        
        # Basic phone extraction
        phone_patterns = [
            r'\+?[\d\s\-\(\)]{10,}',
            r'\(\d{3}\)\s*\d{3}-\d{4}',
            r'\d{3}-\d{3}-\d{4}',
            r'\d{10,}',
        ]
        for pattern in phone_patterns:
            phone_match = re.search(pattern, pdf_text)
            if phone_match:
                phone = phone_match.group().strip()
                phone = re.sub(r'[^\d\+]', '', phone)
                if len(phone) >= 10:
                    extracted['phone'] = phone
                    break
        
        # Basic skills extraction
        skills_keywords = [
            'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
            'angular', 'vue', 'php', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'r', 'matlab', 'excel', 'powerpoint', 'word'
        ]
        
        found_skills = []
        for skill in skills_keywords:
            if re.search(rf'\b{skill}\b', pdf_text, re.IGNORECASE):
                found_skills.append(skill.title())
        
        if found_skills:
            extracted['skills'] = found_skills
        
        return extracted


# Global instance
ai_extractor = AIExtractor() 