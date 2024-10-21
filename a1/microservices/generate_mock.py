from datetime import datetime, timedelta, time
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import WorkRequest, Schedule  # Import inside the function to prevent circular import issues

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:root@localhost:3306/a1_database"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)

# Sample staff and manager IDs (as per the request)
staff_id = 150318  # Fixed Staff ID
manager_id = 151408  # Fixed Manager ID

# Set some random data for work request generation
request_types = ['Full Day', 'AM', 'PM']
reason = '-'  # Same reason for all requests
status = 'Pending'  # All requests will be pending

def generate_mock(num_requests=50):
    today = datetime.today()
    request_date = today + timedelta(days=2)  # Start from 2 days from today

    generated_requests = 0  # Track the number of requests generated

    with app.app_context():
        while generated_requests < num_requests:
            # Skip Saturdays and Sundays
            if request_date.weekday() in (5, 6):  # 5 is Saturday, 6 is Sunday
                request_date += timedelta(days=1)
                continue

            request_type = request_types[generated_requests % len(request_types)]  # Cycle through request types

            # Set request_date time to 00:00:00
            request_date_with_time = datetime.combine(request_date.date(), time.min)

            # Create a new Work Request
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
            request_date += timedelta(days=1)
            generated_requests += 1  # Increment the generated request counter

            print(f"Generated Pending Work Request {generated_requests} and Schedule {generated_requests}")

if __name__ == "__main__":
    generate_mock(50)
