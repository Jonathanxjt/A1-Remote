import bcrypt
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import *
from dotenv import load_dotenv
import os

load_dotenv()
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# Hash the plain text password
def hash_password(plain_password):
    return bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

# Script to hash all plain text passwords
def hash_existing_passwords():
    with app.app_context():
        users = db.session.scalars(db.select(User)).all()
        
        for user in users:
            # Assuming user.password is currently in plain text
            plain_password = user.password
            
            # Check if the password is already hashed (optional, in case some are already hashed)
            if bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()) != plain_password:
                hashed_password = hash_password(plain_password)
                
                # Update the user's password with the hashed version
                user.password = hashed_password
                db.session.commit()
                print(f"Updated password for user {user.email}")

if __name__ == "__main__":
    hash_existing_passwords()
