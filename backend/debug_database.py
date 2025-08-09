import asyncio
from app.core.database import get_database
from app.models.mongodb_models import COLLECTIONS
from app.core.config import settings

async def debug_database():
    print(f"Database URL: {settings.mongodb_url}")
    print(f"Database Name: {settings.database_name}")
    
    db = await get_database()
    print(f"Database instance: {db}")
    print(f"Database name: {db.name}")
    
    # List all collections
    collections = await db.list_collection_names()
    print(f"Collections: {collections}")
    
    # Check users collection
    users_collection = db[COLLECTIONS["users"]]
    print(f"Users collection: {users_collection}")
    
    # Count users
    user_count = await users_collection.count_documents({})
    print(f"Total users: {user_count}")
    
    # List all users
    users = await users_collection.find().to_list(length=10)
    print(f"Users found: {len(users)}")
    for user in users:
        print(f"- Email: {user.get('email')}, Name: {user.get('name')}, ID: {user.get('_id')}")
    
    # Test email query
    test_email = "apitest@example.com"
    existing_user = await users_collection.find_one({"email": test_email})
    print(f"Query for {test_email}: {existing_user}")
    
    # Test with a completely new email
    new_email = "completelynew@test.com"
    existing_user2 = await users_collection.find_one({"email": new_email})
    print(f"Query for {new_email}: {existing_user2}")

if __name__ == "__main__":
    asyncio.run(debug_database()) 