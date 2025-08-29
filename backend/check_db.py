"""
Script to check database structure and user accounts.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

  # Load environment variables
load_dotenv()

def check_database():
  
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Get list of all collections
    logger.info("\nCollections in database:")
    logger.info("-" * 40)
    collections = db.list_collection_names()
    for col in collections:
        logger.info(f"- {col}")
    
    # Check users collection
    if 'users' not in collections:
        logger.info("\n❌ 'users' collection not found!")
        return
    
    # Get user count
    user_count = db.users.count_documents({})
    logger.info(f"\nTotal users in database: {user_count}")
    
    # Get admin users
    admin_users = list(db.users.find({"role": "admin"}))
    logger.info(f"\nFound {len(admin_users)} admin users")
    
    if admin_users:
        logger.info("\nAdmin user details:")
        logger.info("-" * 40)
        for i, user in enumerate(admin_users, 1):
            logger.info(f"\nAdmin User #{i}:")
            logger.info("-" * 30)
            # logger.info user details excluding sensitive data
            user_data = {k: v for k, v in user.items() if k != 'password' and k != '_id'}
            for key, value in user_data.items():
                logger.info(f"{key}: {value}")
    
    # Check for any users (first 5)
    logger.info("\nSample of users in database:")
    logger.info("-" * 40)
    for user in db.users.find().limit(5):
        logger.info(f"\nUsername: {user.get('username')}")
        logger.info(f"Email: {user.get('email')}")
        logger.info(f"Role: {user.get('role', 'user')}")
        logger.info(f"Verified: {user.get('email_verified', False)}")
        logger.info("-" * 20)

if __name__ == "__main__":
    check_database()