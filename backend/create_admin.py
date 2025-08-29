#!/usr/bin/env python3
"""
AltarMaker Admin User Creation Script

This script creates the initial admin user for the application.
Only run this script once to set up the first admin user.
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
from bson import ObjectId
from database import init_database, get_db
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def create_initial_admin():
    """Create the initial admin user"""
    logger.info("🎨 AltarMaker - Create Initial Admin User")
    logger.info("=" * 50)
    
    try:
        # Import database connection
       
        
        # Initialize database
        if not init_database():
            logger.info("❌ Failed to initialize database")
            return False
        
        db = get_db()
        
        # Check if admin already exists
        existing_admin = db.users.find_one({'role': 'admin'})
        if existing_admin:
            logger.info("⚠️  Admin user already exists!")
            logger.info(f"   Username: {existing_admin['username']}")
            logger.info(f"   Email: {existing_admin.get('email', 'N/A')}")
            logger.info(f"   Created: {existing_admin['created_at']}")
            return True
        
        # Get admin details
        logger.info("📝 Enter admin user details:")
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not username or not email or not password:
            logger.info("❌ All fields are required")
            return False
        
        # Check if user already exists
        existing_user = db.users.find_one({'$or': [{'email': email}, {'username': username}]})
        if existing_user:
            logger.info("❌ User with this email or username already exists")
            return False
        
        # Create admin user
        admin_data = {
            'username': username,
            'email': email,
            'password': generate_password_hash(password),
            'role': 'admin',
            'created_at': datetime.utcnow(),
            'last_login': None,
            'created_by': 'system'  # Initial admin created by system
        }
        
        result = db.users.insert_one(admin_data)
        
        logger.info("✅ Admin user created successfully!")
        logger.info(f"   User ID: {result.inserted_id}")
        logger.info(f"   Username: {username}")
        logger.info(f"   Email: {email}")
        logger.info(f"   Role: admin")
        logger.info()
        logger.info("🔐 You can now login as admin using these credentials")
        
        return True
        
    except Exception as e:
        logger.info(f"❌ Error creating admin user: {e}")
        return False

def list_admin_users():
    """List all admin users"""
    try:
        
        if not init_database():
            logger.info("❌ Failed to initialize database")
            return False
        
        db = get_db()
        admin_users = list(db.users.find({'role': 'admin'}, {'password': 0}))
        
        if not admin_users:
            logger.info("📋 No admin users found")
            return True
        
        logger.info("📋 Admin Users:")
        logger.info("=" * 30)
        for user in admin_users:
            logger.info(f"   Username: {user['username']}")
            logger.info(f"   Email: {user.get('email', 'N/A')}")
            logger.info(f"   Created: {user['created_at']}")
            logger.info(f"   Created by: {user.get('created_by', 'system')}")
            logger.info()
        
        return True
        
    except Exception as e:
        logger.info(f"❌ Error listing admin users: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == 'list':
        list_admin_users()
    else:
        create_initial_admin()

if __name__ == '__main__':
    main() 