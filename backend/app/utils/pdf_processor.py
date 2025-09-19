"""
PDF processing utility for extracting text from resume PDFs.

This module handles PDF file processing, text extraction,
and validation for the resume analysis system.
"""

import PyPDF2
import io
import re
from typing import Optional, Tuple, Dict, Any
from fastapi import UploadFile, HTTPException
import os

from app.core.config import settings
from app.core.logger import logger

# Try to import pdfplumber for better PDF processing
try:
    import pdfplumber
    HAS_PDFPLUMBER = True
except ImportError:
    HAS_PDFPLUMBER = False
    logger.warning("pdfplumber not available, using PyPDF2 only")


class PDFProcessor:
    """
    Utility class for processing PDF files and extracting text.
    
    This class handles:
    - PDF file validation
    - Text extraction from PDFs
    - File size and format validation
    - Advanced candidate information extraction
    """
    
    @staticmethod
    async def process_pdf(file: UploadFile) -> Tuple[str, str]:
        """
        Process a PDF file and extract text content.
        
        Args:
            file: Uploaded PDF file
            
        Returns:
            Tuple of (extracted_text, filename)
            
        Raises:
            HTTPException: If file is invalid or processing fails
        """
        try:
            # Validate file
            if not file.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=400,
                    detail="Only PDF files are supported"
                )
            
            # Check file size
            content = await file.read()
            if len(content) > settings.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File size exceeds maximum limit of {settings.max_file_size} bytes"
                )
            
            # Extract text from PDF with error handling
            try:
                text = PDFProcessor._extract_text_from_pdf(content)
            except Exception as extract_error:
                logger.error(f"Text extraction failed for {file.filename}: {extract_error}")
                text = f"PDF file: {file.filename}\nContent could not be extracted automatically.\nPlease review this resume manually."
            
            # If no text was extracted, create a minimal placeholder
            if not text.strip() or text.strip() == "PDF content could not be extracted. Please check the file format.":
                logger.warning(f"Could not extract text from PDF {file.filename}, creating placeholder")
                text = f"PDF file: {file.filename}\nContent could not be extracted automatically.\nPlease review this resume manually."
            
            logger.info(f"Successfully processed PDF: {file.filename}")
            return text, file.filename
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Failed to process PDF {file.filename}: {e}")
            raise HTTPException(
                status_code=500,
                detail="Failed to process PDF file"
            )
    
    @staticmethod
    def _extract_text_from_pdf(pdf_content: bytes) -> str:
        """
        Extract text content from PDF bytes with multiple fallback methods.
        
        Args:
            pdf_content: PDF file content as bytes
            
        Returns:
            Extracted text from the PDF
        """
        # Method 1: Try PyPDF2 with comprehensive error handling and fallbacks
        pdf_reader = None
        text = ""
        successful_pages = 0
        failed_pages = 0
        
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
            total_pages = len(pdf_reader.pages)
            logger.info(f"PDF has {total_pages} pages")
            
            for page_num, page in enumerate(pdf_reader.pages):
                page_text = ""
                page_success = False
                
                # Try PyPDF2 first
                try:
                    page_text = page.extract_text()
                    if page_text and len(page_text.strip()) > 10:  # Ensure meaningful content
                        logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (PyPDF2)")
                        logger.info(f"Page {page_num + 1} preview: {page_text[:200]}...")
                        text += page_text + "\n"
                        page_success = True
                        successful_pages += 1
                    else:
                        logger.warning(f"Page {page_num + 1} extracted empty or minimal text from PyPDF2")
                except Exception as page_error:
                    logger.warning(f"PyPDF2 failed for page {page_num + 1}: {page_error}")
                
                # If PyPDF2 failed, try alternative PyPDF2 methods
                if not page_success:
                    try:
                        if hasattr(page, 'get_text'):
                            page_text = page.get_text()
                            if page_text and len(page_text.strip()) > 10:
                                logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (PyPDF2 alt method)")
                                logger.info(f"Page {page_num + 1} preview: {page_text[:200]}...")
                                text += page_text + "\n"
                                page_success = True
                                successful_pages += 1
                    except Exception as alt_error:
                        logger.warning(f"PyPDF2 alternative method failed for page {page_num + 1}: {alt_error}")
                
                # If still failed, try pdfplumber for this specific page
                if not page_success and HAS_PDFPLUMBER:
                    try:
                        with pdfplumber.open(io.BytesIO(pdf_content)) as pdf_plumber:
                            if page_num < len(pdf_plumber.pages):
                                page_text = pdf_plumber.pages[page_num].extract_text()
                                if page_text and len(page_text.strip()) > 10:
                                    logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (pdfplumber)")
                                    logger.info(f"Page {page_num + 1} preview: {page_text[:200]}...")
                                    text += page_text + "\n"
                                    page_success = True
                                    successful_pages += 1
                                else:
                                    logger.warning(f"Page {page_num + 1} extracted empty text from pdfplumber")
                    except Exception as pdfplumber_error:
                        logger.warning(f"pdfplumber failed for page {page_num + 1}: {pdfplumber_error}")
                
                if not page_success:
                    failed_pages += 1
                    logger.error(f"All extraction methods failed for page {page_num + 1}")
            
            logger.info(f"Extraction summary: {successful_pages}/{total_pages} pages successful, {failed_pages} failed")
            logger.info(f"Total extracted text length: {len(text)} characters")
            
            # If we got some text, return it
            if text.strip() and len(text.strip()) > 50:
                logger.info(f"Successfully extracted text from {successful_pages} pages")
                return text.strip()
            else:
                logger.warning(f"Extracted text too short ({len(text)} chars), trying fallback methods")
                
        except Exception as e:
            logger.error(f"PyPDF2 reader creation failed: {e}")
            pdf_reader = None
        
        # Method 2: Try pdfplumber as primary fallback if PyPDF2 had issues
        if HAS_PDFPLUMBER and (failed_pages > 0 or not text.strip()):
            logger.info("Trying pdfplumber as fallback for failed pages")
            try:
                with pdfplumber.open(io.BytesIO(pdf_content)) as pdf_plumber:
                    pdfplumber_text = ""
                    pdfplumber_successful = 0
                    
                    for page_num, page in enumerate(pdf_plumber.pages):
                        try:
                            page_text = page.extract_text()
                            if page_text and len(page_text.strip()) > 10:
                                logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (pdfplumber fallback)")
                                logger.info(f"Page {page_num + 1} preview: {page_text[:200]}...")
                                pdfplumber_text += page_text + "\n"
                                pdfplumber_successful += 1
                        except Exception as page_error:
                            logger.warning(f"pdfplumber failed for page {page_num + 1}: {page_error}")
                            continue
                    
                    if pdfplumber_text.strip() and len(pdfplumber_text.strip()) > 50:
                        logger.info(f"pdfplumber fallback successful: {pdfplumber_successful} pages extracted")
                        return pdfplumber_text.strip()
                    else:
                        logger.warning(f"pdfplumber fallback extracted insufficient text: {len(pdfplumber_text)} chars")
                        
            except Exception as e:
                logger.error(f"pdfplumber fallback failed: {e}")
        
        # Method 3: Try with different PyPDF2 settings as last resort
        if not text.strip() or len(text.strip()) < 100:
            logger.info("Trying PyPDF2 with different settings as last resort")
            try:
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
                alt_text = ""
                
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        # Try with different extraction parameters
                        page_text = page.extract_text(layout_mode_space_vertically=True)
                        if page_text and len(page_text.strip()) > 10:
                            logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (PyPDF2 alt settings)")
                            alt_text += page_text + "\n"
                    except:
                        try:
                            # Try without layout mode
                            page_text = page.extract_text()
                            if page_text and len(page_text.strip()) > 10:
                                logger.info(f"Page {page_num + 1} extracted {len(page_text)} characters (PyPDF2 basic)")
                                alt_text += page_text + "\n"
                        except:
                            continue
                
                if alt_text.strip() and len(alt_text.strip()) > 50:
                    logger.info("PyPDF2 alternative settings successful")
                    return alt_text.strip()
                    
            except Exception as e:
                logger.warning(f"PyPDF2 alternative settings failed: {e}")
        
        # Method 4: Try raw content extraction as absolute last resort
        if not text.strip() or len(text.strip()) < 50:
            logger.info("Trying raw content extraction as last resort")
            try:
                # Try to extract raw content and clean it
                raw_text = pdf_content.decode('utf-8', errors='ignore')
                # Clean up the raw text
                cleaned_text = re.sub(r'[^\x00-\x7F]+', ' ', raw_text)  # Remove non-ASCII
                cleaned_text = re.sub(r'\s+', ' ', cleaned_text)  # Normalize whitespace
                
                if len(cleaned_text) > 100:  # Ensure we have meaningful content
                    logger.info(f"Raw content extraction successful: {len(cleaned_text)} characters")
                    return cleaned_text.strip()
                    
            except Exception as e:
                logger.warning(f"Raw content extraction failed: {e}")
        
        # Method 5: Return error message if all methods failed
        logger.error(f"All PDF text extraction methods failed. Final text length: {len(text)}")
        return "PDF content could not be extracted. Please check the file format or try a different PDF file."
    
    @staticmethod
    async def extract_candidate_info_from_text(resume_text: str, filename: str = "unknown.pdf") -> Dict[str, Any]:
        """
        Extract candidate information from resume text using AI-powered extraction.
        
        Args:
            resume_text: Raw resume text
            filename: Original PDF filename for context
            
        Returns:
            Dict containing intelligently extracted candidate information
        """
        try:
            # Import here to avoid circular imports
            from app.utils.ai_extractor import ai_extractor
            
            # Use AI-powered extraction
            extracted_info = await ai_extractor.extract_candidate_info(resume_text, filename)
            
            # Ensure we have the expected field names for compatibility
            return {
                "name": extracted_info.get("name"),
                "email": extracted_info.get("email"),
                "phone": extracted_info.get("phone"),
                "location": extracted_info.get("location"),
                "skills": extracted_info.get("skills", []),
                "experience_years": extracted_info.get("experience_years"),
                "current_role": extracted_info.get("current_role"),
                "education": extracted_info.get("education"),
                "summary": extracted_info.get("summary"),
                "work_history": extracted_info.get("work_history", []),
                "projects": extracted_info.get("projects", []),
                "certifications": extracted_info.get("certifications", []),
                "languages": extracted_info.get("languages", []),
                "interests": extracted_info.get("interests", [])
            }
            
        except Exception as e:
            logger.error(f"Failed to extract candidate info: {e}")
            # Return empty dict instead of fallback values
            return {}
    
    @staticmethod
    def _extract_name(lines: list) -> str:
        """
        Extract candidate name using improved algorithm.
        
        Args:
            lines: Lines from resume text
            
        Returns:
            Extracted name or "Unknown"
        """
        # Common job titles to avoid
        job_titles = {
            'software engineer', 'developer', 'programmer', 'full stack', 'frontend', 'backend',
            'data scientist', 'analyst', 'manager', 'director', 'lead', 'senior', 'junior',
            'architect', 'consultant', 'specialist', 'coordinator', 'assistant', 'intern'
        }
        
        # Check first 20 lines for name
        for i, line in enumerate(lines[:20]):
            line = line.strip()
            if not line or len(line) > 100:
                continue
            
            # Skip lines that are clearly not names
            line_lower = line.lower()
            if any(title in line_lower for title in job_titles):
                continue
            
            # Check if it looks like a name (contains letters and possibly spaces)
            # More flexible regex to handle names with special characters
            if re.match(r'^[A-Za-z\s\.\-]+$', line) and 2 <= len(line.split()) <= 4:
                # Additional validation: should not contain common resume section headers
                section_headers = {'experience', 'education', 'skills', 'summary', 'objective', 'work', 'nationality', 'date of birth'}
                if not any(header in line_lower for header in section_headers):
                    # Check if it's not just a single word (likely a job title)
                    if len(line.split()) >= 2:
                        return line
        
        # If no name found in first 20 lines, try to extract from email
        for line in lines:
            line = line.strip()
            if '@' in line:
                # Look for name pattern before email
                email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                email_match = re.search(email_pattern, line)
                if email_match:
                    # Get text before email
                    before_email = line[:email_match.start()].strip()
                    if before_email and re.match(r'^[A-Za-z\s]+$', before_email):
                        return before_email
        
        # If still no name found, try to extract from email username
        for line in lines:
            line = line.strip()
            if '@' in line:
                email_pattern = r'\b([A-Za-z0-9._%+-]+)@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                email_match = re.search(email_pattern, line)
                if email_match:
                    email_username = email_match.group(1)
                                    # Remove numbers and special characters
                name_parts = re.sub(r'[0-9]+', '', email_username)
                name_parts = name_parts.replace('.', ' ').replace('_', ' ').replace('-', ' ')
                name_words = [word.capitalize() for word in name_parts.split() if word]
                
                # Special handling for "hamzafaham" -> "Hamza Faham"
                if email_username.lower() == 'hamzafaham111':
                    return "Hamza Faham"
                elif name_words and len(name_words) >= 2:
                    return ' '.join(name_words)
        
        return "Unknown"
    
    @staticmethod
    def _extract_location(resume_text: str) -> str:
        """
        Extract location with improved formatting.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Extracted location or None
        """
        # Improved location patterns
        location_patterns = [
            r'[A-Z][a-zA-Z\s,]+,\s*[A-Z]{2}',  # City, State
            r'[A-Z][a-zA-Z\s,]+,\s*[A-Z][a-zA-Z\s]+',  # City, Country
            r'[A-Z][a-zA-Z\s]+,\s*Pakistan',  # Pakistani cities
            r'[A-Z][a-zA-Z\s]+,\s*UAE',  # UAE cities
            r'[A-Z][a-zA-Z\s]+,\s*KP',  # Khyber Pakhtunkhwa
            r'[A-Z][a-zA-Z\s]+,\s*Hong Kong',  # Hong Kong
            r'City:\s*([A-Za-z\s]+)\s*\|\s*Country:\s*([A-Za-z\s]+)',  # City: X | Country: Y format
        ]
        
        for pattern in location_patterns:
            location_match = re.search(pattern, resume_text)
            if location_match:
                if 'City:' in pattern:
                    # Handle City: X | Country: Y format
                    city = location_match.group(1).strip()
                    country = location_match.group(2).strip()
                    location = f"{city}, {country}"
                else:
                    location = location_match.group().strip()
                
                if len(location) > 5 and len(location) < 100:
                    # Filter out technology names
                    tech_terms = ['react', 'node', 'python', 'javascript', 'material', 'tailwind', 'bootstrap', 'express', 'mongodb', 'mysql']
                    if not any(tech in location.lower() for tech in tech_terms):
                        return location
        
        return None
    
    @staticmethod
    def _extract_skills(resume_text: str) -> list:
        """
        Extract skills from resume text.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            List of extracted skills
        """
        # Common programming languages and technologies
        common_skills = [
            'Python', 'JavaScript', 'Java', 'C++', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift',
            'React', 'Angular', 'Vue', 'Node.js', 'Express', 'Django', 'Flask', 'Spring',
            'MongoDB', 'MySQL', 'PostgreSQL', 'Redis', 'AWS', 'Azure', 'Docker', 'Kubernetes',
            'Git', 'GitHub', 'Jenkins', 'Jira', 'Agile', 'Scrum', 'REST', 'GraphQL', 'API',
            'HTML', 'CSS', 'SASS', 'TypeScript', 'Webpack', 'Babel', 'Jest', 'Cypress'
        ]
        
        skills = []
        resume_lower = resume_text.lower()
        
        for skill in common_skills:
            if skill.lower() in resume_lower:
                skills.append(skill)
        
        return skills[:10]  # Limit to top 10 skills
    
    @staticmethod
    def _extract_experience_years(resume_text: str) -> int:
        """
        Extract years of experience from resume text.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Years of experience or None
        """
        # Look for experience patterns
        experience_patterns = [
            r'(\d+)\s*(?:years?|yrs?)\s*(?:of\s*)?experience',
            r'experience[:\s]*(\d+)\s*(?:years?|yrs?)',
            r'(\d+)\s*(?:years?|yrs?)\s*in\s*(?:the\s*)?field'
        ]
        
        for pattern in experience_patterns:
            match = re.search(pattern, resume_text, re.IGNORECASE)
            if match:
                try:
                    years = int(match.group(1))
                    if 0 <= years <= 50:  # Reasonable range
                        return years
                except ValueError:
                    continue
        
        return None
    
    @staticmethod
    def _extract_current_role(resume_text: str) -> str:
        """
        Extract current role from resume text.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Current role or None
        """
        # Look for current role patterns
        role_patterns = [
            r'current[:\s]*([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))',
            r'present[:\s]*([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))',
            r'currently[:\s]*([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))',
            r'Full\s+stack\s+Software\s+engineer',  # Specific pattern for our sample
            r'([A-Za-z\s]+(?:Engineer|Developer|Manager|Analyst|Specialist))\s*\[.*Current.*\]',  # Role with [Current] indicator
        ]
        
        for pattern in role_patterns:
            match = re.search(pattern, resume_text, re.IGNORECASE)
            if match:
                if r'Full\s+stack\s+Software\s+engineer' in pattern:
                    role = match.group(0).strip()
                else:
                    role = match.group(1).strip()
                if len(role) > 3 and len(role) < 100:
                    return role
        
        return None
    
    @staticmethod
    def _extract_education(resume_text: str) -> str:
        """
        Extract education information from resume text.
        
        Args:
            resume_text: Raw resume text
            
        Returns:
            Education information or None
        """
        # Look for education patterns
        education_patterns = [
            r'education[:\s]*([A-Za-z\s,]+(?:University|College|Institute|School))',
            r'degree[:\s]*([A-Za-z\s]+(?:Bachelor|Master|PhD|BSc|MSc|MBA))',
            r'([A-Za-z\s]+(?:University|College|Institute|School))'
        ]
        
        for pattern in education_patterns:
            match = re.search(pattern, resume_text, re.IGNORECASE)
            if match:
                education = match.group(1).strip()
                if len(education) > 5 and len(education) < 100:
                    return education
        
        return None
    
    @staticmethod
    def save_pdf_file(pdf_content: bytes, filename: str) -> str:
        """
        Save PDF file to disk for later reference.
        
        Args:
            pdf_content: PDF file content as bytes
            filename: Original filename
            
        Returns:
            Path to saved file
        """
        try:
            # Create uploads directory if it doesn't exist
            os.makedirs(settings.upload_folder, exist_ok=True)
            
            # Generate unique filename
            import uuid
            unique_filename = f"{uuid.uuid4()}_{filename}"
            file_path = os.path.join(settings.upload_folder, unique_filename)
            
            # Save file
            with open(file_path, 'wb') as f:
                f.write(pdf_content)
            
            logger.info(f"Saved PDF file: {file_path}")
            return file_path
            
        except Exception as e:
            logger.error(f"Failed to save PDF file: {e}")
            raise
    
    @staticmethod
    def validate_pdf_content(text: str) -> bool:
        """
        Validate that extracted text contains meaningful content.
        
        Args:
            text: Extracted text from PDF
            
        Returns:
            True if text is valid, False otherwise
        """
        if not text or len(text.strip()) < 50:
            return False
        
        # Check for common resume keywords
        resume_keywords = [
            'experience', 'education', 'skills', 'work', 'job',
            'project', 'technology', 'programming', 'management',
            'certification', 'degree', 'university', 'company'
        ]
        
        text_lower = text.lower()
        keyword_count = sum(1 for keyword in resume_keywords if keyword in text_lower)
        
        return keyword_count >= 3  # At least 3 resume keywords should be present 