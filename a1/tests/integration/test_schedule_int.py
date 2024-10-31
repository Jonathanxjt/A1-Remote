import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from schedule import create_app  # Assuming you have a factory function to create the app

from models import Employee, Schedule, WorkRequest, Audit, db

@pytest.fixture
def client():
    app = create_app()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    client = app.test_client()

    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("Tables in the in-memory database:", tables)
        # employee = Employee(staff_fname="John", staff_lname="Doe", dept="Sales", position="Sales Manager", country="Singapore", email="john.doe@allinone.com.sg", role=2)
        # manager = Employee(staff_fname="Emma", staff_lname="Doe", dept="Sales", position="Sales Director", country="Singapore", email="emma.doe@allinone.com.sg", role=3)
        # db.session.add(employee)
        # db.session.add(manager)
        # db.session.flush()
        employee = db.session.query(Employee).filter_by(staff_id=999998).first()
        manager = db.session.query(Employee).filter_by(staff_id=999999).first()
        request1 = db.session.query(WorkRequest).filter_by(staff_id=999998).first()
        request2 = db.session.query(WorkRequest).filter_by(staff_id=999998).offset(1).limit(1).first()
        schedule1 = db.session.query(Schedule).filter_by(staff_id=999998).first()
        schedule2 = db.session.query(Schedule).filter_by(staff_id=999998).offset(1).limit(1).first()
        # request1 = WorkRequest(staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.now(), approval_manager_id=manager.staff_id, reason="Personal work")
        # request2 = WorkRequest(staff_id=employee.staff_id, request_type="AM", request_date=datetime.now(), approval_manager_id=manager.staff_id, reason="Personal work")
        # db.session.add(request1)
        # db.session.add(request2)
        # db.session.flush()
        # schedule1 = Schedule(staff_id=employee.staff_id, date=datetime.strptime("2025-10-18", "%Y-%m-%d").date(), approved_by=manager.staff_id, request_id=request1.request_id, request_type="Full Day", status="Pending")
        # schedule2 = Schedule(staff_id=employee.staff_id, date=datetime.strptime("2025-10-17", "%Y-%m-%d").date(), approved_by=manager.staff_id, request_id=request2.request_id, request_type="AM", status="Pending")
        # db.session.add(schedule1)
        # db.session.add(schedule2)
        # db.session.flush()


        yield client, employee, manager, request1, request2, schedule1, schedule2
        db.session.remove()
        # db.drop_all() 


# Test for "/schedule" route
def test_get_all_schedules(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.get("/schedule")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['schedule']) == db.session.query(Schedule).count()

# Test for "/schedule/<int:staff_id>/employee"
def test_get_employee_schedule(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client

    response = client.get(f"/schedule/{employee.staff_id}/employee")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['work_request']) == db.session.query(Schedule).filter_by(staff_id=employee.staff_id).count()
    assert data['data']['work_request'][0]['request_id'] == schedule1.request_id

# # Test for "/schedule/<int:staff_id>/manager"
# def test_get_manager_schedule(client):
#     client, employee, manager, request1, request2, schedule1, schedule2 = client
#     response = client.get(f"/schedule/{manager.staff_id}/manager")
#     data = json.loads(response.data)
#     # assert data == 200
#     assert response.status_code == 200
#     assert len(data['data']['manager_schedule']) == 0

# Test for "/schedule/team/<int:reporting_manager>" with mock external employee service
@patch('requests.get')
def test_get_team_schedules(mock_get,client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    mock_get.return_value.status_code = 200
    mock_get.return_value.json.return_value = {
        "data": {
            "members": [
                {"staff_id": 999998, "staff_fname": "Test_Staff", "staff_lname": "Test_Staff"},
                {"staff_id": 999999, "staff_fname": "Test_Manager", "staff_lname": "Test_Manager"}
            ]
        }
    }

    response = client.get("/schedule/team/999999")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']) == 3
    # assert data['data'][0]['schedule'][0]['request_id'] == schedule1.request_id

# Test for creating a schedule - POST /schedule/create_schedule
def test_create_schedule_success(client):
    # Add work request to the database
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.flush()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 201
    assert data['code'] == 201
    assert data['message'] == "Schedule created successfully."
    assert data['data']['request_id'] == work_request.request_id

def test_create_schedule_missing_request_id(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.post('/schedule/create_schedule', json={})
    data = json.loads(response.data)

    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Missing required field: request_id."

def test_create_schedule_non_existent_work_request(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.post('/schedule/create_schedule', json={'request_id': 999})
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Work request not found."

def test_create_schedule_already_exists(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.flush()

    existing_schedule = Schedule.create_from_work_request(work_request)
    db.session.add(existing_schedule)
    db.session.flush()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })

    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert "A schedule for this work request already exists." in data['message']

# Test for creating a schedule - POST /schedule/create_schedule [Fail - WFH request must be 1 day before data applied]
def test_create_schedule_success(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    # Add work request to the database
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2024-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.flush()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "The schedule must be created for a date at least 24 hours in advance."

# Test for creating a schedule - POST /schedule/create_schedule [Fail - WFH request must be on Weekday]
def test_create_schedule_success(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    # Add work request to the database
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-18", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.flush()

    response = client.post('/schedule/create_schedule', json={
        'request_id': work_request.request_id
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "You cannot create a schedule for a Saturday or Sunday."


# Test for updating schedule status - PUT /schedule/<int:request_id>/update_status
def test_update_schedule_status_success(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    db.session.flush()
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.flush()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={
        'status': 'Approved'
    })

    data = json.loads(response.data)
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "Schedule updated successfully."
    assert data['data']['status'] == 'Approved'

def test_update_schedule_status_missing_status(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.flush()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={})
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Status is required."

def test_update_schedule_status_invalid_status(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    work_request = WorkRequest(
        staff_id=employee.staff_id, request_type="Full Day", request_date=datetime.strptime("2025-10-17", "%Y-%m-%d"),
        approval_manager_id=manager.staff_id, reason="Work from home"
    )
    db.session.add(work_request)
    schedule = Schedule.create_from_work_request(work_request)
    db.session.add(schedule)
    db.session.flush()

    response = client.put(f'/schedule/{work_request.request_id}/update_status', json={
        'status': 'InvalidStatus'
    })
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Invalid status"

def test_update_schedule_status_non_existent_schedule(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.put('/schedule/999/update_status', json={
        'status': 'Approved'
    })
    
    data = json.loads(response.data)
    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Schedule not found."

