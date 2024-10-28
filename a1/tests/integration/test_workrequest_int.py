import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from work_request import create_app

from models import Employee, Schedule, WorkRequest, Audit, db, Notification

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

        employee = db.session.query(Employee).filter_by(staff_id=999998).first()
        manager = db.session.query(Employee).filter_by(staff_id=999999).first()
        request1 = db.session.query(WorkRequest).filter_by(staff_id=999998).first()
        request2 = db.session.query(WorkRequest).filter_by(staff_id=999998).offset(1).limit(1).first()
        schedule1 = db.session.query(Schedule).filter_by(staff_id=999998).first()
        schedule2 = db.session.query(Schedule).filter_by(staff_id=999998).offset(1).limit(1).first()

        yield client, employee, manager, request1, request2, schedule1, schedule2
        db.session.rollback()
        db.session.remove()

def test_get_all_work_request(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.get("/work_request")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['work_request']) == db.session.query(WorkRequest).count()

def test_get_employee_work_requests(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    
    response = client.get(f"/work_request/{employee.staff_id}/employee")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert len(data['data']['work_request']) == db.session.query(WorkRequest).filter_by(staff_id=employee.staff_id).count()

def test_get_non_existent_employee_work_requests(client):
    client, _, _, _, _, _, _ = client
    
    response = client.get("/work_request/123456/employee")
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "There are no Requests."

def test_get_manager_work_requests(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    
    response = client.get(f"/work_request/{manager.staff_id}/manager")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert len(data['data']['work_request']) == db.session.query(WorkRequest).filter_by(approval_manager_id=manager.staff_id).count()

def test_create_work_request(client):
    client, employee, _, _, _, _, _ = client
    
    response = client.post("/work_request/submit_work_request", json={
        "staff_id": employee.staff_id,
        "request_type": "Full Day",
        "request_date": "2025-06-06",
        "reason": "-", 
        "comments": ""
    })
    data = json.loads(response.data)
    
    print("Response Message:", data.get("message"))
    
    assert response.status_code == 201
    assert data['code'] == 201
    assert data['message'] == "Work request created successfully."
    assert data['data']['staff_id'] == employee.staff_id
    
    created_request_id = data['data']['request_id']
    work_request = db.session.query(WorkRequest).filter_by(request_id=created_request_id).first()
    
    if work_request:
        db.session.delete(work_request)
        db.session.commit()

def test_create_work_request_missing_manager(client):
    client, _, _, _, _, _, _ = client
    
    response = client.post("/work_request/submit_work_request", json={
        "staff_id": 123456, 
        "request_type": "Full Day",
        "request_date": "2025-05-02",
        "reason": "Personal work",
        "comments": ""
    })
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Manager not found for the given staff member."

def test_update_work_request_status(client):
    client, _, _, request1, _, _, _ = client

    response = client.put(f"/work_request/{request1.request_id}/update_status", json={
        "status": "Approved",
        "comments": "Approved by manager"
    })
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "WorkRequest updated successfully."
    assert data['data']['status'] == "Approved"
    
    work_request = db.session.query(WorkRequest).filter_by(request_id=request1.request_id).first()
    if work_request:
        work_request.status = "Pending"
        db.session.commit()

def test_update_work_request_status_invalid_status(client):
    client, _, _, request1, _, _, _ = client
    
    response = client.put(f"/work_request/{request1.request_id}/update_status", json={
        "status": "InvalidStatus"
    })
    data = json.loads(response.data)

    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Invalid status."

def test_update_work_request_status_missing_comments_for_rejection(client):
    client, _, _, request1, _, _, _ = client
    
    response = client.put(f"/work_request/{request1.request_id}/update_status", json={
        "status": "Rejected"
    })
    data = json.loads(response.data)

    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Comments are required when rejecting/revoking a request."