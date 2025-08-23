#!/usr/bin/env python3
"""
Test script to verify the move candidate API functionality
"""

import asyncio
import sys
import os
from datetime import datetime

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_database
from app.repositories.mongodb_repository import MongoDBRepository
from app.api.hiring_processes import move_candidate_stage
from app.models.hiring_process import CandidateStageMove
from app.models.mongodb_models import UserDocument

async def test_move_api():
    """Test the move candidate API functionality"""
    print("🔍 Testing move candidate API...")
    
    try:
        # Get database connection
        database = await get_database()
        repository = MongoDBRepository(database)
        
        # Test user ID and process ID from previous tests
        user_id = "689241448cd9373b2444bb86"
        process_id = "68979680e0854318a0b0428a"
        
        print(f"👤 Using test user: {user_id}")
        print(f"📋 Using hiring process: {process_id}")
        
        # Get the process to see candidates
        process = await repository.get_hiring_process_by_id(process_id, user_id)
        if not process:
            print("❌ Process not found")
            return
        
        print(f"📊 Process has {len(process.candidates)} candidates")
        
        # Show candidate details
        for i, candidate in enumerate(process.candidates):
            print(f"  {i+1}. {candidate.candidate_name} -> Stage {candidate.current_stage_id}")
            if hasattr(candidate, 'resume_bank_entry_id') and candidate.resume_bank_entry_id:
                print(f"     Resume ID: {candidate.resume_bank_entry_id}")
            if hasattr(candidate, 'job_application_id') and candidate.job_application_id:
                print(f"     Job App ID: {candidate.job_application_id}")
            print()
        
        # Test moving a candidate
        if len(process.candidates) > 0:
            candidate = process.candidates[0]
            candidate_id = candidate.resume_bank_entry_id or candidate.job_application_id
            
            if candidate_id:
                print(f"🎯 Testing move for candidate: {candidate.candidate_name}")
                print(f"   Current stage: {candidate.current_stage_id}")
                print(f"   Candidate ID: {candidate_id}")
                
                # Find a different stage to move to
                target_stage = None
                for stage in process.stages:
                    if stage.id != candidate.current_stage_id:
                        target_stage = stage
                        break
                
                if target_stage:
                    print(f"   Target stage: {target_stage.name} ({target_stage.id})")
                    
                    # Create move data
                    move_data = CandidateStageMove(
                        new_stage_id=target_stage.id,
                        status="pending",
                        notes="Test move via API"
                    )
                    
                    # Create a mock user document
                    mock_user = UserDocument(
                        id=candidate_id,  # This is just for testing
                        email="test@example.com",
                        full_name="Test User",
                        is_active=True,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )
                    
                    print("🚀 Attempting to move candidate...")
                    
                    # Test the move function directly
                    try:
                        # This would normally be called via the API endpoint
                        # For now, let's test the repository method directly
                        updated_process = await repository.move_candidate_stage(
                            process_id=process_id,
                            user_id=user_id,
                            candidate_id=str(candidate_id),
                            new_stage_id=target_stage.id,
                            new_status="pending",
                            notes="Test move via repository"
                        )
                        
                        if updated_process:
                            print("✅ Move successful via repository!")
                            
                            # Find the moved candidate
                            moved_candidate = None
                            for c in updated_process.candidates:
                                c_id = c.resume_bank_entry_id or c.job_application_id
                                if str(c_id) == str(candidate_id):
                                    moved_candidate = c
                                    break
                            
                            if moved_candidate:
                                print(f"   New stage: {moved_candidate.current_stage_id}")
                                print(f"   New status: {moved_candidate.status}")
                            else:
                                print("❌ Moved candidate not found in updated process")
                        else:
                            print("❌ Move failed via repository")
                            
                    except Exception as e:
                        print(f"❌ Error during move: {e}")
                        import traceback
                        traceback.print_exc()
                else:
                    print("❌ No target stage found")
            else:
                print("❌ Candidate has no valid ID")
        else:
            print("❌ No candidates found in process")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_move_api())
