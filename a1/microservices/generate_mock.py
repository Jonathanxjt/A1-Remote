from datetime import datetime, timedelta, time
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import WorkRequest, Schedule, Employee, User 
from dotenv import load_dotenv
from os import environ
import os
load_dotenv()
app = Flask(__name__)
# app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:root@localhost:3306/a1_database"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Set some random data for work request generation
request_types = ['Full Day', 'AM', 'PM']
reason = 'Testing'  # Same reason for all requests
status = 'Pending'  # All requests will be pending

def drop_existing_test_users():
    # Check if the test users already exist, and delete them if they do
    existing_staff = db.session.query(Employee).filter_by(email='test_staff@allinone.com.sg').first()
    existing_manager = db.session.query(Employee).filter_by(email='test_manager@allinone.com.sg').first()

    if existing_staff:
        db.session.delete(existing_staff)
        db.session.commit()
        print("Deleted existing test staff user.")

    if existing_manager:
        db.session.delete(existing_manager)
        db.session.commit()
        print("Deleted existing test manager user.")

def insert_testing_users():
    # Drop the test users if they exist
    drop_existing_test_users()

    # Force the staff_id and manager_id
    forced_staff_id = 999998  # Force Test Staff ID
    forced_manager_id = 999999  # Force Test Manager ID

    # Insert the test manager
    test_manager = Employee(
        staff_fname='Test_Manager',
        staff_lname='Test_Manager',
        dept='Test_Dept',
        position='Manager',
        country='Singapore',
        email='test_manager@allinone.com.sg',
        reporting_manager=None,  # No manager for the manager
        role=3  # Assuming 3 corresponds to the 'Manager' role
    )
    db.session.add(test_manager)
    db.session.flush()  # Flush to generate the object

    # Manually assign the forced staff_id for the manager
    test_manager.staff_id = forced_manager_id
    db.session.flush()  # Flush to ensure it updates in the database

    # Now insert the test employee
    test_employee = Employee(
        staff_fname='Test_Staff',
        staff_lname='Test_Staff',
        dept='Test_Dept',
        position='Test_Position',
        country='Singapore',
        email='test_staff@allinone.com.sg',
        reporting_manager=forced_manager_id,  # Reference the manager's ID
        role=2  # Assuming 2 corresponds to the 'Staff' role
    )
    db.session.add(test_employee)
    db.session.flush()  # Flush to generate the object

    # Manually assign the forced staff_id for the employee
    test_employee.staff_id = forced_staff_id
    db.session.flush()  # Flush again to update in the database

    # Insert the users in the User table with passwords
    test_user_staff = User(
        staff_id=forced_staff_id,
        email='test_staff@allinone.com.sg',
        password='$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy'  # Hashed password
    )

    test_user_manager = User(
        staff_id=forced_manager_id,
        email='test_manager@allinone.com.sg',
        password='$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy'  # Hashed password
    )

    db.session.add(test_user_staff)
    db.session.add(test_user_manager)
    db.session.commit()

    # Return the forced IDs for the test staff and manager
    return forced_staff_id, forced_manager_id

def generate_mock(num_requests=50):
    today = datetime.today()

    # Generate 50 requests for the current year and 50 for the next year
    request_date_this_year = today + timedelta(days=2)  # Start 2 days from today for this year's requests
    request_date_next_year = today + timedelta(days=365)  # Start 1 year from now for next year's requests

    generated_requests = 0  # Track the number of requests generated

    with app.app_context():
        # Insert test users first and get their IDs
        staff_id, manager_id = insert_testing_users()

        while generated_requests < num_requests:
            # Skip Saturdays and Sundays for this year requests
            if request_date_this_year.weekday() in (5, 6):  # 5 is Saturday, 6 is Sunday
                request_date_this_year += timedelta(days=1)
                continue

            request_type = request_types[generated_requests % len(request_types)]  # Cycle through request types

            # Set request_date time to 00:00:00 for this year's requests
            request_date_with_time = datetime.combine(request_date_this_year.date(), time.min)

            # Create a new Work Request for this year
            work_request = WorkRequest(
                staff_id=staff_id,
                request_type=request_type,
                request_date=request_date_with_time,
                reason=reason,
                status=status,
                approval_manager_id=manager_id,
            )

            db.session.add(work_request)
            db.session.commit()  # Commit to get the generated request_id for Schedule

            # Create a corresponding Schedule for the Work Request
            schedule = Schedule(
                staff_id=staff_id,
                date=request_date_with_time,
                request_id=work_request.request_id,
                approved_by=None,  # Not approved since the request is pending
                request_type=request_type,
                status=status
            )

            db.session.add(schedule)
            db.session.commit()

            # Move to the next day for the next request
            request_date_this_year += timedelta(days=1)
            generated_requests += 1  # Increment the generated request counter

            print(f"Generated Pending Work Request {generated_requests} for this year")

        # Generate 50 requests for next year
        generated_requests_next_year = 0  # Reset for next year's requests

        while generated_requests_next_year < num_requests:
            # Skip Saturdays and Sundays for next year requests
            if request_date_next_year.weekday() in (5, 6):  # 5 is Saturday, 6 is Sunday
                request_date_next_year += timedelta(days=1)
                continue

            request_type = request_types[generated_requests_next_year % len(request_types)]  # Cycle through request types

            # Set request_date time to 00:00:00 for next year's requests
            request_date_with_time = datetime.combine(request_date_next_year.date(), time.min)

            # Create a new Work Request for next year
            work_request = WorkRequest(
                staff_id=staff_id,
                request_type=request_type,
                request_date=request_date_with_time,
                reason=reason,
                status=status,
                approval_manager_id=manager_id,
            )

            db.session.add(work_request)
            db.session.commit()  # Commit to get the generated request_id for Schedule

            # Create a corresponding Schedule for the Work Request
            schedule = Schedule(
                staff_id=staff_id,
                date=request_date_with_time,
                request_id=work_request.request_id,
                approved_by=None,  # Not approved since the request is pending
                request_type=request_type,
                status=status
            )

            db.session.add(schedule)
            db.session.commit()

            # Move to the next day for the next request
            request_date_next_year += timedelta(days=1)
            generated_requests_next_year += 1  # Increment the generated request counter

            print(f"Generated Pending Work Request {generated_requests_next_year} for next year")

if __name__ == "__main__":
    generate_mock(50)
