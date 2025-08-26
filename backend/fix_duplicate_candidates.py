#!/usr/bin/env python3
"""
Script to fix duplicate candidate IDs in existing hiring processes.
This will generate unique UUIDs for candidates that have duplicate IDs.
"""

import asyncio
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb+srv://hamzafaham111:hamzafaham123@cluster0.w7msp.mongodb.net/2025-pet"
DATABASE_NAME = "resume_analysis"

async def fix_duplicate_candidates():
    """Fix duplicate candidate IDs in hiring processes."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    hiring_processes = db.hiring_processes
    
    print("🔍 Finding hiring processes with duplicate candidate IDs...")
    
    # Find all hiring processes
    processes = await hiring_processes.find({}).to_list(length=None)
    
    for process in processes:
        process_id = process['_id']
        candidates = process.get('candidates', [])
        
        # Check for duplicate IDs
        seen_ids = set()
        duplicate_ids = set()
        
        for candidate in candidates:
            candidate_id = candidate.get('id')
            if candidate_id:
                if candidate_id in seen_ids:
                    duplicate_ids.add(candidate_id)
                else:
                    seen_ids.add(candidate_id)
        
        if duplicate_ids:
            print(f"⚠️  Process {process_id} has duplicate candidate IDs: {duplicate_ids}")
            
            # Fix duplicate candidates by generating new unique IDs
            updated_candidates = []
            for candidate in candidates:
                if candidate.get('id') in duplicate_ids:
                    # Generate new unique ID
                    new_id = str(uuid.uuid4())
                    candidate['id'] = new_id
                    candidate['updated_at'] = datetime.utcnow()
                    print(f"   🔄 Generated new ID {new_id} for candidate {candidate.get('candidate_name')}")
                
                updated_candidates.append(candidate)
            
            # Update the process
            result = await hiring_processes.update_one(
                {"_id": process_id},
                {
                    "$set": {
                        "candidates": updated_candidates,
                        "updated_at": datetime.utcnow()
                    }
                }
            )
            
            if result.modified_count > 0:
                print(f"   ✅ Fixed duplicate candidates in process {process_id}")
            else:
                print(f"   ❌ Failed to update process {process_id}")
        else:
            print(f"✅ Process {process_id} has no duplicate candidate IDs")
    
    print("\n🎉 Duplicate candidate ID fix completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_duplicate_candidates())

