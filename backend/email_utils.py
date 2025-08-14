from flask import url_for, current_app
from flask_mail import Message, Mail
from itsdangerous import URLSafeTimedSerializer
from datetime import datetime, timedelta

def generate_verification_token(email):
    """Generate a secure token for email verification"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return serializer.dumps(email, salt='email-verification-salt')

def verify_token(token, expiration=86400):
    """Verify the token and return the email if valid"""
    serializer = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        email = serializer.loads(
            token,
            salt='email-verification-salt',
            max_age=expiration
        )
        return email
    except Exception as e:
        current_app.logger.error(f"Token verification failed: {str(e)}")
        return None

def send_verification_email(recipient_email, token):
    """Send verification email with the provided token"""
    try:
        # Check if we have the required configuration
        required_configs = ['MAIL_SERVER', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD', 'APP_URL']
        missing_configs = [config for config in required_configs if not current_app.config.get(config)]
        
        if missing_configs:
            current_app.logger.error(f"Missing email configuration: {', '.join(missing_configs)}")
            return False
            
        verification_url = f"{current_app.config['APP_URL']}/verify-email?token={token}"
        
        msg = Message(
            "Verify Your Email Address",
            sender=current_app.config.get('MAIL_DEFAULT_SENDER', current_app.config.get('MAIL_USERNAME')),
            recipients=[recipient_email],
            html=f"""
            <h2>Welcome to AltarMaker!</h2>
            <p>Thank you for registering. Please click the button below to verify your email address:</p>
            <p><a href="{verification_url}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 4px;">
            Verify Email</a></p>
            <p>Or copy and paste this link into your browser:<br>
            {verification_url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create an account, please ignore this email.</p>
            """
        )
        
        # Log email attempt (without sensitive data)
        current_app.logger.info(f"Attempting to send verification email to {recipient_email}")
        
        # Send the email
        mail = Mail(current_app)
        mail.send(msg)
        
        current_app.logger.info(f"Verification email sent to {recipient_email}")
        return True
        
    except Exception as e:
        error_msg = f"Failed to send verification email to {recipient_email}: {str(e)}"
        current_app.logger.error(error_msg)
        # Print to console as well in case logging isn't configured
        print(f"ERROR: {error_msg}")
        return False

def send_welcome_email(recipient_email, username):
    """Send welcome email after successful verification"""
    app_url = current_app.config.get('APP_URL', '#')
    msg = Message(
        "🎉 Welcome to AltarMaker!",
        sender=current_app.config.get('MAIL_DEFAULT_SENDER', current_app.config.get('MAIL_USERNAME')),
        recipients=[recipient_email],
        html=f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
            <h1 style="color: #4A90E2;">🎉 Welcome to <strong>AltarMaker</strong>, {username}!</h1>
            
            <p>Your email has been successfully verified, and we're thrilled to have you join our creative community. 🎨✨</p>
            
            <p>With AltarMaker, you can:</p>
            <ul style="line-height: 1.8;">
                <li>🖼 <strong>Design & customize</strong> stunning altars with frames, stickers, and text.</li>
                <li>🎯 <strong>Drag, resize, and personalize</strong> every element with ease.</li>
                <li>💾 <strong>Save & share</strong> your creations anytime, anywhere.</li>
            </ul>
            
            <p>We can't wait to see what you create! 🌟</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="{app_url}" 
                   style="background-color: #4CAF50; 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 4px; 
                          font-size: 16px; 
                          font-weight: bold;
                          display: inline-block;
                          margin: 10px 0;">
                    🎨 Start Creating
                </a>
            </div>
            
            <p>If you ever have questions or need help, just reply to this email — our team is always happy to assist.</p>
            
            <p style="margin-top: 30px;">Happy Creating,<br>
            — <em>The AltarMaker Team</em></p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #888;">
                <p>AltarMaker | Create beautiful digital altars with ease</p>
            </div>
        </div>
        """
    )
    
    try:
        from app import mail
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send welcome email: {str(e)}")
        return False