from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
import logging
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection settings
MONGODB_URL = "mongodb+srv://prathmesh18:FWGAGN8iu7nBY9z0@cluster1.pmfqlsq.mongodb.net/"
DATABASE_NAME = "todo_db"

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

async def connect_to_mongo():
    """Connect to MongoDB Atlas."""
    try:
        logger.info("Attempting to connect to MongoDB Atlas...")
        MongoDB.client = AsyncIOMotorClient(MONGODB_URL)
        MongoDB.db = MongoDB.client[DATABASE_NAME]
        
        # Verify connection
        await MongoDB.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB Atlas!")
        
        # Create indexes
        await MongoDB.db.users.create_index("email", unique=True)
        await MongoDB.db.users.create_index("username", unique=True)
        await MongoDB.db.todolists.create_index("user_id")
        logger.info("Database indexes created successfully")
        
        # List collections
        collections = await MongoDB.db.list_collection_names()
        logger.info(f"Available collections: {', '.join(collections) if collections else 'No collections yet'}")
        
        return MongoDB.db
    except Exception as e:
        logger.error(f"Could not connect to MongoDB Atlas: {e}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    if MongoDB.client:
        MongoDB.client.close()
        logger.info("MongoDB connection closed")

def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Get database instance."""
    if MongoDB.db is None:
        logger.warning("Database connection not initialized")
        return None
    return MongoDB.db