#!/usr/bin/env python3
"""
Script to add unique IDs to all existing candidates in hiring processes.
This will fix the duplicate ID issue that's preventing candidate removal.
"""

import asyncio
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime

# MongoDB connection
MONGODB_URL = "mongodb+srv://hamzafaham111:hamzafaham123@cluster0.w7msp.mongodb.net/2025-pet"
DATABASE_NAME = "resume_analysis"

async def fix_candidate_ids():
    """Add unique IDs to all existing candidates in hiring processes."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    hiring_processes = db.hiring_processes
    
    print("🔍 Finding hiring processes to fix candidate IDs...")
    
    # Find all hiring processes
    processes = await hiring_processes.find({}).to_list(length=None)
    
    for process in processes:
        process_id = process['_id']
        candidates = process.get('candidates', [])
        
        if not candidates:
            print(f"✅ Process {process_id} has no candidates")
            continue
        
        print(f"🔧 Process {process_id}: {len(candidates)} candidates")
        
        # Check if candidates already have IDs
        candidates_with_ids = [c for c in candidates if c.get('id')]
        candidates_without_ids = [c for c in candidates if not c.get('id')]
        
        if candidates_without_ids:
            print(f"   ⚠️  {len(candidates_without_ids)} candidates need unique IDs")
            
            # Update candidates without IDs
            updated_candidates = []
            for candidate in candidates:
                if not candidate.get('id'):
                    # Generate unique ID
                    new_id = str(uuid.uuid4())
                    candidate['id'] = new_id
                    candidate['updated_at'] = datetime.utcnow()
                    print(f"   🔄 Added ID {new_id[:8]}... for {candidate.get('candidate_name')}")
                
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
                print(f"   ✅ Fixed {len(candidates_without_ids)} candidates in process {process_id}")
            else:
                print(f"   ❌ Failed to update process {process_id}")
        else:
            print(f"   ✅ All candidates already have unique IDs")
    
    print("\n🎉 Candidate ID fix completed!")
    client.close()

if __name__ == "__main__":
    asyncio.run(fix_candidate_ids())

