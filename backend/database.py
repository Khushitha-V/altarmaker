from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.mongo_uri = os.getenv('MONGO_URI')
        
    def connect(self):
        """Connect to MongoDB"""
        try:
            self.client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=5000)
            # Test the connection
            self.client.admin.command('ping')
            self.db = self.client.altarmaker
            logger.info("Successfully connected to MongoDB")
            return True
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error connecting to MongoDB: {e}")
            return False
    
    def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Users collection indexes
            self.db.users.create_index("username", unique=True)
            self.db.users.create_index("email", unique=True)
            self.db.users.create_index("role")
            self.db.users.create_index("created_at")
            
            # Sessions collection indexes
            self.db.sessions.create_index("user_id")
            self.db.sessions.create_index("created_at")
            self.db.sessions.create_index([("user_id", 1), ("created_at", -1)])
            

            
            logger.info("Database indexes created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            return False
    
    def get_collection(self, collection_name):
        """Get a MongoDB collection"""
        if not self.db:
            raise Exception("Database not connected")
        return self.db[collection_name]
    
    def health_check(self):
        """Check database health"""
        try:
            # Test connection
            self.client.admin.command('ping')
            
            # Check collections exist
            collections = self.db.list_collection_names()
            
            # Get basic stats
            user_count = self.db.users.count_documents({})
            session_count = self.db.sessions.count_documents({})
            
            return {
                'status': 'healthy',
                'collections': collections,
                'user_count': user_count,
                'session_count': session_count
            }
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }

# Global database manager instance
db_manager = DatabaseManager()

def init_database():
    """Initialize database connection and create indexes"""
    if db_manager.connect():
        try:
            # Create indexes for better performance
            db = db_manager.db
            
            # Users collection indexes
            db.users.create_index("username", unique=True)
            db.users.create_index("email", unique=True)
            db.users.create_index("role")
            db.users.create_index("created_at")
            
            # Sessions collection indexes
            db.sessions.create_index("user_id")
            db.sessions.create_index("created_at")
            db.sessions.create_index([("user_id", 1), ("created_at", -1)])
            
            # Wall designs collection indexes (new)
            db.wall_designs.create_index("user_id")
            db.wall_designs.create_index("created_at")
            db.wall_designs.create_index([("user_id", 1), ("created_at", -1)])
            db.wall_designs.create_index("room_type")
            
            logger.info("Database indexes created successfully")
            return True
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            return False
    else:
        return False

def get_db():
    """Get the database instance"""
    return db_manager.db

def get_collection(collection_name):
    """Get a collection from the database"""
    return db_manager.get_collection(collection_name)

def health_check():
    """Check database health"""
    return db_manager.health_check()