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

# Load environment variables
load_dotenv()

def create_initial_admin():
    """Create the initial admin user"""
    print("🎨 AltarMaker - Create Initial Admin User")
    print("=" * 50)
    
    try:
        # Import database connection
        from database import init_database, get_db
        
        # Initialize database
        if not init_database():
            print("❌ Failed to initialize database")
            return False
        
        db = get_db()
        
        # Check if admin already exists
        existing_admin = db.users.find_one({'role': 'admin'})
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"   Username: {existing_admin['username']}")
            print(f"   Email: {existing_admin.get('email', 'N/A')}")
            print(f"   Created: {existing_admin['created_at']}")
            return True
        
        # Get admin details
        print("📝 Enter admin user details:")
        username = input("Username: ").strip()
        email = input("Email: ").strip()
        password = input("Password: ").strip()
        
        if not username or not email or not password:
            print("❌ All fields are required")
            return False
        
        # Check if user already exists
        existing_user = db.users.find_one({'$or': [{'email': email}, {'username': username}]})
        if existing_user:
            print("❌ User with this email or username already exists")
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
        
        print("✅ Admin user created successfully!")
        print(f"   User ID: {result.inserted_id}")
        print(f"   Username: {username}")
        print(f"   Email: {email}")
        print(f"   Role: admin")
        print()
        print("🔐 You can now login as admin using these credentials")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

def list_admin_users():
    """List all admin users"""
    try:
        from database import init_database, get_db
        
        if not init_database():
            print("❌ Failed to initialize database")
            return False
        
        db = get_db()
        admin_users = list(db.users.find({'role': 'admin'}, {'password': 0}))
        
        if not admin_users:
            print("📋 No admin users found")
            return True
        
        print("📋 Admin Users:")
        print("=" * 30)
        for user in admin_users:
            print(f"   Username: {user['username']}")
            print(f"   Email: {user.get('email', 'N/A')}")
            print(f"   Created: {user['created_at']}")
            print(f"   Created by: {user.get('created_by', 'system')}")
            print()
        
        return True
        
    except Exception as e:
        print(f"❌ Error listing admin users: {e}")
        return False

def main():
    """Main function"""
    if len(sys.argv) > 1 and sys.argv[1] == 'list':
        list_admin_users()
    else:
        create_initial_admin()

if __name__ == '__main__':
    main() 