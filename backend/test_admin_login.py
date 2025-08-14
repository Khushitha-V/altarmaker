"""
Script to test admin login directly against the backend.
"""
import requests
import os
from dotenv import load_dotenv

def test_admin_login():
    # Load environment variables
    load_dotenv()
    
    # Get the base URL from environment or use default
    base_url = os.getenv('APP_URL', 'http://localhost:5000')
    login_url = f"{base_url}/api/auth/login"
    
    # Test data - replace with actual admin credentials
    test_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "admin123",  # Replace with actual admin password
        "role": "admin"
    }
    
    print(f"Testing admin login at: {login_url}")
    print("Using test data:", {k: v if k != 'password' else '***' for k, v in test_data.items()})
    
    try:
        # Make the login request
        response = requests.post(
            login_url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            allow_redirects=True
        )
        
        print("\nResponse Status Code:", response.status_code)
        print("Response Headers:", dict(response.headers))
        print("Response Body:", response.text)
        
        if response.status_code == 200:
            print("\n✅ Login successful!")
            print("User data:", response.json().get('user', 'No user data'))
        else:
            print(f"\n❌ Login failed with status {response.status_code}")
            print("Error:", response.json().get('error', 'No error message'))
            
    except Exception as e:
        print(f"\n❌ Error making request: {str(e)}")

if __name__ == "__main__":
    test_admin_login()