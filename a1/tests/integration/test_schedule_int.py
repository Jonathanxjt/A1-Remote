import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from schedule import create_app  # Assuming you have a factory function to create the app

from models import Employee, Role, Schedule, WorkRequest, Audit, db

@pytest.fixture
def client():
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:' 
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    client = app.test_client()

    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("Tables in the in-memory database:", tables)

        yield client
        db.session.remove()
        db.drop_all() 

# Test for "/schedule" route
def test_get_all_schedules(client):
    employee = Employee(staff_fname="John", staff_lname="Doe", dept="Sales", position="Sales Manager", country="Singapore", email="john.doe@allinone.com.sg", role = 2)
    schedule1 = Schedule(staff_id=1, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=1, request_id=101, request_type="Full Day", status="Approved")
    schedule2 = Schedule(staff_id=1, date=datetime.strptime("2024-10-17", "%Y-%m-%d").date(), approved_by=1, request_id=102, request_type="AM", status="Approved")
    
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

# Test for "/schedule/<int:staff_id>/employee"
def test_get_employee_schedule(client):
    employee = Employee(staff_fname="Jane", staff_lname="Doe", dept="Marketing", position="Marketing Manager", country="USA", email="jane.doe@example.com", role=3)
    schedule1 = Schedule(staff_id=1, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=2, request_id=103, request_type="Full Day", status="Approved")
    
    db.session.add(employee)
    db.session.add(schedule1)
    db.session.commit()

    response = client.get("/schedule/1/employee")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['work_request']) == 1
    assert data['data']['work_request'][0]['request_id'] == 103

# Test for "/schedule/<int:staff_id>/manager"
def test_get_manager_schedule(client):
    manager1 = Employee(staff_fname="Alice", staff_lname="Smith", dept="Sales", position="Account Manager", country="Singapore", email="alice.smith@example.com", role=1)
    employee1 = Employee(staff_fname="Bob", staff_lname="Johnson", dept="Sales", position="Sales Manager", country="Singapore", email="bob.johnson@example.com", role=2)

    manager1_schedule = Schedule(staff_id=1, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=1, request_id=104, request_type="Full Day", status="Approved")
    employee1_schedule = Schedule(staff_id=2, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=1, request_id=105, request_type="Half Day", status="Pending")

    db.session.add(manager1)
    db.session.add(employee1)
    db.session.add(manager1_schedule)
    db.session.add(employee1_schedule)
    db.session.commit()

    response = client.get("/schedule/1/manager")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['manager_schedule']) == 1
    assert len(data['data']['team_schedule']) == 2
    assert data['data']['manager_schedule'][0]['request_id'] == 104
    assert data['data']['team_schedule'][1]['request_id'] == 105

# Test for "/schedule/team/<int:reporting_manager>" with mock external employee service
@patch('requests.get')
def test_get_team_schedules(mock_get, client):
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "data": {
            "members": [
                {"staff_id": 2, "staff_fname": "Bob", "staff_lname": "Johnson"},
                {"staff_id": 3, "staff_fname": "Charlie", "staff_lname": "Brown"}
            ]
        }
    }
    employee_manager = Employee(staff_fname="Alice", staff_lname="Smith", dept="Sales", position="Account Manager", country="Singapore", email="alice.smith@example.com", role=1)
    employee_team1 = Employee(staff_fname="Bob", staff_lname="Johnson", dept="Sales", position="Sales Manager", country="Singapore", email="bob.johnson@example.com", role=2)
    employee_team2 = Employee(staff_fname="Charlie", staff_lname="Brown", dept="Sales", position="Sales Manager", country="Singapore", email="charlie.brown@example.com", role=2)

    team1_schedule = Schedule(staff_id=2, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=1, request_id=106, request_type="Full Day", status="Approved")
    team2_schedule = Schedule(staff_id=3, date=datetime.strptime("2024-10-18", "%Y-%m-%d").date(), approved_by=1, request_id=107, request_type="Full Day", status="Approved")

    db.session.add(employee_manager)
    db.session.add(employee_team1)
    db.session.add(employee_team2)
    db.session.add(team1_schedule)
    db.session.add(team2_schedule)
    db.session.commit()

    response = client.get("/schedule/team/1")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']) == 2
    assert data['data'][0]['schedule'][0]['request_id'] == 106
    assert data['data'][1]['schedule'][0]['request_id'] == 107

# Test for creating a schedule - POST /schedule/create_schedule
def test_create_schedule_success(client):
    # Add work request to the database
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.commit()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 201
    assert data['code'] == 201
    assert data['message'] == "Schedule created successfully."
    assert data['data']['request_id'] == work_request.request_id

def test_create_schedule_missing_request_id(client):
    response = client.post('/schedule/create_schedule', json={})
    data = json.loads(response.data)

    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Missing required field: request_id."

def test_create_schedule_non_existent_work_request(client):
    response = client.post('/schedule/create_schedule', json={'request_id': 999})
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Work request not found."

def test_create_schedule_already_exists(client):
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.commit()

    existing_schedule = Schedule.create_from_work_request(work_request)
    db.session.add(existing_schedule)
    db.session.commit()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })

    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert "A schedule for this work request already exists." in data['message']

# Test for creating a schedule - POST /schedule/create_schedule [Fail - WFH request must be 1 day before data applied]
def test_create_schedule_success(client):
    # Add work request to the database
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2024-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.commit()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "The schedule must be created for a date at least 24 hours in advance."

# Test for creating a schedule - POST /schedule/create_schedule [Fail - WFH request must be on Weekday]
def test_create_schedule_success(client):
    # Add work request to the database
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-18", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.commit()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "You cannot create a schedule for a Saturday or Sunday."


# Test for updating schedule status - PUT /schedule/<int:request_id>/update_status
def test_update_schedule_status_success(client):
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.commit()
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.commit()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={
        'status': 'Approved'
    })

    data = json.loads(response.data)
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "Schedule updated successfully."
    assert data['data']['status'] == 'Approved'

def test_update_schedule_status_missing_status(client):
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.commit()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={})
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Status is required."

def test_update_schedule_status_invalid_status(client):
    work_request = WorkRequest(
        staff_id=1, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=1, reason="Work from home"
    )
    db.session.add(work_request)
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.commit()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={
        'status': 'InvalidStatus'
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Invalid status. Status must be either 'Approved' or 'Rejected' or 'Revoked'."

def test_update_schedule_status_non_existent_schedule(client):
    response = client.put('/schedule/999/update_status', json={
        'status': 'Approved'
    })
    
    data = json.loads(response.data)
    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Schedule not found."

