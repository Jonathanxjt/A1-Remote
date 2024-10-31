import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from employee import create_app  # Assuming you have a factory function to create the app

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
        db.session.remove()

def test_get_all(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.get("/employee")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert len(data['data']['employee_list']) == db.session.query(Employee).count()

def test_get_employee_by_staff_id(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    response = client.get(f"/employee/{employee.staff_id}")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200

    employee_data = data['data']['employee']
    assert employee_data['staff_fname'] == employee.staff_fname
    assert employee_data['staff_lname'] == employee.staff_lname
    assert employee_data['email'] == employee.email
    assert employee_data['dept'] == employee.dept
    assert employee_data['position'] == employee.position
    assert employee_data['country'] == employee.country
    assert employee_data['role'] == employee.role

def test_get_reporting_manager(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    
    response = client.get(f"/employee/{employee.staff_id}/manager")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['data']['staff_id'] == employee.staff_id

    expected_reporting_manager = db.session.query(Employee.reporting_manager).filter_by(staff_id=employee.staff_id).first()
    assert data['data']['reporting_manager'] == expected_reporting_manager.reporting_manager

def test_get_employee_role(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client
    
    response = client.get(f"/employee/{employee.staff_id}/role")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['data']['staff_id'] == employee.staff_id

    expected_role = db.session.query(Employee.role).filter_by(staff_id=employee.staff_id).first()
    assert data['data']['role'] == expected_role.role

def test_get_employees_by_role(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client

    response = client.get(f"/employee/{employee.role}/get_by_role")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200

    expected_employees = db.session.query(Employee).filter_by(role=employee.role).all()
    assert len(data['data']['employee']) == len(expected_employees)
    for i, emp in enumerate(expected_employees):
        assert data['data']['employee'][i]['staff_id'] == emp.staff_id

def test_get_employees_by_dept(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client

    response = client.get(f"/employee/{employee.dept}/get_by_dept")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200

    expected_employees = db.session.query(Employee).filter_by(dept=employee.dept).all()
    assert len(data['data']['employee']) == len(expected_employees)
    for i, emp in enumerate(expected_employees):
        assert data['data']['employee'][i]['staff_id'] == emp.staff_id

def test_get_team_members(client):
    client, employee, manager, request1, request2, schedule1, schedule2 = client

    response = client.get(f"/employee/{manager.staff_id}/team")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200

    expected_team_members = db.session.query(Employee).filter_by(reporting_manager=manager.staff_id).all()
    assert len(data['data']['members']) == len(expected_team_members)
    for i, member in enumerate(expected_team_members):
        assert data['data']['members'][i]['staff_id'] == member.staff_id