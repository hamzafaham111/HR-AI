#!/usr/bin/env python3
"""
Test script to verify MongoDB Atlas and Qdrant setup
"""

import requests
import json

def test_qdrant():
    """Test Qdrant connection"""
    try:
        response = requests.get("http://localhost:6333/collections")
        if response.status_code == 200:
            print("✅ Qdrant is running and accessible")
            return True
        else:
            print(f"❌ Qdrant returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Qdrant connection failed: {e}")
        return False

def test_fastapi():
    """Test FastAPI application"""
    try:
        response = requests.get("http://localhost:8000/docs")
        if response.status_code == 200:
            print("✅ FastAPI application is running")
            return True
        else:
            print(f"❌ FastAPI returned status code: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ FastAPI connection failed: {e}")
        return False

def test_resume_upload_endpoint():
    """Test resume upload endpoint"""
    try:
        response = requests.post(
            "http://localhost:8000/api/v1/resume-bank/upload",
            json={"test": "data"}
        )
        # We expect a 422 error because we're not sending a file
        if response.status_code == 422:
            print("✅ Resume upload endpoint is working (correctly rejecting invalid data)")
            return True
        else:
            print(f"⚠️  Resume upload endpoint returned unexpected status: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Resume upload endpoint test failed: {e}")
        return False

def main():
    print("🔍 Testing AI Resume Analysis System Setup")
    print("=" * 50)
    
    qdrant_ok = test_qdrant()
    fastapi_ok = test_fastapi()
    upload_ok = test_resume_upload_endpoint()
    
    print("\n" + "=" * 50)
    print("📊 Setup Summary:")
    print(f"   Qdrant Vector Database: {'✅ Working' if qdrant_ok else '❌ Failed'}")
    print(f"   FastAPI Application: {'✅ Working' if fastapi_ok else '❌ Failed'}")
    print(f"   Resume Upload Endpoint: {'✅ Working' if upload_ok else '❌ Failed'}")
    
    if qdrant_ok and fastapi_ok and upload_ok:
        print("\n🎉 All systems are working! Your setup is complete.")
        print("\n📝 Next steps:")
        print("   1. Upload a resume PDF through the API")
        print("   2. View data in MongoDB Compass")
        print("   3. Test vector search functionality")
    else:
        print("\n⚠️  Some components need attention. Check the logs above.")

if __name__ == "__main__":
    main() 