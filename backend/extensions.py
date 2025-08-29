from flask_mail import Mail

# Initialize Flask-Mail extension
mail = Mail()

def init_mail(app):
    """Initialize the mail instance with the Flask app"""
    mail.init_app(app)
