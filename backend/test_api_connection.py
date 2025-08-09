import asyncio
import aiohttp
import json

async def test_api_connection():
    # Test the registration endpoint
    url = "http://localhost:8000/api/v1/auth/register"
    
    # Test data
    test_data = {
        "name": "API Test User",
        "email": "apitest@example.com",
        "password": "testpassword123",
        "role": "user"
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=test_data) as response:
            print(f"Status: {response.status}")
            print(f"Response: {await response.text()}")
            
            if response.status == 200:
                print("Registration successful!")
            elif response.status == 400:
                print("Registration failed - likely email already exists")

if __name__ == "__main__":
    asyncio.run(test_api_connection()) 