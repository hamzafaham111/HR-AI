"""
Candidate information extraction from PDF content.

This module provides extraction of candidate information
from any PDF content, whether it's a formal resume or rough candidate data.
"""

import json
import re
from typing import Dict, Any, Optional, List
from app.core.logging import logger


class AIExtractor:
    """
    Extractor for candidate information from PDF content.
    
    Uses pattern matching and heuristics to extract and format candidate data
    from any type of PDF content (resumes, rough information, etc.).
    """
    
    def __init__(self):
        pass
    
    async def extract_candidate_info(self, pdf_text: str, filename: str) -> Dict[str, Any]:
        """
        Extract candidate information from any PDF content.
        
        Args:
            pdf_text: Raw text extracted from PDF
            filename: Original PDF filename
            
        Returns:
            Dict containing extracted candidate information
        """
        try:
            logger.info(f"Extracting candidate info using fallback extraction for {filename}")
            return self._fallback_extraction(pdf_text, filename)
            
        except Exception as e:
            logger.error(f"Extraction failed: {e}")
            return self._fallback_extraction(pdf_text, filename)
    
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
    
    def _split_into_pages(self, pdf_text: str) -> List[str]:
        """Split PDF text into approximate pages based on common page break indicators."""
        # Look for common page break patterns
        page_break_patterns = [
            r'\n\s*\n\s*\n',  # Multiple blank lines
            r'\f',  # Form feed character
            r'Page \d+',  # "Page X" indicators
            r'^\d+$',  # Standalone page numbers
            r'^Other language\(s\):',  # Common resume section that often starts new pages
            r'^SKILLS$',  # Skills section often starts new pages
            r'^EDUCATION$',  # Education section often starts new pages
            r'^EXPERIENCE$',  # Experience section often starts new pages
            r'^WORK EXPERIENCE$',  # Work experience section often starts new pages
        ]
        
        # Try to split on page breaks
        pages = []
        current_page = ""
        
        lines = pdf_text.split('\n')
        for i, line in enumerate(lines):
            # Check if this line looks like a page break
            is_page_break = False
            for pattern in page_break_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    is_page_break = True
                    break
            
            # Also check for very long gaps (multiple empty lines)
            if i > 0 and line.strip() == "" and lines[i-1].strip() == "":
                is_page_break = True
            
            # Check for section headers that often indicate new pages
            if line.strip() in ['SKILLS', 'EDUCATION', 'EXPERIENCE', 'WORK EXPERIENCE', 'PROJECTS', 'CERTIFICATIONS']:
                is_page_break = True
            
            if is_page_break and current_page.strip():
                pages.append(current_page.strip())
                current_page = ""
            else:
                current_page += line + "\n"
        
        # Add the last page
        if current_page.strip():
            pages.append(current_page.strip())
        
        # If no pages found, try to split by large content gaps
        if not pages or len(pages) == 1:
            # Look for large content gaps (3+ consecutive empty lines)
            lines = pdf_text.split('\n')
            pages = []
            current_page = ""
            empty_line_count = 0
            
            for line in lines:
                if line.strip() == "":
                    empty_line_count += 1
                else:
                    empty_line_count = 0
                
                # If we have 3+ consecutive empty lines, consider it a page break
                if empty_line_count >= 3 and current_page.strip():
                    pages.append(current_page.strip())
                    current_page = ""
                else:
                    current_page += line + "\n"
            
            # Add the last page
            if current_page.strip():
                pages.append(current_page.strip())
        
        # If still no pages found, return the original text as single page
        return pages if pages else [pdf_text]
    
    def _extract_from_filename(self, filename: str) -> Dict[str, Any]:
        """Extract candidate information from filename when PDF extraction fails."""
        extracted = {}
        
        if not filename:
            return extracted
        
        # Remove file extension
        name_part = filename.replace('.pdf', '').replace('.PDF', '')
        
        # Try to extract name from filename
        # Common patterns: "FirstName LastName", "FirstName_LastName", "FirstName-LastName"
        name_patterns = [
            r'^([A-Za-z]+)\s+([A-Za-z]+)',  # "FirstName LastName"
            r'^([A-Za-z]+)_([A-Za-z]+)',    # "FirstName_LastName"
            r'^([A-Za-z]+)-([A-Za-z]+)',    # "FirstName-LastName"
            r'^([A-Za-z]+)([A-Z][a-z]+)',   # "FirstNameLastName" (camelCase)
        ]
        
        for pattern in name_patterns:
            match = re.search(pattern, name_part)
            if match:
                first_name = match.group(1)
                last_name = match.group(2)
                extracted['name'] = f"{first_name} {last_name}"
                break
        
        # If no pattern matches, try to extract single name
        if 'name' not in extracted:
            words = name_part.split()
            if len(words) >= 2:
                # Take first two words as name
                extracted['name'] = ' '.join(words[:2])
            elif len(words) == 1 and len(words[0]) > 3:
                # Single word name
                extracted['name'] = words[0]
        
        return extracted
    
    def _fallback_extraction(self, pdf_text: str, filename: str = "") -> Dict[str, Any]:
        """Enhanced fallback extraction using improved regex patterns and intelligent calculations."""
        extracted = {}
        
        # If PDF text is empty, try to extract from filename
        if not pdf_text or pdf_text.strip() == "":
            if filename:
                extracted.update(self._extract_from_filename(filename))
            return extracted
        
        # Check if this is placeholder text from failed PDF extraction
        if "PDF file:" in pdf_text and "Content could not be extracted automatically" in pdf_text:
            # Extract filename from placeholder text
            filename_match = re.search(r'PDF file: (.+)', pdf_text)
            if filename_match:
                extracted_filename = filename_match.group(1).strip()
                extracted.update(self._extract_from_filename(extracted_filename))
            return extracted
        
        # Split text into pages (approximate - look for page breaks or large gaps)
        pages = self._split_into_pages(pdf_text)
        
        # Debug logging
        logger.info(f"PDF text length: {len(pdf_text)}")
        logger.info(f"Number of pages detected: {len(pages)}")
        for i, page in enumerate(pages):
            logger.info(f"Page {i+1} length: {len(page)} characters")
            logger.info(f"Page {i+1} preview: {page[:200]}...")
        
        # Extract information from ALL pages - search comprehensively
        # Get all pages for comprehensive extraction
        all_pages_text = "\n".join(pages) if pages else pdf_text
        first_page_text = pages[0] if pages else pdf_text
        lines = first_page_text.split('\n')
        name_found = False
        
        # Method 0: Check the first few lines for a name
        if not name_found and lines:
            for i, line in enumerate(lines[:5]):  # Check first 5 lines
                line = line.strip()
                if line and len(line) > 3 and len(line) < 50:
                    words = line.split()
                    if 2 <= len(words) <= 4 and all(re.match(r'^[A-Za-z\.\-]+$', word) for word in words):
                        # Check if it's not a section header
                        if not any(keyword in line.lower() for keyword in ['personal information', 'contact information', 'about me', 'profile', 'resume', 'cv', 'curriculum', 'vitae', 'education', 'experience', 'skills', 'objective', 'summary', 'professional', 'candidate', 'applicant', 'work experience', 'united arab emirates', 'uae', 'dubai', 'pakistan', 'india', 'usa', 'uk', 'canada', 'australia', 'germany', 'france', 'singapore']):
                            # Additional validation - should not contain job-related keywords
                            if not any(keyword in line.lower() for keyword in ['engineer', 'developer', 'programmer', 'manager', 'analyst', 'consultant', 'specialist', 'technician', 'lead', 'senior', 'junior', 'principal', 'staff', 'software', 'web', 'full', 'front', 'back', 'devops', 'data', 'machine', 'learning', 'ai', 'mobile', 'game', 'qa', 'test', 'security', 'cloud', 'platform']):
                                # Additional validation - should not be location names
                                if not any(location in line.lower() for location in ['united arab emirates', 'uae', 'dubai', 'abu dhabi', 'sharjah', 'pakistan', 'india', 'usa', 'united states', 'uk', 'united kingdom', 'canada', 'australia', 'germany', 'france', 'singapore', 'islamabad', 'karachi', 'lahore', 'new york', 'london', 'toronto', 'sydney', 'berlin', 'paris']):
                                    extracted['name'] = line.title()
                                    name_found = True
                                    break
        
        # Method 1: Look for the first line that contains an email and extract the name part
        for line in lines[:5]:  # Check first 5 lines
            if '@' in line and '.com' in line:  # Line contains email
                # Find the email position
                email_match = re.search(r'[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}', line)
                if email_match:
                    # Get the part before the email
                    name_part = line[:email_match.start()].strip()
                    # Clean up the name part (remove extra spaces and any trailing text)
                    name_part = re.sub(r'\s+', ' ', name_part)
                    # Remove any trailing text that might be part of the email (like usernames)
                    # Look for the last occurrence of a proper name pattern
                    words = name_part.split()
                    # Find the last sequence of 2-4 words that look like a name
                    for i in range(len(words), 0, -1):
                        if i >= 2:  # At least 2 words
                            potential_name = ' '.join(words[:i])
                            # Check if all words are proper name words (capitalized or all caps, no numbers, no special chars)
                            if all(re.match(r'^[A-Za-z\.\-]+$', word) and (word[0].isupper() or word.isupper()) for word in words[:i]):
                                # Should not contain job-related keywords
                                if not any(keyword in potential_name.lower() for keyword in ['engineer', 'developer', 'programmer', 'manager', 'analyst', 'consultant', 'specialist', 'technician', 'lead', 'senior', 'junior', 'principal', 'staff', 'software', 'web', 'full', 'front', 'back', 'devops', 'data', 'machine', 'learning', 'ai', 'mobile', 'game', 'qa', 'test', 'security', 'cloud', 'platform']):
                                    # Convert all-caps names to proper case for better display
                                    if potential_name.isupper() and len(potential_name.split()) >= 2:
                                        extracted['name'] = potential_name.title()
                                    else:
                                        extracted['name'] = potential_name
                                    name_found = True
                                    break
                    if name_found:
                        break
        
        # Method 2: Look for name in first few lines (fallback)
        if not name_found:
            lines = pdf_text.split('\n')
            for i, line in enumerate(lines[:10]):  # Check first 10 lines
                line = line.strip()
                if line and len(line) > 3 and len(line) < 50:
                    # Skip lines that contain job-related keywords or section headers
                    if not any(keyword in line.lower() for keyword in ['engineer', 'developer', 'programmer', 'manager', 'analyst', 'consultant', 'specialist', 'technician', 'lead', 'senior', 'junior', 'principal', 'staff', 'software', 'web', 'full', 'front', 'back', 'devops', 'data', 'machine', 'learning', 'ai', 'mobile', 'game', 'qa', 'test', 'security', 'cloud', 'platform', 'resume', 'cv', 'curriculum', 'vitae', 'experience', 'skills', 'education', 'technical', 'summary', 'objective', 'personal information', 'contact information', 'about me', 'profile', 'dateofbirth', 'nationality', 'address', 'mobile no', 'email', 'objective']):
                        # Check if it looks like a name (2-4 words, mostly letters)
                        words = line.split()
                        if 2 <= len(words) <= 4 and all(re.match(r'^[A-Za-z\.\-]+$', word) for word in words):
                            # Additional validation - should not contain numbers or special chars
                            if not re.search(r'[0-9@#$%^&*()_+=\[\]{}|\\:";\'<>?,./]', line):
                                # Convert all-caps names to proper case for better display
                                if line.isupper() and len(line.split()) >= 2:
                                    extracted['name'] = line.title()
                                else:
                                    extracted['name'] = line
                                name_found = True
                                break
        
        # Method 3: Look for name patterns in ALL pages
        if not name_found:
            # Look for common name patterns across all pages
            name_patterns = [
                r'^([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)$',  # First Last Middle
                r'^([A-Z][a-z]+ [A-Z][a-z]+)$',  # First Last
                r'([A-Z][a-z]+ [A-Z][a-z]+ [A-Z][a-z]+)',  # First Last Middle (anywhere)
                r'([A-Z][a-z]+ [A-Z][a-z]+)',  # First Last (anywhere)
            ]
            
            # Search all pages for name patterns
            for page_text in pages:
                for pattern in name_patterns:
                    matches = re.finditer(pattern, page_text, re.MULTILINE)
                    for match in matches:
                        potential_name = match.group(1) if match.groups() else match.group()
                        # Validate it's not a job title or section header
                        if not any(keyword in potential_name.lower() for keyword in ['engineer', 'developer', 'programmer', 'manager', 'analyst', 'consultant', 'specialist', 'technician', 'lead', 'senior', 'junior', 'principal', 'staff', 'software', 'web', 'full', 'front', 'back', 'devops', 'data', 'machine', 'learning', 'ai', 'mobile', 'game', 'qa', 'test', 'security', 'cloud', 'platform', 'resume', 'cv', 'curriculum', 'vitae', 'experience', 'skills', 'education', 'technical', 'summary', 'objective', 'personal information', 'contact information', 'about me', 'profile']):
                            extracted['name'] = potential_name
                            name_found = True
                            break
                    if name_found:
                        break
                if name_found:
                    break
        
        # Enhanced email extraction - search ALL pages comprehensively
        email_found = False
        
        # Method 1: Check for split emails (like "juancontardi isdev@gmail.com") - ALL PAGES
        split_email_pattern = r'([A-Za-z0-9._%+\-]+)\s+([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})'
        for page_text in pages:
            split_email_match = re.search(split_email_pattern, page_text)
            if split_email_match:
                username = split_email_match.group(1)
                domain_part = split_email_match.group(2)
                # Only process if the username is different from the email's local part
                if '@' in domain_part:
                    local_part = domain_part.split('@')[0]
                    # Only reconstruct if username is different from local_part AND local_part is short (like "isdev")
                    # This avoids cases like "Superfol james.superfol@gmail.com" where "james.superfol" is a complete email
                    if username != local_part and len(local_part) < 10 and not '.' in local_part:
                        full_email = f"{username}{local_part}@{domain_part.split('@')[1]}"
                        extracted['email'] = full_email
                        email_found = True
                        break
            if email_found:
                break
        
        # Method 2: Look for emails in contact information sections - ALL PAGES
        if not email_found:
            contact_patterns = [
                r'email\s*:?\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})',
                r'e-mail\s*:?\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})',
                r'contact\s*:?\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})',
                r'mail\s*:?\s*([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})',
            ]
            
            for page_text in pages:
                for pattern in contact_patterns:
                    email_match = re.search(pattern, page_text, re.IGNORECASE)
                    if email_match:
                        email = email_match.group(1).strip()
                        if '@' in email and '.' in email.split('@')[1]:
                            extracted['email'] = email
                            email_found = True
                            break
                if email_found:
                    break
        
        # Method 3: Try standard email patterns - ALL PAGES
        if not email_found:
            email_patterns = [
                r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b',  # Standard email
                r'([A-Za-z0-9._%+\-]+)\s*@\s*([A-Za-z0-9.\-]+)\s*\.\s*([A-Za-z]{2,})',  # Email with spaces
                r'([A-Za-z0-9._%+\-]+)\s*@\s*([A-Za-z0-9.\-]+)\.([A-Za-z]{2,})',  # Email with space before @
            ]
            
            for page_text in pages:
                for pattern in email_patterns:
                    email_match = re.search(pattern, page_text)
                    if email_match:
                        if len(email_match.groups()) > 1:
                            # Reconstruct email from groups
                            email = f"{email_match.group(1)}@{email_match.group(2)}.{email_match.group(3)}"
                        else:
                            email = email_match.group()
                        
                        # Clean up the email
                        email = email.replace(' ', '').strip()
                        if '@' in email and '.' in email.split('@')[1]:
                            extracted['email'] = email
                            email_found = True
                            break
                if email_found:
                    break
                
        # Method 4: Try to extract from name line patterns - ALL PAGES
        if not email_found:
            email_in_name_pattern = r'([A-Za-z\s\.\-]+)\s+([A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})'
            for page_text in pages:
                email_in_name_match = re.search(email_in_name_pattern, page_text)
                if email_in_name_match:
                    extracted['email'] = email_in_name_match.group(2).strip()
                    email_found = True
                    break
        
        
        # Extract phone number - SEARCH ALL PAGES
        phone_patterns = [
            r'\+?[\d\s\-\(\)]{10,}',
            r'\(\d{3}\)\s*\d{3}-\d{4}',
            r'\d{3}-\d{3}-\d{4}',
            r'\d{10,}',
        ]
        
        phone_found = False
        # Search all pages for phone number
        for page_text in pages:
            for pattern in phone_patterns:
                phone_match = re.search(pattern, page_text)
                if phone_match:
                    phone = phone_match.group().strip()
                    phone = re.sub(r'[^\d\+]', '', phone)
                    if len(phone) >= 10:
                        extracted['phone'] = phone
                        phone_found = True
                        break
            if phone_found:
                break
        
        # Extract years of experience - multiple methods using ALL PAGES
        experience_years = None
        
        # Method 1: Direct experience statements - search all pages
        experience_patterns = [
            r'(\d+)\s*years?\s*of\s*experience',
            r'(\d+)\s*years?\s*experience',
            r'over\s*(\d+)\s*years?',
            r'(\d+)\+?\s*years?\s*of\s*experience',
            r'(\d+)\+?\s*years?\s*in\s*software',
            r'(\d+)\+?\s*years?\s*in\s*development'
        ]
        
        for page_text in pages:
            for pattern in experience_patterns:
                exp_match = re.search(pattern, page_text, re.IGNORECASE)
                if exp_match:
                    try:
                        years = int(exp_match.group(1))
                        if 1 <= years <= 50:  # Reasonable range
                            experience_years = years
                            break
                    except ValueError:
                        continue
            if experience_years:
                break
        
        # Method 2: Calculate from work history if direct experience not found
        if not experience_years:
            experience_years = self._calculate_experience_from_work_history(all_pages_text)
        
        if experience_years:
            extracted['experience_years'] = experience_years
        
        # Extract current role/title - enhanced patterns using ALL PAGES
        role_patterns = [
            # Full patterns with seniority
            r'(Senior|Junior|Lead|Principal|Staff|Mid.?Level|Mid.?Senior)?\s*(Software|Web|Full.?Stack|Front.?end|Back.?end|DevOps|Data|Machine Learning|AI|Mobile|Game|QA|Test|Security|Cloud|Platform)?\s*(Engineer|Developer|Programmer|Architect|Manager|Analyst|Consultant|Specialist|Technician)',
            # Basic patterns
            r'(Software|Web|Full.?Stack|Front.?end|Back.?end|DevOps|Data|Machine Learning|AI|Mobile|Game|QA|Test|Security|Cloud|Platform)?\s*(Engineer|Developer|Programmer|Architect|Manager|Analyst|Consultant|Specialist|Technician)',
            # Alternative titles
            r'(Tech Lead|Team Lead|Technical Lead|Project Manager|Product Manager|Scrum Master|Solution Architect)',
            # Non-technical roles
            r'(Driver|Customer Service|Sales|Marketing|HR|Human Resources|Administrative|Admin|Receptionist|Clerk|Assistant|Coordinator|Supervisor|Director|Executive)',
            # Look for role in experience section
            r'([A-Za-z\s]+(?:Engineer|Developer|Programmer|Architect|Manager|Analyst|Consultant|Specialist|Technician|Lead|Driver|Service|Sales|Marketing))',
            # Look for role in objective/summary
            r'Experienced\s+and\s+reliable\s+([A-Za-z\s]+)',
        ]
        
        role_found = False
        for page_text in pages:
            for pattern in role_patterns:
                role_matches = re.finditer(pattern, page_text, re.IGNORECASE)
                for role_match in role_matches:
                    role = role_match.group().strip()
                    # Filter out common false positives
                    if len(role) > 5 and not any(word in role.lower() for word in ['experience', 'skills', 'education', 'project', 'company', 'university', 'college']):
                        extracted['current_role'] = role
                        role_found = True
                        break
                if role_found:
                    break
            if role_found:
                break
        
        # Extract location - comprehensive patterns for actual locations - ALL PAGES
        location_found = False
        location = None
        
        # Priority 1: Look for explicit location labels (most reliable)
        location_label_patterns = [
            r'Location\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'Based in\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'Address\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'Current Location\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'Residence\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'City\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
            r'Country\s*:?\s*([A-Za-z\s,]+(?:UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom))',
        ]
        
        for page_text in pages:
            for pattern in location_label_patterns:
                match = re.search(pattern, page_text, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    location_found = True
                    break
            if location_found:
                break
        
        # Priority 2: Look for city, country patterns
        if not location_found:
            city_country_patterns = [
                # Major cities with countries
                r'(Dubai|Abu Dhabi|Sharjah|Ajman|Fujairah|Ras Al Khaimah|Umm Al Quwain),\s*(UAE|U\.A\.E|United Arab Emirates)',
                r'(Islamabad|Karachi|Lahore|Rawalpindi|Faisalabad|Multan|Peshawar|Quetta),\s*Pakistan',
                r'(Mumbai|Delhi|Bangalore|Chennai|Kolkata|Hyderabad|Pune|Ahmedabad|Jaipur|Lucknow),\s*India',
                r'(New York|Los Angeles|Chicago|Houston|Phoenix|Philadelphia|San Antonio|San Diego|Dallas|San Jose),\s*(USA|United States)',
                r'(London|Manchester|Birmingham|Leeds|Glasgow|Sheffield|Bradford|Edinburgh|Liverpool|Bristol),\s*(UK|United Kingdom)',
                r'(Toronto|Vancouver|Montreal|Calgary|Ottawa|Edmonton|Mississauga|Winnipeg|Quebec City|Hamilton),\s*Canada',
                r'(Sydney|Melbourne|Brisbane|Perth|Adelaide|Gold Coast|Newcastle|Canberra|Wollongong|Hobart),\s*Australia',
                r'(Berlin|Munich|Hamburg|Cologne|Frankfurt|Stuttgart|Düsseldorf|Dortmund|Essen|Leipzig),\s*Germany',
                r'(Paris|Marseille|Lyon|Toulouse|Nice|Nantes|Strasbourg|Montpellier|Bordeaux|Lille),\s*France',
                r'(Singapore|Central Region|East Region|North Region|Northeast Region|West Region),\s*Singapore',
            ]
            
            for page_text in pages:
                for pattern in city_country_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        city = match.group(1).strip()
                        country = match.group(2).strip()
                        location = f"{city}, {country}"
                        location_found = True
                        break
                if location_found:
                    break
        
        # Priority 3: Look for contact information section locations (more reliable than work experience)
        if not location_found:
            contact_location_patterns = [
                # Look for locations in contact info sections
                r'(?:Phone|Email|Contact|Address|Location)\s*:?\s*[^\n]*?([A-Za-z\s]+),\s*(UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom)',
                # Look for locations near contact details
                r'([A-Za-z\s]+),\s*(UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom)\s*[^\n]*?(?:Phone|Email|Contact|Address)',
            ]
            
            for page_text in pages:
                for pattern in contact_location_patterns:
                    matches = re.finditer(pattern, page_text, re.IGNORECASE)
                    for match in matches:
                        if len(match.groups()) >= 2:
                            city = match.group(1).strip()
                            country = match.group(2).strip()
                            # Validate it's a real location (not a company name)
                            if (len(city) > 2 and len(city) < 30 and 
                                not any(keyword in city.lower() for keyword in [
                                    'company', 'corporation', 'inc', 'ltd', 'llc', 'pvt', 'limited', 'technologies',
                                    'solutions', 'systems', 'services', 'consulting', 'group', 'enterprises',
                                    'software', 'tech', 'digital', 'global', 'international', 'worldwide',
                                    'future', 'nostics', 'media', 'jigs', 'al-huda', 'garrison', 'university'
                                ])):
                                location = f"{city}, {country}"
                                location_found = True
                                break
                    if location_found:
                        break
                if location_found:
                    break
        
        # Priority 4: Look for work experience locations (only if no contact location found)
        if not location_found:
            work_location_patterns = [
                # Look for current/ongoing positions first
                r'(?:Current|Present|Ongoing|Since)\s+[^,\n]*?([A-Za-z\s]+),\s*(UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom)',
                # Look for recent positions (last 2 years)
                r'(?:2023|2024|2025|Present|Current)\s+[^,\n]*?([A-Za-z\s]+),\s*(UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom)',
            ]
            
            for page_text in pages:
                for pattern in work_location_patterns:
                    matches = re.finditer(pattern, page_text, re.IGNORECASE)
                    for match in matches:
                        if len(match.groups()) >= 2:
                            city = match.group(1).strip()
                            country = match.group(2).strip()
                            # Validate it's a real location (not a company name)
                            if (len(city) > 2 and len(city) < 30 and 
                                not any(keyword in city.lower() for keyword in [
                                    'company', 'corporation', 'inc', 'ltd', 'llc', 'pvt', 'limited', 'technologies',
                                    'solutions', 'systems', 'services', 'consulting', 'group', 'enterprises',
                                    'software', 'tech', 'digital', 'global', 'international', 'worldwide',
                                    'future', 'nostics', 'media', 'jigs', 'al-huda', 'garrison', 'university'
                                ])):
                                location = f"{city}, {country}"
                                location_found = True
                                break
                    if location_found:
                        break
                if location_found:
                    break
        
        # Priority 5: Look for remote work indicators
        if not location_found:
            remote_patterns = [
                r'\b(Remote|Work from home|WFH|Hybrid|On-site|Onsite)\b',
            ]
            
            for page_text in pages:
                for pattern in remote_patterns:
                    match = re.search(pattern, page_text, re.IGNORECASE)
                    if match:
                        location = match.group(1).strip()
                        location_found = True
                        break
                if location_found:
                    break
        
        # Priority 6: Smart fallback - look for the most recent location mentioned
        if not location_found:
            # Look for any location pattern but prioritize by context
            all_location_patterns = [
                r'([A-Za-z\s]+),\s*(UAE|Pakistan|India|USA|UK|Canada|Australia|Germany|France|Singapore|U\.A\.E|United Arab Emirates|United States|United Kingdom)',
            ]
            
            # Collect all potential locations with their context
            potential_locations = []
            
            for page_text in pages:
                for pattern in all_location_patterns:
                    matches = re.finditer(pattern, page_text, re.IGNORECASE)
                    for match in matches:
                        if len(match.groups()) >= 2:
                            city = match.group(1).strip()
                            country = match.group(2).strip()
                            
                            # Get context around the match
                            start = max(0, match.start() - 50)
                            end = min(len(page_text), match.end() + 50)
                            context = page_text[start:end].lower()
                            
                            # Score based on context
                            score = 0
                            if any(word in context for word in ['current', 'present', 'now', 'location', 'address', 'contact']):
                                score += 10
                            if any(word in context for word in ['phone', 'email', 'mobile', 'contact']):
                                score += 5
                            if any(word in context for word in ['work', 'experience', 'company']):
                                score += 2
                            if any(word in context for word in ['education', 'university', 'school', 'college']):
                                score -= 5
                            
                            # Validate it's a real location
                            if (len(city) > 2 and len(city) < 30 and 
                                not any(keyword in city.lower() for keyword in [
                                    'company', 'corporation', 'inc', 'ltd', 'llc', 'pvt', 'limited', 'technologies',
                                    'solutions', 'systems', 'services', 'consulting', 'group', 'enterprises',
                                    'software', 'tech', 'digital', 'global', 'international', 'worldwide',
                                    'future', 'nostics', 'media', 'jigs', 'al-huda', 'garrison', 'university'
                                ])):
                                potential_locations.append({
                                    'location': f"{city}, {country}",
                                    'score': score,
                                    'context': context
                                })
            
            # Sort by score and take the highest scoring location
            if potential_locations:
                potential_locations.sort(key=lambda x: x['score'], reverse=True)
                best_location = potential_locations[0]
                if best_location['score'] > 0:  # Only use if it has positive context score
                    location = best_location['location']
                    location_found = True
        
        # Clean up and validate the location
        if location_found and location:
            # Clean up location
            location = re.sub(r'\s+', ' ', location).strip()
            location = re.sub(r'^[:\-\s]+', '', location)  # Remove leading colons, dashes, spaces
            location = re.sub(r'[:\-\s]+$', '', location)  # Remove trailing colons, dashes, spaces
            
            # Final validation - ensure it looks like a real location
            if (len(location) > 2 and len(location) < 100 and
                not any(keyword in location.lower() for keyword in [
                    'experience', 'skills', 'education', 'project', 'company', 'university', 'college',
                    'years', 'months', 'performance', 'web', 'applications', 'technologies', 'including',
                    'react', 'node', 'mongodb', 'aws', 'specialize', 'designing', 'dynamic', 'responsive',
                    'interfaces', 'developing', 'robust', 'secure', 'solutions', 'skilled', 'implementing',
                    'pipelines', 'optimizing', 'infrastructure', 'deploying', 'scale', 'proficient', 'agile',
                    'methodologies', 'cross', 'functional', 'collaboration', 'passionate', 'creating',
                    'innovative', 'industries', 'commerce', 'fintech', 'healthcare', 'retail',
                    'bootstrap', 'javascript', 'html', 'css', 'python', 'java', 'php', 'ruby', 'go',
                    'express', 'next', 'redux', 'tailwind', 'material', 'postgresql', 'mysql', 'redis',
                    'elasticsearch', 'graphql', 'rest', 'microservices', 'ci/cd', 'jenkins', 'github',
                    'gitlab', 'jira', 'agile', 'scrum', 'tdd', 'bdd', 'jest', 'cypress', 'selenium'
                ]) and
                not re.search(r'\d{4}', location) and  # No years in location
                not re.search(r'[{}()]', location) and  # No brackets
                not re.search(r'[|]', location) and  # No pipes
                not re.search(r'[•\-\*]', location) and  # No bullet points
                not re.search(r'^\s*[A-Z]+\s*$', location)):  # No single words in caps
                
                extracted['location'] = location
            else:
                location_found = False
        
        # If no valid location found, set to "Unknown"
        if not location_found:
            extracted['location'] = "Unknown"
        
        # Enhanced skills extraction - SEARCH ALL PAGES
        skills_keywords = [
            'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'mongodb',
            'aws', 'docker', 'kubernetes', 'git', 'html', 'css', 'typescript',
            'angular', 'vue', 'php', 'c++', 'c#', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'scala', 'r', 'matlab', 'excel', 'powerpoint', 'word',
            'express', 'next.js', 'redux', 'tailwind', 'bootstrap', 'material-ui',
            'postgresql', 'mysql', 'redis', 'elasticsearch', 'graphql', 'rest',
            'microservices', 'ci/cd', 'jenkins', 'github', 'gitlab', 'jira',
            'agile', 'scrum', 'tdd', 'bdd', 'jest', 'cypress', 'selenium'
        ]
        
        found_skills = []
        # Search all pages for skills
        for page_text in pages:
            for skill in skills_keywords:
                # Escape special regex characters in skill name to avoid regex errors
                escaped_skill = re.escape(skill)
                if re.search(rf'\b{escaped_skill}\b', page_text, re.IGNORECASE):
                    skill_title = skill.title()
                    if skill_title not in found_skills:  # Avoid duplicates
                        found_skills.append(skill_title)
        
        if found_skills:
            extracted['skills'] = found_skills
        
        # Extract education - SEARCH ALL PAGES
        education_patterns = [
            r'(Bachelor|Master|PhD|Doctorate|B\.S\.|M\.S\.|Ph\.D\.|B\.A\.|M\.A\.).*?(?:in|of)?\s*([A-Za-z\s]+)',
            r'(Degree|Diploma|Certificate).*?(?:in|of)?\s*([A-Za-z\s]+)',
        ]
        
        education_found = False
        for page_text in pages:
            for pattern in education_patterns:
                edu_match = re.search(pattern, page_text, re.IGNORECASE)
                if edu_match:
                    extracted['education'] = edu_match.group().strip()
                    education_found = True
                    break
            if education_found:
                break
        
        # Determine experience level based on years of experience
        if experience_years:
            extracted['experience_level'] = self._determine_experience_level(experience_years)
        
        return extracted
    
    def _calculate_experience_from_work_history(self, pdf_text: str) -> int:
        """Calculate total years of experience from work history."""
        import re
        from datetime import datetime
        
        # Look for date patterns in work experience
        date_patterns = [
            r'(\w+)\s+(\d{4})\s*[-–]\s*(\w+)?\s*(\d{4})?',  # "Jan 2020 - Dec 2023" or "2020 - 2023"
            r'(\d{4})\s*[-–]\s*(\d{4})',  # "2020-2023"
            r'(\w+)\s+(\d{4})\s*[-–]\s*(Present|Current|Now)',  # "Jan 2020 - Present"
            r'(\d{4})\s*[-–]\s*(Present|Current|Now)',  # "2020 - Present"
        ]
        
        total_months = 0
        current_year = datetime.now().year
        current_month = datetime.now().month
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, pdf_text, re.IGNORECASE)
            for match in matches:
                try:
                    groups = match.groups()
                    if len(groups) >= 2:
                        start_year = None
                        end_year = None
                        
                        # Parse start year
                        if groups[0].isdigit():
                            start_year = int(groups[0])
                        elif groups[1].isdigit():
                            start_year = int(groups[1])
                        
                        # Parse end year
                        if len(groups) >= 3 and groups[2] and groups[2].isdigit():
                            end_year = int(groups[2])
                        elif len(groups) >= 2 and groups[1] and groups[1].isdigit() and len(groups) == 2:
                            end_year = int(groups[1])
                        elif any(keyword in groups[-1].lower() for keyword in ['present', 'current', 'now']):
                            end_year = current_year
                        
                        if start_year and end_year and start_year <= end_year:
                            # Calculate months
                            if end_year == current_year:
                                months = (current_year - start_year) * 12 + current_month
                            else:
                                months = (end_year - start_year) * 12
                            
                            # Add some months for partial years (assume 6 months average)
                            if months > 0:
                                total_months += months
                                
                except (ValueError, IndexError):
                    continue
        
        # Convert months to years (round up)
        if total_months > 0:
            return max(1, round(total_months / 12))
        
        return None
    
    def _determine_experience_level(self, years: int) -> str:
        """Determine experience level based on years of experience."""
        if years >= 8:
            return "Senior"
        elif years >= 5:
            return "Mid-Senior"
        elif years >= 3:
            return "Mid"
        elif years >= 1:
            return "Junior"
        else:
            return "Entry"


# Global instance
ai_extractor = AIExtractor() 