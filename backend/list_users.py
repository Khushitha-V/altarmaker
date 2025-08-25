"""
Script to list all users in the database with their roles and status.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

def list_all_users():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Get all users (excluding password hashes for security)
    users = db.users.find({}, {'password': 0}).sort('created_at', -1)
    
    print("\n" + "="*80)
    print(f"{'USERNAME':<20} | {'EMAIL':<30} | {'ROLE':<10} | {'VERIFIED':<8} | CREATED AT")
    print("-"*80)
    
    user_count = 0
    for user in users:
        user_count += 1
        print(f"{user.get('username', 'N/A'):<20} | "
              f"{user.get('email', 'N/A'):<30} | "
              f"{user.get('role', 'user'):<10} | "
              f"{str(user.get('email_verified', False)):<8} | "
              f"{user.get('created_at', 'N/A')}")
    
    print("="*80)
    print(f"Total users: {user_count}")
    print("="*80)

if __name__ == "__main__":
    list_all_users()