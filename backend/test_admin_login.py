"""
Script to test admin login directly against the backend.
"""
import requests
import os
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

def test_admin_login():
    # Load environment variables
    
    # Get the base URL from environment or use default
    base_url = os.getenv('APP_URL', 'http://localhost:5000')
    login_url = f"{base_url}/api/auth/login"
    
    # Test data - replace with actual admin credentials
    test_data = {
        "username": "admin",  # Replace with actual admin username
        "password": "admin123",  # Replace with actual admin password
        "role": "admin"
    }
    
    logger.info(f"Testing admin login at: {login_url}")
    logger.info("Using test data:", {k: v if k != 'password' else '***' for k, v in test_data.items()})
    
    try:
        # Make the login request
        response = requests.post(
            login_url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            allow_redirects=True
        )
        
        logger.info("\nResponse Status Code:", response.status_code)
        logger.info("Response Headers:", dict(response.headers))
        logger.info("Response Body:", response.text)
        
        if response.status_code == 200:
            logger.info("\n✅ Login successful!")
            logger.info("User data:", response.json().get('user', 'No user data'))
        else:
            logger.info(f"\n❌ Login failed with status {response.status_code}")
            logger.info("Error:", response.json().get('error', 'No error message'))
            
    except Exception as e:
        logger.info(f"\n❌ Error making request: {str(e)}")

if __name__ == "__main__":
    test_admin_login()