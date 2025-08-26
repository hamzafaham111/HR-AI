#!/usr/bin/env python3
"""
Script to check raw MongoDB data for hiring processes.
"""

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# MongoDB connection
MONGODB_URL = "mongodb+srv://hamzafaham111:hamzafaham123@cluster0.w7msp.mongodb.net/2025-pet"
DATABASE_NAME = "resume_analysis"

async def check_raw_data():
    """Check raw MongoDB data for hiring processes."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DATABASE_NAME]
    hiring_processes = db.hiring_processes
    
    print("🔍 Checking raw MongoDB data...")
    
    # Find the specific process
    process_id = "68a8ea055c0fbb77e0ea621f"
    process = await hiring_processes.find_one({"_id": ObjectId(process_id)})
    
    if process:
        print(f"📋 Process: {process.get('process_name')}")
        print(f"🆔 Process ID: {process['_id']}")
        
        candidates = process.get('candidates', [])
        print(f"👥 Total candidates: {len(candidates)}")
        
        # Check each candidate
        for i, candidate in enumerate(candidates):
            print(f"\n👤 Candidate {i+1}:")
            print(f"   ID: {candidate.get('id')}")
            print(f"   Name: {candidate.get('candidate_name')}")
            print(f"   Email: {candidate.get('candidate_email')}")
            print(f"   Resume Bank ID: {candidate.get('resume_bank_entry_id')}")
            print(f"   Job App ID: {candidate.get('job_application_id')}")
            print(f"   Stage ID: {candidate.get('current_stage_id')}")
            print(f"   Status: {candidate.get('status')}")
            print(f"   Assigned: {candidate.get('assigned_at')}")
            
            # Check if this candidate has an 'id' field
            if 'id' not in candidate:
                print("   ⚠️  NO 'id' FIELD!")
            else:
                print(f"   ✅ Has 'id' field: {candidate['id']}")
    else:
        print(f"❌ Process {process_id} not found")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(check_raw_data())

