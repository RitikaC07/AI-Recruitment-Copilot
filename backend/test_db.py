import asyncio
from app.database import db

async def test():
    try:
        await db.command("ping")
        print("✅ Connected to MongoDB successfully!")
    except Exception as e:
        print("❌ Connection failed:")
        print(e)

asyncio.run(test())