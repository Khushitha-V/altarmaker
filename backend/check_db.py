"""
Script to check database structure and user accounts.
"""
import os
import pprint
from pymongo import MongoClient
from dotenv import load_dotenv

def check_database():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Get list of all collections
    print("\nCollections in database:")
    print("-" * 40)
    collections = db.list_collection_names()
    for col in collections:
        print(f"- {col}")
    
    # Check users collection
    if 'users' not in collections:
        print("\n❌ 'users' collection not found!")
        return
    
    # Get user count
    user_count = db.users.count_documents({})
    print(f"\nTotal users in database: {user_count}")
    
    # Get admin users
    admin_users = list(db.users.find({"role": "admin"}))
    print(f"\nFound {len(admin_users)} admin users")
    
    if admin_users:
        print("\nAdmin user details:")
        print("-" * 40)
        for i, user in enumerate(admin_users, 1):
            print(f"\nAdmin User #{i}:")
            print("-" * 30)
            # Print user details excluding sensitive data
            user_data = {k: v for k, v in user.items() if k != 'password' and k != '_id'}
            for key, value in user_data.items():
                print(f"{key}: {value}")
    
    # Check for any users (first 5)
    print("\nSample of users in database:")
    print("-" * 40)
    for user in db.users.find().limit(5):
        print(f"\nUsername: {user.get('username')}")
        print(f"Email: {user.get('email')}")
        print(f"Role: {user.get('role', 'user')}")
        print(f"Verified: {user.get('email_verified', False)}")
        print("-" * 20)

if __name__ == "__main__":
    check_database()