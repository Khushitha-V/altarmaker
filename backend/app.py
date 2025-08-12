import os
import json
from datetime import datetime, timedelta
from functools import wraps
from flask import Flask, request, jsonify, session, send_from_directory
from flask_cors import CORS
from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
from bson import ObjectId
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='../frontend/dist', static_url_path='')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
app.config['MONGO_URI'] = os.getenv('MONGO_URI')

# Initialize MongoDB Atlas connection
client = MongoClient(os.getenv('MONGO_URI'))
db = client.altarmaker

print(f"MongoDB connected: {db}")

# MongoDB connection validation
def get_db():
    """Get database with connection validation"""
    try:
        # Test the connection
        client.admin.command('ping')
        return db
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return None

def validate_db_connection():
    """Validate MongoDB connection"""
    try:
        db_instance = get_db()
        if db_instance:
            # Test the connection
            client.admin.command('ping')
            return True
        return False
    except Exception as e:
        print(f"MongoDB connection error: {e}")
        return False

# Enable CORS
CORS(app, supports_credentials=True)

# Session Configuration
SESSION_EXPIRATION = 24 * 60 * 60  # 24 hours



def create_user_session(user_id, username, role):
    """Create user session data"""
    session['user_id'] = str(user_id)
    session['username'] = username
    session['role'] = role
    session['logged_in'] = True
    session.permanent = True
    app.permanent_session_lifetime = timedelta(seconds=SESSION_EXPIRATION)

def get_current_user():
    """Get current user from session"""
    if session.get('logged_in'):
        return {
            'user_id': session.get('user_id'),
            'username': session.get('username'),
            'role': session.get('role')
        }
    return None

def require_auth(f):
    """Decorator to require authentication"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_data = get_current_user()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        request.user_data = user_data
        return f(*args, **kwargs)
    return decorated_function

def require_admin(f):
    """Decorator to require admin role"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not hasattr(request, 'user_data'):
            return jsonify({'error': 'Authentication required'}), 401
        
        if request.user_data.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        return f(*args, **kwargs)
    return decorated_function





@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Check database connection
        db_instance = get_db()
        
        if db_instance is not None:
            # Test the connection
            try:
                client.admin.command('ping')
                return jsonify({
                    'status': 'healthy', 
                    'message': 'AltarMaker API is running',
                    'database': 'connected'
                })
            except Exception as e:
                return jsonify({
                    'status': 'unhealthy',
                    'message': 'Database connection failed',
                    'database': 'disconnected'
                }), 500
        else:
            return jsonify({
                'status': 'unhealthy',
                'message': 'Database connection failed',
                'database': 'disconnected'
            }), 500
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e),
            'database': 'error'
        }), 500



