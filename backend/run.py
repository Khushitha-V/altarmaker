#!/usr/bin/env python3
"""
AltarMaker Backend Startup Script

This script initializes the database and starts the Flask application.
"""

import os
import sys
from dotenv import load_dotenv

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

def check_environment():
    """Check if required environment variables are set"""
    required_vars = ['MONGO_URI', 'JWT_SECRET_KEY', 'SECRET_KEY']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.info("❌ Missing required environment variables:")
        for var in missing_vars:
            logger.info(f"   - {var}")
        logger.info("\nPlease create a .env file with the required variables.")
        logger.info("See README.md for configuration details.")
        return False
    
    return True

def init_database():
    """Initialize database connection and create indexes"""
    try:
        from database import init_database
        logger.info("🔗 Connecting to MongoDB...")
        
        if init_database():
            logger.info("✅ Database initialized successfully")
            return True
        else:
            logger.info("❌ Failed to initialize database")
            return False
    except Exception as e:
        logger.info(f"❌ Database initialization error: {e}")
        return False

def run_app():
    """Run the Flask application"""
    try:
        from app import app
        
        # Get configuration
        config_name = os.getenv('FLASK_ENV', 'development')
        config_class = getattr(__import__('config'), f'{config_name.capitalize()}Config')
        app.config.from_object(config_class)
        
        # Initialize app with config
        config_class.init_app(app)
        
        # Get host and port
        host = os.getenv('FLASK_HOST', '0.0.0.0')
        port = int(os.getenv('FLASK_PORT', 5000))
        
        logger.info(f"🚀 Starting AltarMaker Backend on {host}:{port}")
        logger.info(f"📊 Environment: {config_name}")
        logger.info(f"🔗 API Health Check: http://{host}:{port}/api/health")
        
        app.run(host=host, port=port, debug=app.config['DEBUG'])
        
    except Exception as e:
        logger.info(f"❌ Failed to start application: {e}")
        return False

def main():
    """Main startup function"""
    logger.info("🎨 AltarMaker Backend")
    logger.info("=" * 30)
    
    # Check environment
    if not check_environment():
        sys.exit(1)
    
    # Initialize database
    if not init_database():
        sys.exit(1)
    
    # Run application
    run_app()

if __name__ == '__main__':
    main() 