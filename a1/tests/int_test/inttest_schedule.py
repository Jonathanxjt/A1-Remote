import json
import pytest

import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../microservices')))

from schedule import app, db
from models import Schedule, Employee

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'  # Use in-memory SQLite for testing
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # To suppress warnings
    client = app.test_client()

    with app.app_context():
        db.create_all()
        yield client
        db.session.remove()
        db.drop_all()



# Test for "/schedule" route
def test_get_all_schedules(client):
    employee = Employee(staff_fname="John", staff_lname="Doe", dept="Sales", position="Sales Manager", country="Singapore", email="john.doe@allinone.com.sg")
    schedule1 = Schedule(staff_id=1, date="2024-10-18", approved_by=1, request_id=101, request_type="Full Day", status="Approved")
    schedule2 = Schedule(staff_id=1, date="2024-10-17", approved_by=1, request_id=102, request_type="AM", status="Approved")
    
    db.session.add(employee)
    db.session.add(schedule1)
    db.session.add(schedule2)
    db.session.commit()

    response = client.get("/schedule")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['schedule']) == 2
    assert data['data']['schedule'][0]['request_id'] == 101
    assert data['data']['schedule'][1]['request_id'] == 102


# # Test for "/schedule/<int:staff_id>/employee" route
# def test_get_employee_schedule(client):
#     # Prepopulate the database with test data
#     employee = Employee(staff_fname="Jane", staff_lname="Doe", dept="IT", position="Developer", country="US", email="jane.doe@example.com")
#     schedule1 = Schedule(staff_id=1, date="2024-10-20", approved_by=2, request_id=201, request_type="Project Work", status="Completed")
#     schedule2 = Schedule(staff_id=1, date="2024-10-21", approved_by=2, request_id=202, request_type="Training", status="Scheduled")
    
#     db.session.add(employee)
#     db.session.add(schedule1)
#     db.session.add(schedule2)
#     db.session.commit()

#     # Make a GET request to /schedule/<int:staff_id>/employee route
#     response = client.get("/schedule/1/employee")
#     data = json.loads(response.data)

#     assert response.status_code == 200
#     assert len(data['data']['work_request']) == 2
#     assert data['data']['work_request'][0]['request_id'] == 201
#     assert data['data']['work_request'][1]['request_id'] == 202


# # Test for empty schedule list
# def test_get_all_schedules_empty(client):
#     # Make a GET request to the /schedule route without any data
#     response = client.get("/schedule")
#     data = json.loads(response.data)

#     assert response.status_code == 404
#     assert data['message'] == "There are no Schedule."


# # Test for employee schedule with no data
# def test_get_employee_schedule_empty(client):
#     # Make a GET request to /schedule/<int:staff_id>/employee route without any data
#     response = client.get("/schedule/1/employee")
#     data = json.loads(response.data)

#     assert response.status_code == 404
#     assert data['message'] == "There are no Schedule."
