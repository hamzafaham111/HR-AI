import asyncio
from app.core.database import get_database
from app.models.mongodb_models import COLLECTIONS
from app.api.auth import get_password_hash

async def debug_registration():
    db = await get_database()
    
    # Test email
    test_email = "debug@test.com"
    
    print(f"Testing registration for email: {test_email}")
    
    # Check if user exists
    existing_user = await db[COLLECTIONS["users"]].find_one({"email": test_email})
    print(f"Existing user check result: {existing_user}")
    
    if existing_user:
        print("User already exists!")
        return
    
    # Try to create user
    user_doc = {
        "name": "Debug User",
        "email": test_email,
        "hashed_password": get_password_hash("testpassword123"),
        "role": "user",
        "company": None,
        "phone": None,
        "is_active": True,
        "is_superuser": False,
        "created_at": asyncio.get_event_loop().time(),
        "updated_at": asyncio.get_event_loop().time()
    }
    
    print("Attempting to insert user...")
    result = await db[COLLECTIONS["users"]].insert_one(user_doc)
    print(f"Insert result: {result.inserted_id}")
    
    # Check if user was created
    created_user = await db[COLLECTIONS["users"]].find_one({"email": test_email})
    print(f"Created user check: {created_user}")
    
    # List all users
    all_users = await db[COLLECTIONS["users"]].find().to_list(length=10)
    print(f"Total users in database: {len(all_users)}")
    for user in all_users:
        print(f"- {user.get('email')}")

if __name__ == "__main__":
    asyncio.run(debug_registration()) 