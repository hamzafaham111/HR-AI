#!/usr/bin/env python3
"""
Test script to debug candidate addition issue.
This script will help identify where the problem is occurring.
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the current directory to the Python path
sys.path.insert(0, os.path.dirname(__file__))

from app.core.database import get_database
from app.repositories.mongodb_repository import MongoDBRepository
from app.models.mongodb_models import CandidateStageStatus
from bson import ObjectId

async def test_candidate_addition():
    """Test the candidate addition process."""
    print("🔍 Testing candidate addition process...")
    
    # Get database connection
    database = await get_database()
    repository = MongoDBRepository(database)
    
    try:
        # Find a test user
        users = await database.users.find().limit(1).to_list(1)
        if not users:
            print("❌ No users found in database")
            return
        
        user_id = str(users[0]['_id'])
        print(f"👤 Using test user: {user_id}")
        
        # Find a hiring process for this user
        processes = await database.hiring_processes.find({"user_id": ObjectId(user_id)}).limit(1).to_list(1)
        if not processes:
            print("❌ No hiring processes found for user")
            return
        
        process_id = str(processes[0]['_id'])
        process_data = processes[0]
        print(f"📋 Using hiring process: {process_data.get('process_name', 'Unknown')} ({process_id})")
        
        # Check if process has stages
        stages = process_data.get('stages', [])
        if not stages:
            print("❌ Process has no stages")
            return
        
        first_stage = min(stages, key=lambda s: s.get('order', 0))
        print(f"🎯 First stage: {first_stage.get('name')} (ID: {first_stage.get('id')})")
        
        # Check current candidates in the process
        current_candidates = process_data.get('candidates', [])
        print(f"👥 Current candidates in process: {len(current_candidates)}")
        
        for i, candidate in enumerate(current_candidates):
            print(f"  {i+1}. {candidate.get('candidate_name', 'Unknown')} -> Stage {candidate.get('current_stage_id', 'Unknown')}")
        
        # Find resume bank entries for this user
        resumes = await database.resume_bank_entries.find({"user_id": ObjectId(user_id)}).to_list(10)
        if not resumes:
            print("❌ No resume bank entries found for user")
            return
        
        print(f"📄 Found {len(resumes)} resume bank entries")
        
        # Try to find a resume that's not already in the process
        available_resume = None
        for resume in resumes:
            resume_id = str(resume['_id'])
            candidate_exists = any(
                str(candidate.get('resume_bank_entry_id')) == resume_id 
                for candidate in current_candidates
            )
            if not candidate_exists:
                available_resume = resume
                break
        
        if available_resume:
            resume_id = str(available_resume['_id'])
            resume_data = available_resume
            print(f"📄 Using available resume: {resume_data.get('candidate_name', 'Unknown')} ({resume_id})")
        else:
            # Use the first resume for testing conversion function
            resume_id = str(resumes[0]['_id'])
            resume_data = resumes[0]
            print(f"📄 Using first resume for testing: {resume_data.get('candidate_name', 'Unknown')} ({resume_id})")
        
        # Check if candidate is already in process
        candidate_exists = not available_resume  # If no available resume, then candidate exists
        
        if candidate_exists:
            print("⚠️  Candidate already exists in process")
            # Continue with testing the conversion function anyway
            print("\n🔄 Testing conversion function with existing data...")
            # Get the existing process for testing
            existing_process = await repository.get_hiring_process_by_id(process_id, user_id)
            updated_process = existing_process
        else:
            # Add candidate to process
            print("\n➕ Adding candidate to process...")
            updated_process = await repository.add_candidate_to_process(
                process_id=process_id,
                user_id=user_id,
                resume_bank_entry_id=resume_id,
                initial_stage_id=first_stage.get('id'),
                notes="Test addition"
            )
            
            if not updated_process:
                print("❌ Failed to add candidate")
                return
            
            print("✅ Candidate added successfully!")
            print(f"📊 Updated process has {len(updated_process.candidates)} candidates")
            
            # Verify the candidate was added correctly
            for candidate in updated_process.candidates:
                if str(candidate.resume_bank_entry_id) == resume_id:
                    print(f"✅ Found added candidate: {candidate.candidate_name}")
                    print(f"   Stage: {candidate.current_stage_id}")
                    print(f"   Status: {candidate.status}")
                    print(f"   Notes: {candidate.notes}")
                    break
            else:
                print("❌ Added candidate not found in updated process")
        
        # Test the conversion function
        print("\n🔄 Testing conversion function...")
        from app.api.hiring_processes import _convert_to_process_detail
        
        converted_process = await _convert_to_process_detail(updated_process, repository)
        print(f"📊 Converted process has {len(converted_process.candidates)} candidates")
        
        for candidate in converted_process.candidates:
            print(f"  - {candidate.candidate_name} -> {candidate.current_stage_name} ({candidate.current_stage_id})")
        
        # Check stage filtering
        print("\n🎯 Testing stage filtering...")
        print("Available stages:")
        for stage in converted_process.stages:
            print(f"  - {stage.name} (ID: {stage.id})")
        
        print("\nCandidates and their stages:")
        for candidate in converted_process.candidates:
            print(f"  - {candidate.candidate_name} -> Stage ID: {candidate.current_stage_id}")
            # Find matching stage
            matching_stage = None
            for stage in converted_process.stages:
                if stage.id == candidate.current_stage_id:
                    matching_stage = stage
                    break
            if matching_stage:
                print(f"    ✅ Matches stage: {matching_stage.name}")
            else:
                print(f"    ❌ No matching stage found!")
        
        print("\nStage candidate counts:")
        for stage in converted_process.stages:
            stage_candidates = [c for c in converted_process.candidates if c.current_stage_id == stage.id]
            print(f"  Stage {stage.name}: {len(stage_candidates)} candidates")
            for candidate in stage_candidates:
                print(f"    - {candidate.candidate_name}")
        
    except Exception as e:
        print(f"❌ Error during test: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_candidate_addition())
