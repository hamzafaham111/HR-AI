#!/usr/bin/env python3
"""
Test script to examine candidate data structure in the database
"""

import asyncio
import sys
import os

# Add the app directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.database import get_database
from app.repositories.mongodb_repository import MongoDBRepository

async def examine_candidate_data():
    """Examine the actual candidate data structure in the database"""
    print("🔍 Examining candidate data structure...")
    
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
        print()
        
        # Examine each candidate in detail
        for i, candidate in enumerate(process.candidates):
            print(f"🔍 Candidate {i+1}:")
            print(f"   Type: {type(candidate)}")
            
            if hasattr(candidate, '__dict__'):
                print(f"   Attributes: {candidate.__dict__}")
            elif isinstance(candidate, dict):
                print(f"   Dictionary keys: {list(candidate.keys())}")
                for key, value in candidate.items():
                    print(f"     {key}: {value} (type: {type(value)})")
            else:
                print(f"   Raw value: {candidate}")
            
            print()
        
        # Also check the raw MongoDB document
        print("🗄️ Checking raw MongoDB document...")
        from bson import ObjectId
        process_object_id = ObjectId(process_id)
        user_object_id = ObjectId(user_id)
        
        raw_doc = await database.hiring_processes.find_one({
            "_id": process_object_id,
            "user_id": user_object_id
        })
        
        if raw_doc:
            print(f"📄 Raw document found with {len(raw_doc.get('candidates', []))} candidates")
            for i, candidate in enumerate(raw_doc.get('candidates', [])):
                print(f"   Raw Candidate {i+1}:")
                if isinstance(candidate, dict):
                    for key, value in candidate.items():
                        print(f"     {key}: {value} (type: {type(value)})")
                else:
                    print(f"     Raw: {candidate}")
                print()
        else:
            print("❌ Raw document not found")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(examine_candidate_data())
