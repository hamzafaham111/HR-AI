import asyncio
from app.core.database import get_database
from app.models.mongodb_models import COLLECTIONS

async def check_users():
    db = await get_database()
    users = await db[COLLECTIONS['users']].find().to_list(length=10)
    print(f'Found {len(users)} users:')
    for user in users:
        print(f'- Email: {user.get("email", "No email")}, Name: {user.get("name", "No name")}')

if __name__ == "__main__":
    asyncio.run(check_users()) 