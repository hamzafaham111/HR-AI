"""
Job parsing service for extracting structured data from job postings.

This module provides parsing of job posting text to extract
structured data for job creation forms.
"""

import json
import asyncio
from typing import Dict, List, Optional
from app.core.logging import logger


class JobParserService:
    """
    Service for parsing job posting text to extract structured data.
    
    This service uses pattern matching and heuristics to parse job descriptions
    and extract all relevant fields for job creation.
    """
    
    def __init__(self):
        """Initialize the job parser service."""
        logger.info("Job parser service initialized (using fallback parsing)")
        
    async def parse_job_text(self, job_text: str) -> Dict:
        """
        Parse job posting text to extract structured data.
        
        Args:
            job_text: The raw job posting text
            
        Returns:
            Dict: Structured job data with all form fields
        """
        logger.info("Using fallback parsing for job text")
        return self._get_fallback_parsing(job_text)
    
    def _get_fallback_parsing(self, job_text: str) -> Dict:
        """
        Generate fallback parsing when AI parsing fails.
        
        This improved fallback uses pattern matching and heuristics to extract
        structured data from job posting text using pattern matching and heuristics.
        
        Args:
            job_text: Original job text
            
        Returns:
            Dict: Parsed job data
        """
        import re
        lines = [line.strip() for line in job_text.split('\n') if line.strip()] if job_text else []
        
        # Extract title - look for the first substantial line that looks like a job title
        title = ""
        skip_patterns = ['about the job', 'about', 'job posting', 'description', 'we are looking', 'looking for']
        title_keywords = ['developer', 'engineer', 'manager', 'analyst', 'designer', 'specialist', 
                         'coordinator', 'director', 'lead', 'senior', 'junior', 'architect', 
                         'consultant', 'executive', 'officer', 'assistant', 'associate', 'developer']
        
        for i, line in enumerate(lines[:15]):  # Check first 15 lines
            line_lower = line.lower().strip()
            # Skip common header patterns (only in first few lines)
            if i < 3 and any(pattern in line_lower for pattern in skip_patterns):
                continue
            # Look for lines that look like job titles
            if (len(line) < 120 and len(line) > 5 and 
                any(word in line_lower for word in title_keywords)):
                title = line.strip()
                break
        
        # If no good title found, use first non-empty line after skipping headers
        if not title:
            for i, line in enumerate(lines[1:6]):  # Check lines 2-6
                line_lower = line.lower().strip()
                if (line and len(line) < 120 and len(line) > 5 and
                    not any(pattern in line_lower for pattern in skip_patterns)):
                    title = line.strip()
                    break
            # Last resort: use first line if it exists and is reasonable
            if not title and lines:
                first_line = lines[0].strip()
                if first_line and len(first_line) < 120:
                    title = first_line
        
        # Extract location - look for "Location:" pattern
        location = ""
        location_patterns = [
            r'location:\s*(.+)',
            r'location\s*[:\-]\s*(.+)',
            r'(remote|hybrid|on-site|on site|onsite)',
        ]
        for line in lines[:20]:
            line_lower = line.lower()
            # Check for explicit location field
            if 'location' in line_lower:
                match = re.search(r'location\s*[:\-]\s*(.+)', line, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    break
            # Check for location keywords
            if any(keyword in line_lower for keyword in ['remote', 'hybrid', 'on-site', 'on site', 'onsite']):
                location = line.strip()
                break
        
        # Extract company name
        company = ""
        company_keywords = ['company', 'inc', 'corp', 'ltd', 'llc', 'technologies', 'systems', 'solutions']
        for line in lines[:15]:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in company_keywords):
                # Skip if it's just a label
                if ':' not in line or not any(keyword in line_lower.split(':')[0] for keyword in ['company', 'about']):
                    company = line.strip()
                    break
        
        # Extract experience level from title and text
        experience_level = "mid"
        title_lower = title.lower()
        text_lower = job_text.lower()
        
        if any(word in title_lower for word in ['senior', 'lead', 'principal', 'architect', 'staff']):
            experience_level = "senior"
        elif any(word in title_lower for word in ['junior', 'entry', 'associate', 'intern']):
            experience_level = "junior"
        elif any(word in title_lower for word in ['intern', 'internship']):
            experience_level = "entry"
        elif any(word in title_lower for word in ['executive', 'director', 'vp', 'vice president', 'chief']):
            experience_level = "executive"
        
        # Also check text for experience requirements
        if '6+' in text_lower or '5+' in text_lower or 'years' in text_lower:
            if 'senior' in text_lower or 'lead' in text_lower:
                experience_level = "senior"
        
        # Extract job type
        job_type = "full_time"
        text_lower = job_text.lower()
        if 'part-time' in text_lower or 'part time' in text_lower:
            job_type = "part_time"
        elif 'contract' in text_lower and 'full-time' not in text_lower:
            job_type = "contract"
        elif 'intern' in text_lower or 'internship' in text_lower:
            job_type = "internship"
        elif 'freelance' in text_lower or 'freelancer' in text_lower:
            job_type = "freelance"
        elif 'full-time' in text_lower or 'full time' in text_lower:
            job_type = "full_time"
        
        # Extract salary range
        salary_range = ""
        salary_patterns = [
            r'\$[\d,]+(?:\s*-\s*\$[\d,]+)?',
            r'USD\s*[\d,]+',
            r'[\d,]+\s*USD',
            r'salary[:\s]+([\d,\$\.\-\s]+)',
        ]
        for pattern in salary_patterns:
            match = re.search(pattern, job_text, re.IGNORECASE)
            if match:
                salary_range = match.group(0).strip()
                break
        
        # Extract requirements (look for "Required Skills", "Requirements", etc.)
        requirements = []
        in_requirements_section = False
        requirement_keywords = ['required', 'skills', 'qualifications', 'must have', 'requirements']
        
        for line in lines:
            line_lower = line.lower()
            # Detect requirements section
            if any(keyword in line_lower for keyword in ['required skills', 'requirements', 'qualifications', 'must have']):
                in_requirements_section = True
                continue
            # Stop at next major section
            if in_requirements_section and any(keyword in line_lower for keyword in ['responsibilities', 'benefits', 'compensation', 'about the role', 'nice to have']):
                break
            # Extract requirements
            if in_requirements_section and line and len(line) > 10:
                # Check if it's a bullet point or list item
                if line.startswith(('-', '•', '*', '·')) or re.match(r'^\d+[\.\)]', line):
                    skill = line.lstrip('- •*·0123456789.) ').strip()
                    if skill:
                        requirements.append({"skill": skill, "level": "required"})
                elif 'years' in line_lower or any(tech in line_lower for tech in ['experience', 'knowledge', 'proficiency', 'familiarity']):
                    requirements.append({"skill": line.strip(), "level": "required"})
        
        # Extract responsibilities
        responsibilities = []
        in_responsibilities_section = False
        responsibility_keywords = ['responsibilities', 'duties', 'key responsibilities', 'what you', 'you will']
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in responsibility_keywords):
                in_responsibilities_section = True
                continue
            if in_responsibilities_section and any(keyword in line_lower for keyword in ['requirements', 'benefits', 'compensation', 'nice to have']):
                break
            if in_responsibilities_section and line and len(line) > 10:
                if line.startswith(('-', '•', '*', '·')) or re.match(r'^\d+[\.\)]', line):
                    resp = line.lstrip('- •*·0123456789.) ').strip()
                    if resp:
                        responsibilities.append(resp)
        
        # Extract benefits
        benefits = []
        in_benefits_section = False
        benefit_keywords = ['benefits', 'perks', 'compensation', 'we offer', 'what we offer']
        
        for line in lines:
            line_lower = line.lower()
            if any(keyword in line_lower for keyword in benefit_keywords):
                in_benefits_section = True
                continue
            if in_benefits_section and line and len(line) > 5:
                if line.startswith(('-', '•', '*', '·')) or re.match(r'^\d+[\.\)]', line):
                    benefit = line.lstrip('- •*·0123456789.) ').strip()
                    if benefit and len(benefit) > 3:
                        benefits.append(benefit)
        
        # Clean up location - remove "Location:" prefix if present
        if location:
            location = re.sub(r'^location\s*[:\-]\s*', '', location, flags=re.IGNORECASE).strip()
        
        # Use full text as description if we don't have a good one
        description = job_text if job_text else ""
        
        return {
            "title": title,
            "company": company,
            "location": location,
            "job_type": job_type,
            "experience_level": experience_level,
            "description": description,
            "salary_range": salary_range,
            "requirements": requirements,
            "responsibilities": responsibilities,
            "benefits": benefits
        }


# Create global service instance
job_parser_service = JobParserService() 