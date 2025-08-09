import asyncio
from app.core.database import get_database
from app.models.mongodb_models import COLLECTIONS
from app.core.config import settings

async def test_fastapi_db():
    """Test using the exact same database connection logic as FastAPI"""
    
    # Use the same database connection logic as FastAPI
    db = await get_database()
    
    print(f"Database name: {db.name}")
    print(f"Database full name: {db.full_name}")
    
    # Test the exact same query as the registration endpoint
    test_email = "completelynew@test.com"
    
    # This is the exact same query used in the registration endpoint
    existing_user = await db[COLLECTIONS["users"]].find_one({"email": test_email})
    
    print(f"Query result for {test_email}: {existing_user}")
    
    if existing_user:
        print("User exists!")
        print(f"User details: {existing_user}")
    else:
        print("User does not exist - should be able to register")
        
        # Try to create the user
        user_doc = {
            "name": "Test User",
            "email": test_email,
            "hashed_password": "test_hash",
            "role": "user",
            "company": None,
            "phone": None,
            "is_active": True,
            "is_superuser": False,
            "created_at": asyncio.get_event_loop().time(),
            "updated_at": asyncio.get_event_loop().time()
        }
        
        result = await db[COLLECTIONS["users"]].insert_one(user_doc)
        print(f"Insert result: {result.inserted_id}")
        
        # Check if user was created
        created_user = await db[COLLECTIONS["users"]].find_one({"email": test_email})
        print(f"Created user check: {created_user}")

if __name__ == "__main__":
    asyncio.run(test_fastapi_db()) 