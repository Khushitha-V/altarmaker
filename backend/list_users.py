"""
Script to list all users in the database with their roles and status.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def list_all_users():
    # Load environment variables
   
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Get all users (excluding password hashes for security)
    users = db.users.find({}, {'password': 0}).sort('created_at', -1)
    
    logger.info("\n" + "="*80)
    logger.info(f"{'USERNAME':<20} | {'EMAIL':<30} | {'ROLE':<10} | {'VERIFIED':<8} | CREATED AT")
    logger.info("-"*80)
    
    user_count = 0
    for user in users:
        user_count += 1
        logger.info(f"{user.get('username', 'N/A'):<20} | "
              f"{user.get('email', 'N/A'):<30} | "
              f"{user.get('role', 'user'):<10} | "
              f"{str(user.get('email_verified', False)):<8} | "
              f"{user.get('created_at', 'N/A')}")
    
    logger.info("="*80)
    logger.info(f"Total users: {user_count}")
    logger.info("="*80)

if __name__ == "__main__":
    list_all_users()