@app.route('/api/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role', 'user')
        
        if not username or not password or not email:
            return jsonify({'error': 'Username, password, and email are required'}), 400
        
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Please enter a valid email address'}), 400
        
        # Prevent admin registration through public API
        if role == 'admin':
            return jsonify({'error': 'Admin registration is not allowed through public API'}), 403
        
        # Check if user already exists
        try:
            existing_user = db.users.find_one({'$or': [{'email': email}, {'username': username}]})
            if existing_user:
                return jsonify({'error': 'User with this email or username already exists'}), 409
            
            # Create new user (always as regular user)
            user_data = {
                'username': username,
                'email': email,
                'password': generate_password_hash(password),
                'role': 'user',  # Always create as user
                'created_at': datetime.now(),
                'last_login': None
            }
            
            result = db.users.insert_one(user_data)
            user_data['_id'] = str(result.inserted_id)
            del user_data['password']
            
            # Create user session
            create_user_session(result.inserted_id, username, 'user')
            
            return jsonify({
                'message': 'User registered successfully',
                'user': user_data
            }), 201
            
        except Exception as e:
            print(f"Database error during registration: {e}")
            return jsonify({'error': 'Database connection error'}), 500
        
    except Exception as e:
        print(f"Error in register: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        role = data.get('role', 'user')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        try:
            # Find user by username or email
            user = db.users.find_one({
                '$or': [
                    {'username': username},
                    {'email': username}
                ]
            })
            
            if not user:
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check password
            if not check_password_hash(user['password'], password):
                return jsonify({'error': 'Invalid credentials'}), 401
            
            # Check role if specified
            if role and user.get('role') != role:
                return jsonify({'error': f'Invalid role. Expected {role}'}), 401
            
            # Update last login
            db.users.update_one(
                {'_id': user['_id']},
                {'$set': {'last_login': datetime.now()}}
            )
            
            # Create user session
            create_user_session(user['_id'], user['username'], user['role'])
            
            user_data = {
                '_id': str(user['_id']),
                'username': user['username'],
                'email': user.get('email'),
                'role': user['role'],
                'created_at': user['created_at'],
                'last_login': user['last_login']
            }
            
            return jsonify({
                'message': 'Login successful',
                'user': user_data
            }), 200
            
        except Exception as e:
            print(f"Database error during login: {e}")
            return jsonify({'error': 'Database connection error'}), 500
        
    except Exception as e:
        print(f"Error in login: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    """Logout user by clearing session"""
    session.clear()
    return jsonify({'message': 'Logout successful'}), 200

@app.route('/api/auth/status', methods=['GET'])
def auth_status():
    """Check if user is currently authenticated"""
    user_data = get_current_user()
    if user_data:
        return jsonify({
            'authenticated': True,
            'user': user_data
        })
    else:
        return jsonify({
            'authenticated': False,
            'user': None
        }), 401

@app.route('/api/designs/wall-designs', methods=['GET'])
@require_auth
def get_wall_designs():
    """Get wall designs for current user"""
    try:
        user_id = request.user_data['user_id']
        
        # Get the most recent wall design for the user
        wall_design = db.wall_designs.find_one(
            {'user_id': user_id},
            sort=[('created_at', -1)]
        )
        
        if wall_design:
            return jsonify({
                'wallDesigns': wall_design.get('wall_designs', {}),
                'roomType': wall_design.get('room_type', ''),
                'roomDimensions': wall_design.get('room_dimensions', {}),
                'selectedWall': wall_design.get('selected_wall', '')
            })
        else:
            return jsonify({
                'wallDesigns': {
                    'front': {'elements': [], 'wallpaper': None},
                    'back': {'elements': [], 'wallpaper': None},
                    'left': {'elements': [], 'wallpaper': None},
                    'right': {'elements': [], 'wallpaper': None}
                },
                'roomType': '',
                'roomDimensions': {'length': 8, 'width': 8, 'height': 4},
                'selectedWall': ''
            })
    except Exception as e:
        print(f"Error getting wall designs: {e}")
        return jsonify({'error': 'Failed to get wall designs'}), 500

@app.route('/api/designs/wall-designs', methods=['POST'])
@require_auth
def save_wall_designs():
    """Save wall designs for current user"""
    try:
        user_id = request.user_data['user_id']
        data = request.get_json()
        
        # Optimize wall designs data before saving
        wall_designs = data.get('wallDesigns', {})
        optimized_designs = {}
        
        for wall_name, wall_data in wall_designs.items():
            if wall_data and (wall_data.get('elements') or wall_data.get('wallpaper')):
                # Only save walls that have actual content
                optimized_designs[wall_name] = {
                    'elements': wall_data.get('elements', []),
                    'wallpaper': wall_data.get('wallpaper')
                }
        
        wall_design_data = {
            'user_id': user_id,
            'wall_designs': optimized_designs,
            'room_type': data.get('roomType', ''),
            'room_dimensions': data.get('roomDimensions', {}),
            'selected_wall': data.get('selectedWall', ''),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        # Insert new wall design record
        result = db.wall_designs.insert_one(wall_design_data)
        
        return jsonify({
            'success': True,
            'message': 'Wall designs saved successfully'
        })
    except Exception as e:
        print(f"Error saving wall designs: {e}")
        return jsonify({'error': 'Failed to save wall designs'}), 500

@app.route('/api/sessions', methods=['GET'])
@require_auth
def get_sessions():
    """Get all sessions for the authenticated user"""
    try:
        user_id = request.user_data['user_id']
        sessions = list(db.sessions.find({'user_id': user_id}))
        
        # Convert ObjectId to string
        for session in sessions:
            session['_id'] = str(session['_id'])
        
        return jsonify({'sessions': sessions}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions', methods=['POST'])
@require_auth
def save_session():
    """Save a new session"""
    try:
        user_id = request.user_data['user_id']
        data = request.get_json()
        
        session_data = {
            'user_id': user_id,
            'session_name': data.get('session_name'),
            'room_type': data.get('room_type'),
            'room_dimensions': data.get('room_dimensions'),
            'wall_designs': data.get('wall_designs'),
            'selected_wall': data.get('selected_wall'),
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        
        result = db.sessions.insert_one(session_data)
        session_data['_id'] = str(result.inserted_id)
        
        return jsonify({
            'message': 'Session saved successfully',
            'session': session_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['GET'])
@require_auth
def get_session(session_id):
    """Get a specific session"""
    try:
        user_id = request.user_data['user_id']
        
        # Validate ObjectId
        if not ObjectId.is_valid(session_id):
            return jsonify({'error': 'Invalid session ID'}), 400
        
        session_data = db.sessions.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_id
        })
        
        if not session_data:
            return jsonify({'error': 'Session not found'}), 404
        
        session_data['_id'] = str(session_data['_id'])
        return jsonify({'session': session_data}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['PUT'])
@require_auth
def update_session(session_id):
    """Update a session"""
    try:
        user_id = request.user_data['user_id']
        data = request.get_json()
        
        # Validate ObjectId
        if not ObjectId.is_valid(session_id):
            return jsonify({'error': 'Invalid session ID'}), 400
        
        update_data = {
            'session_name': data.get('session_name'),
            'room_type': data.get('room_type'),
            'room_dimensions': data.get('room_dimensions'),
            'wall_designs': data.get('wall_designs'),
            'selected_wall': data.get('selected_wall'),
            'updated_at': datetime.utcnow()
        }
        
        result = db.sessions.update_one(
            {'_id': ObjectId(session_id), 'user_id': user_id},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Session not found'}), 404
        
        return jsonify({'message': 'Session updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sessions/<session_id>', methods=['DELETE'])
@require_auth
def delete_session(session_id):
    """Delete a session"""
    try:
        user_id = request.user_data['user_id']
        
        # Verify the session belongs to the user
        session_data = db.sessions.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_id
        })
        
        if not session_data:
            return jsonify({'error': 'Session not found'}), 404
        
        # Delete the session
        db.sessions.delete_one({'_id': ObjectId(session_id)})
        
        return jsonify({'message': 'Session deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
@require_auth
@require_admin
def get_all_users():
    """Get all users (admin only)"""
    try:
        users = list(db.users.find({}, {'password': 0}))
        
        # Convert ObjectId to string
        for user in users:
            user['_id'] = str(user['_id'])
        
        return jsonify({'users': users}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users', methods=['POST'])
@require_auth
@require_admin
def create_admin_user():
    """Create a new admin user (admin only)"""
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        
        if not username or not password or not email:
            return jsonify({'error': 'Username, password, and email are required'}), 400
        
        # Check if user already exists
        existing_user = db.users.find_one({'$or': [{'email': email}, {'username': username}]})
        if existing_user:
            return jsonify({'error': 'User with this email or username already exists'}), 409
        
        # Create new admin user
        user_data = {
            'username': username,
            'email': email,
            'password': generate_password_hash(password),
            'role': 'admin',
            'created_at': datetime.utcnow(),
            'last_login': None,
            'created_by': request.user_data['user_id']
        }
        
        result = db.users.insert_one(user_data)
        user_data['_id'] = str(result.inserted_id)
        del user_data['password']
        
        return jsonify({
            'message': 'Admin user created successfully',
            'user': user_data
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>', methods=['DELETE'])
@require_auth
@require_admin
def delete_user(user_id):
    """Delete a user (admin only)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Don't allow admin to delete themselves
        if user_id == request.user_data['user_id']:
            return jsonify({'error': 'Cannot delete your own account'}), 400
        
        result = db.users.delete_one({'_id': ObjectId(user_id)})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        # Also delete all sessions for this user
        db.sessions.delete_many({'user_id': user_id})
        
        return jsonify({'message': 'User deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/promote', methods=['PUT'])
@require_auth
@require_admin
def promote_user_to_admin(user_id):
    """Promote a user to admin role (admin only)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Don't allow admin to promote themselves (they're already admin)
        if user_id == request.user_data['user_id']:
            return jsonify({'error': 'You are already an admin'}), 400
        
        # Update user role to admin
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'role': 'admin', 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        if result.modified_count == 0:
            return jsonify({'error': 'User is already an admin'}), 400
        
        return jsonify({'message': 'User promoted to admin successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/users/<user_id>/demote', methods=['PUT'])
@require_auth
@require_admin
def demote_admin_to_user(user_id):
    """Demote an admin to regular user role (admin only)"""
    try:
        # Validate ObjectId
        if not ObjectId.is_valid(user_id):
            return jsonify({'error': 'Invalid user ID'}), 400
        
        # Don't allow admin to demote themselves
        if user_id == request.user_data['user_id']:
            return jsonify({'error': 'You cannot demote yourself'}), 400
        
        # Update user role to user
        result = db.users.update_one(
            {'_id': ObjectId(user_id)},
            {'$set': {'role': 'user', 'updated_at': datetime.utcnow()}}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'User not found'}), 404
        
        if result.modified_count == 0:
            return jsonify({'error': 'User is already a regular user'}), 400
        
        return jsonify({'message': 'Admin demoted to regular user successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/stats', methods=['GET'])
@require_auth
@require_admin
def get_admin_stats():
    """Get admin statistics"""
    try:
        total_users = db.users.count_documents({})
        total_sessions = db.sessions.count_documents({})
        admin_users = db.users.count_documents({'role': 'admin'})
        regular_users = db.users.count_documents({'role': 'user'})
        
        # Get recent activity
        recent_sessions = list(db.sessions.find().sort('created_at', -1).limit(10))
        for session in recent_sessions:
            session['_id'] = str(session['_id'])
        
        stats = {
            'total_users': total_users,
            'total_sessions': total_sessions,
            'admin_users': admin_users,
            'regular_users': regular_users,
            'recent_sessions': recent_sessions
        }
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Frontend serving routes
@app.route('/')
def serve_home():
    """Serve the React app home page"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the React build"""
    return send_from_directory(app.static_folder, path)

@app.errorhandler(404)
def not_found(e):
    """Handle React Router routes by serving index.html"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/feedback', methods=['GET'])
def get_feedback():
    """
    Get all feedback entries
    No authentication required as this is a public endpoint
    """
    try:
        feedback = list(db.feedback.find({}, {'_id': 0, 'email': 0}).sort('date', -1))
        return jsonify({
            'success': True,
            'data': feedback
        }), 200
    except Exception as e:
        print(f"Error fetching feedback: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch feedback'
        }), 500

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    """
    Submit new feedback
    No authentication required as this is a public endpoint
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'message', 'rating']
        if not all(field in data for field in required_fields):
            return jsonify({
                'success': False,
                'error': 'Missing required fields'
            }), 400
            
        # Validate rating is between 1-5
        if not isinstance(data['rating'], int) or data['rating'] < 1 or data['rating'] > 5:
            return jsonify({
                'success': False,
                'error': 'Rating must be between 1 and 5'
            }), 400
            
        # Create feedback document
        feedback = {
            'name': data['name'],
            'email': data['email'],
            'message': data['message'],
            'rating': data['rating'],
            'date': datetime.utcnow().isoformat(),
            'approved': False  # Admin can approve feedback before showing publicly
        }
        
        # Insert into database
        result = db.feedback.insert_one(feedback)
        feedback['id'] = str(result.inserted_id)
        
        # Don't return email in the response for privacy
        del feedback['email']
        del feedback['_id']
        
        return jsonify({
            'success': True,
            'data': feedback
        }), 201
        
    except Exception as e:
        print(f"Error submitting feedback: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to submit feedback'
        }), 500

if __name__ == '__main__':
    # Create indexes for feedback collection
    db.feedback.create_index('date')
    db.feedback.create_index('rating')
    db.feedback.create_index('approved')
    
    app.run(debug=True, host='0.0.0.0', port=5000)
