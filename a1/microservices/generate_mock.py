import os
from datetime import datetime, timedelta, time
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import WorkRequest, Schedule, Employee, User
from dotenv import load_dotenv

# Load environment variables from a .env file if present
load_dotenv()

app = Flask(__name__)

# Use DATABASE_URL from the environment
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Constants
request_types = ['Full Day', 'AM', 'PM']
reason = 'Testing'
status = 'Pending'
DEFAULT_PASSWORD_HASH = '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy'

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
    forced_staff_id = 999998
    forced_manager_id = 999999

    # Insert test manager
    test_manager = Employee(
        staff_fname='Test_Manager',
        staff_lname='Test_Manager',
        dept='Test_Dept',
        position='Manager',
        country='Singapore',
        email='test_manager@allinone.com.sg',
        reporting_manager=None,
        role=3
    )
    db.session.add(test_manager)
    db.session.flush()
    test_manager.staff_id = forced_manager_id
    db.session.flush()

    # Insert test employee
    test_employee = Employee(
        staff_fname='Test_Staff',
        staff_lname='Test_Staff',
        dept='Test_Dept',
        position='Test_Position',
        country='Singapore',
        email='test_staff@allinone.com.sg',
        reporting_manager=forced_manager_id,
        role=2
    )
    db.session.add(test_employee)
    db.session.flush()
    test_employee.staff_id = forced_staff_id
    db.session.flush()

    # Insert users in User table with passwords
    db.session.add_all([
        User(staff_id=forced_staff_id, email='test_staff@allinone.com.sg', password=DEFAULT_PASSWORD_HASH),
        User(staff_id=forced_manager_id, email='test_manager@allinone.com.sg', password=DEFAULT_PASSWORD_HASH)
    ])
    db.session.commit()

    return forced_staff_id, forced_manager_id

def generate_mock(num_requests=50):
    today = datetime.today()
    request_date_this_year = today + timedelta(days=2)
    request_date_next_year = today + timedelta(days=365)
    generated_requests = 0

    with app.app_context():
        staff_id, manager_id = insert_testing_users()

        while generated_requests < num_requests:
            if request_date_this_year.weekday() in (5, 6):
                request_date_this_year += timedelta(days=1)
                continue

            request_type = request_types[generated_requests % len(request_types)]
            request_date_with_time = datetime.combine(request_date_this_year.date(), time.min)

            work_request = WorkRequest(
                staff_id=staff_id,
                request_type=request_type,
                request_date=request_date_with_time,
                reason=reason,
                status=status,
                approval_manager_id=manager_id,
            )

            db.session.add(work_request)
            db.session.commit()

            schedule = Schedule(
                staff_id=staff_id,
                date=request_date_with_time,
                request_id=work_request.request_id,
                approved_by=None,
                request_type=request_type,
                status=status
            )

            db.session.add(schedule)
            db.session.commit()

            request_date_this_year += timedelta(days=1)
            generated_requests += 1

            print(f"Generated Pending Work Request {generated_requests} for this year")

        generated_requests_next_year = 0

        while generated_requests_next_year < num_requests:
            if request_date_next_year.weekday() in (5, 6):
                request_date_next_year += timedelta(days=1)
                continue

            request_type = request_types[generated_requests_next_year % len(request_types)]
            request_date_with_time = datetime.combine(request_date_next_year.date(), time.min)

            work_request = WorkRequest(
                staff_id=staff_id,
                request_type=request_type,
                request_date=request_date_with_time,
                reason=reason,
                status=status,
                approval_manager_id=manager_id,
            )

            db.session.add(work_request)
            db.session.commit()

            schedule = Schedule(
                staff_id=staff_id,
                date=request_date_with_time,
                request_id=work_request.request_id,
                approved_by=None,
                request_type=request_type,
                status=status
            )

            db.session.add(schedule)
            db.session.commit()

            request_date_next_year += timedelta(days=1)
            generated_requests_next_year += 1

            print(f"Generated Pending Work Request {generated_requests_next_year} for next year")

if __name__ == "__main__":
    generate_mock(50)
