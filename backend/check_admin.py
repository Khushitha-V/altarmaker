"""
Script to check admin user details in the database.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv
import logging

load_dotenv()
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_admin_user():
    # Load environment variables
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Find admin user
    admin = db.users.find_one({'role': 'admin'})
    
    if not admin:
        logger.info("No admin user found in the database.")
        return
    
    # logger.info admin details (excluding sensitive data)
    logger.info("\nAdmin User Details:")
    logger.info("-" * 40)
    logger.info(f"Username: {admin.get('username')}")
    logger.info(f"Email: {admin.get('email')}")
    logger.info(f"Role: {admin.get('role')}")
    logger.info(f"Email Verified: {admin.get('email_verified', False)}")
    logger.info(f"Account Active: {admin.get('is_active', True)}")
    logger.info(f"Last Login: {admin.get('last_login')}")
    logger.info(f"Created At: {admin.get('created_at')}")
    logger.info("-" * 40)
    
    # Check if password is hashed
    password = admin.get('password', '')
    logger.info("\nPassword Status:")
    logger.info("-" * 40)
    if password.startswith('$2b$') or password.startswith('$2a$'):
        logger.info("✅ Password is properly hashed")
    else:
        logger.info("❌ Password is not hashed properly")
    logger.info("-" * 40)

if __name__ == "__main__":
    check_admin_user()