"""
Script to check admin user details in the database.
"""
import os
from pymongo import MongoClient
from dotenv import load_dotenv

def check_admin_user():
    # Load environment variables
    load_dotenv()
    
    # Connect to MongoDB
    client = MongoClient(os.getenv('MONGO_URI'))
    db = client.altarmaker
    
    # Find admin user
    admin = db.users.find_one({'role': 'admin'})
    
    if not admin:
        print("No admin user found in the database.")
        return
    
    # Print admin details (excluding sensitive data)
    print("\nAdmin User Details:")
    print("-" * 40)
    print(f"Username: {admin.get('username')}")
    print(f"Email: {admin.get('email')}")
    print(f"Role: {admin.get('role')}")
    print(f"Email Verified: {admin.get('email_verified', False)}")
    print(f"Account Active: {admin.get('is_active', True)}")
    print(f"Last Login: {admin.get('last_login')}")
    print(f"Created At: {admin.get('created_at')}")
    print("-" * 40)
    
    # Check if password is hashed
    password = admin.get('password', '')
    print("\nPassword Status:")
    print("-" * 40)
    if password.startswith('$2b$') or password.startswith('$2a$'):
        print("✅ Password is properly hashed")
    else:
        print("❌ Password is not hashed properly")
    print("-" * 40)

if __name__ == "__main__":
    check_admin_user()
