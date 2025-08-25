#!/usr/bin/env python3
"""
Script to verify admin email in the database.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

def verify_admin_email():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Find admin user
    admin = db.users.find_one({'role': 'admin'})
    
    if not admin:
        print("❌ No admin user found in the database")
        return False
    
    # Update the admin's email verification status
    result = db.users.update_one(
        {'_id': admin['_id']},
        {'$set': {'email_verified': True}}
    )
    
    if result.modified_count > 0:
        print(f"✅ Successfully verified email for admin: {admin.get('username')} ({admin.get('email')})")
        return True
    else:
        print("ℹ️ Admin email was already verified")
        return True

if __name__ == "__main__":
    verify_admin_email()