from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# MongoDB Atlas connection settings
MONGODB_URL = os.getenv('MONGODB_URL', "mongodb+srv://prathmesh18:FWGAGN8iu7nBY9z0@cluster1.pmfqlsq.mongodb.net/")
DATABASE_NAME = os.getenv('DATABASE_NAME', "todo_db")

class MongoDB:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

async def connect_to_mongo():
    """Connect to MongoDB."""
    try:
        logger.info("Connecting to MongoDB...")
        MongoDB.client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=5000  # 5 second timeout
        )
        
        # Verify the connection
        await MongoDB.client.server_info()
        
        MongoDB.db = MongoDB.client[DATABASE_NAME]
        
        # Create indexes
        await MongoDB.db.study_profiles.create_index("user_id")
        await MongoDB.db.study_tips.create_index("user_id")
        await MongoDB.db.todolists.create_index("user_id")
        
        logger.info("Connected to MongoDB successfully")
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {str(e)}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection."""
    try:
        if MongoDB.client:
            MongoDB.client.close()
            MongoDB.client = None
            MongoDB.db = None
            logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {str(e)}")
        raise

def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Get database instance."""
    if MongoDB.db is None:
        logger.warning("Database connection not initialized")
        return None
    return MongoDB.db