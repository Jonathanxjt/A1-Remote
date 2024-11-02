import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db, Employee, User
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

app = Flask(__name__)

# Construct the database URI
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database with the Flask app
db.init_app(app)

# Hashed password to be used for all users
DEFAULT_PASSWORD_HASH = '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy'

def create_user_accounts(session):
    """
    Creates User accounts for each existing Employee in the database with a default password.
    """
    employees = session.query(Employee).all()
    users_created = 0
    users_skipped = 0

    for emp in employees:
        try:
            # Check if the user already exists
            existing_user = session.query(User).filter_by(staff_id=emp.staff_id).first()
            if existing_user:
                print(f"User for staff_id {emp.staff_id} already exists. Skipping.")
                users_skipped += 1
                continue

            # Create the user with default password hash
            user = User(
                staff_id=emp.staff_id,
                email=emp.email,
                password=DEFAULT_PASSWORD_HASH
            )
            session.add(user)
            users_created += 1
            print(f"Creating user account for {emp.staff_fname} {emp.staff_lname}")

        except Exception as e:
            print(f"Error creating user for staff_id {emp.staff_id}: {e}")
            continue

    try:
        session.commit()
        print(f"Created {users_created} user accounts.")
        if users_skipped > 0:
            print(f"Skipped {users_skipped} existing user accounts.")
    except Exception as e:
        session.rollback()
        print(f"Error creating user accounts: {e}")

def main():
    with app.app_context():
        # Only create user accounts for existing employees
        create_user_accounts(db.session)

        print("User account creation completed.")

if __name__ == "__main__":
    main()
