#!/usr/bin/env python3
"""
Script to fix existing resume bank entries with improved data extraction.

This script will:
1. Re-process existing resume bank entries with improved PDF extraction
2. Fix candidate names, locations, and other information
3. Update skills count and other data inconsistencies
4. Improve the overall data quality in the resume bank
"""

import sys
import os
import json
from datetime import datetime

# Add the backend directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.database_models import ResumeBankEntry
from app.utils.pdf_processor import PDFProcessor
from app.core.logger import logger


def fix_existing_resume_data():
    """Fix existing resume bank entries with improved data extraction."""
    db = SessionLocal()
    try:
        # Get all resume bank entries
        entries = db.query(ResumeBankEntry).all()
        
        print(f"Found {len(entries)} resume bank entries to process...")
        
        fixed_count = 0
        for entry in entries:
            try:
                updated = False
                
                # Get the resume analysis data
                if not entry.resume_analysis:
                    print(f"Skipping entry {entry.id}: No resume analysis data")
                    continue
                
                # Extract raw text from resume analysis
                # Handle both dict and object formats
                if isinstance(entry.resume_analysis, dict):
                    raw_text = entry.resume_analysis.get('raw_text', '')
                else:
                    # It's a ResumeAnalysis object
                    raw_text = getattr(entry.resume_analysis, 'raw_text', '')
                
                if not raw_text:
                    print(f"Skipping entry {entry.id}: No raw text available")
                    continue
                
                # Extract candidate information using improved algorithm
                extracted_info = PDFProcessor.extract_candidate_info_from_text(raw_text)
                
                # Fix candidate name if it's a job title
                if (extracted_info["name"] and 
                    (entry.candidate_name in ["Unknown", "unknown@example.com"] or
                     any(title in entry.candidate_name.lower() for title in ['engineer', 'developer', 'full stack', 'software']))):
                    entry.candidate_name = extracted_info["name"]
                    updated = True
                    print(f"Fixed name for {entry.id}: {extracted_info['name']}")
                
                # Fix email if missing or incorrect
                if (extracted_info["email"] and 
                    (not entry.candidate_email or entry.candidate_email == "unknown@example.com")):
                    entry.candidate_email = extracted_info["email"]
                    updated = True
                    print(f"Fixed email for {entry.id}: {extracted_info['email']}")
                
                # Fix phone if missing
                if extracted_info["phone"] and not entry.candidate_phone:
                    entry.candidate_phone = extracted_info["phone"]
                    updated = True
                    print(f"Fixed phone for {entry.id}: {extracted_info['phone']}")
                
                # Fix location if missing or contains tech terms
                if (extracted_info["location"] and 
                    (not entry.candidate_location or 
                     any(tech in entry.candidate_location.lower() for tech in ['react', 'node', 'python', 'javascript', 'material', 'tailwind', 'bootstrap', 'flask', 'fastapi', 'mongodb', 'mysql', 'postgresql', 'aws', 'docker', 'git', 'github', 'figma', 'redux', 'express', 'next', 'vue', 'angular', 'typescript', 'html', 'css', 'php', 'c++', 'deno', 'strapi', 'redis', 'cassandra', 'lambda', 'ec2', 's3', 'kubernetes', 'graphql', 'socket', 'saga', 'recoil', 'gsap', 'swiper', 'mantine', 'ant design', 'axios', 'postman', 'clarity', 'console', 'sitemap', 'analytics', 'seo', 'cms', 'mern', 'three', 'model-viewer', 'selenium', 'openai', 'langchain', 'blockchain', 'crypto', 'ar', 'vr', 'webar', '3d', 'unreal', 'unity', 'blender', 'maya', 'autocad', 'sketchup', 'lumion', 'vray', 'corona', 'twinmotion', 'enscape', 'd5', 'keyshot', 'substance', 'zbrush', 'mudbox', 'mari', 'nuke', 'houdini', 'cinema', 'after effects', 'premiere', 'photoshop', 'illustrator', 'indesign', 'figma', 'sketch', 'invision', 'framer', 'webflow', 'wordpress', 'shopify', 'woocommerce', 'magento', 'prestashop', 'opencart', 'oscommerce', 'zen cart', 'bigcommerce', 'squarespace', 'wix', 'weebly', 'tumblr', 'medium', 'ghost', 'jekyll', 'hugo', 'gatsby', 'eleventy', 'nextra', 'docusaurus', 'storybook', 'chromatic', 'percy', 'cypress', 'jest', 'mocha', 'chai', 'sinon', 'enzyme', 'testing library', 'playwright', 'puppeteer', 'selenium', 'appium', 'detox', 'eslint', 'prettier', 'husky', 'lint-staged', 'commitlint', 'conventional commits', 'semantic release', 'changesets', 'lerna', 'nx', 'turborepo', 'yarn', 'npm', 'pnpm', 'bun', 'vite', 'webpack', 'rollup', 'parcel', 'esbuild', 'swc', 'babel', 'typescript', 'flow', 'proptypes']))):
                    entry.candidate_location = extracted_info["location"]
                    updated = True
                    print(f"Fixed location for {entry.id}: {extracted_info['location']}")
                
                # Fix experience years if missing
                if extracted_info["experience_years"] and not entry.years_experience:
                    entry.years_experience = extracted_info["experience_years"]
                    updated = True
                    print(f"Fixed experience for {entry.id}: {extracted_info['experience_years']} years")
                
                # Fix current role if missing
                if extracted_info["current_role"] and not entry.current_role:
                    entry.current_role = extracted_info["current_role"]
                    updated = True
                    print(f"Fixed current role for {entry.id}: {extracted_info['current_role']}")
                
                # Update resume analysis with improved data
                if entry.resume_analysis:
                    # Handle both dict and object formats
                    if isinstance(entry.resume_analysis, dict):
                        analysis_data = entry.resume_analysis
                    else:
                        # Convert ResumeAnalysis object to dict
                        analysis_data = {
                            'raw_text': getattr(entry.resume_analysis, 'raw_text', ''),
                            'summary': getattr(entry.resume_analysis, 'summary', ''),
                            'expertise_areas': getattr(entry.resume_analysis, 'expertise_areas', []),
                            'strong_zones': getattr(entry.resume_analysis, 'strong_zones', []),
                            'overall_assessment': getattr(entry.resume_analysis, 'overall_assessment', ''),
                            'status': getattr(entry.resume_analysis, 'status', 'completed')
                        }
                    
                    # Update summary if it's generic
                    if (not analysis_data.get('summary') or 
                        analysis_data.get('summary') == "Resume uploaded to bank" or
                        len(analysis_data.get('summary', '')) < 20):
                        
                        # Create improved summary
                        summary_parts = []
                        if entry.candidate_name and entry.candidate_name != "Unknown":
                            summary_parts.append(f"Professional resume for {entry.candidate_name}")
                        if entry.current_role:
                            summary_parts.append(f"Current role: {entry.current_role}")
                        if entry.years_experience:
                            summary_parts.append(f"Experience: {entry.years_experience} years")
                        if extracted_info.get("skills"):
                            summary_parts.append(f"Key skills: {', '.join(extracted_info['skills'][:3])}")
                        
                        new_summary = ". ".join(summary_parts) if summary_parts else "Professional resume with relevant experience and skills"
                        analysis_data['summary'] = new_summary
                        updated = True
                        print(f"Updated summary for {entry.id}")
                    
                    # Update expertise areas with extracted skills
                    if extracted_info.get("skills"):
                        from app.models.resume import Expertise
                        
                        expertise_areas = []
                        for skill in extracted_info["skills"][:5]:  # Top 5 skills
                            expertise_areas.append({
                                "name": skill,
                                "level": "Intermediate",
                                "description": f"Experience with {skill}",
                                "confidence": 0.8
                            })
                        
                        if expertise_areas:
                            analysis_data['expertise_areas'] = expertise_areas
                            updated = True
                            print(f"Updated expertise areas for {entry.id}: {len(expertise_areas)} skills")
                    
                    # Update strong zones
                    strong_zones = []
                    
                    if extracted_info.get("education"):
                        strong_zones.append({
                            "name": "Education",
                            "description": f"Educational background: {extracted_info['education']}",
                            "evidence": "Resume contains educational information",
                            "impact": "High"
                        })
                    
                    if entry.current_role:
                        strong_zones.append({
                            "name": "Current Role",
                            "description": f"Currently working as {entry.current_role}",
                            "evidence": f"Resume indicates current position as {entry.current_role}",
                            "impact": "High"
                        })
                    
                    if entry.years_experience:
                        strong_zones.append({
                            "name": "Experience",
                            "description": f"{entry.years_experience} years of professional experience",
                            "evidence": f"Resume shows {entry.years_experience} years of experience",
                            "impact": "High"
                        })
                    
                    if strong_zones:
                        analysis_data['strong_zones'] = strong_zones
                        updated = True
                        print(f"Updated strong zones for {entry.id}: {len(strong_zones)} zones")
                    
                    # Update overall assessment
                    assessment_parts = []
                    if entry.years_experience and entry.years_experience >= 3:
                        assessment_parts.append("Experienced professional")
                    if extracted_info.get("skills"):
                        assessment_parts.append(f"Skilled in {len(extracted_info['skills'])} technologies")
                    if extracted_info.get("education"):
                        assessment_parts.append("Educated candidate")
                    
                    new_assessment = ". ".join(assessment_parts) if assessment_parts else "Qualified candidate with relevant experience"
                    analysis_data['overall_assessment'] = new_assessment
                    updated = True
                    
                    # Update the resume analysis in the database
                    entry.resume_analysis = analysis_data
                
                if updated:
                    entry.updated_date = datetime.now()
                    fixed_count += 1
                    # Commit changes for this entry immediately
                    db.commit()
                    print(f"✅ Committed changes for entry {entry.id}")
                
            except Exception as e:
                print(f"Error processing entry {entry.id}: {e}")
                continue
        
        # Commit all changes
        # db.commit()  # Removed since we commit after each entry
        
        print(f"✅ Successfully fixed {fixed_count} out of {len(entries)} resume bank entries")
        
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🔧 Starting resume bank data fix...")
    fix_existing_resume_data()
    print("✅ Resume bank data fix completed!") 