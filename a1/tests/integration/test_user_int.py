import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
from dotenv import load_dotenv
load_dotenv()
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from user import create_app  # Assuming you have a factory function to create the app

from models import Employee, Schedule, WorkRequest, Audit, db, Notification, User

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
        employee_user = db.session.query(User).filter_by(staff_id=999998).first()
        manager_user = db.session.query(User).filter_by(staff_id=999999).first()
        yield client, employee, manager, request1, request2, schedule1, schedule2, employee_user, manager_user
        db.session.remove()


def test_get_all_users(client):
    client, _, _, _, _, _, _, employee_user, manager_user = client
    
    response = client.get("/user")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert len(data['data']['user_list']) > 0
    assert any(user['staff_id'] == employee_user.staff_id for user in data['data']['user_list'])
    assert any(user['staff_id'] == manager_user.staff_id for user in data['data']['user_list'])

def test_get_user_by_staff_id(client):
    client, _, _, _, _, _, _, employee_user, _ = client
    
    response = client.get(f"/user/{employee_user.staff_id}")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['data']['user'][0]['staff_id'] == employee_user.staff_id
    assert data['data']['user'][0]['email'] == employee_user.email

def test_get_non_existent_user_by_staff_id(client):
    client, _, _, _, _, _, _, _, _ = client
    
    response = client.get("/user/123456")
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "There are no users."

def test_get_user_by_email(client):
    client, _, _, _, _, _, _, _, manager_user = client
    
    response = client.get(f"/user_email/{manager_user.email}")
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['data']['user'][0]['email'] == manager_user.email

def test_get_non_existent_user_by_email(client):
    client, _, _, _, _, _, _, _, _ = client
    
    response = client.get("/user_email/nonexistent@example.com")
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "There are no users."

def test_authenticate_user_success(client):
    client, _, _, _, _, _, _, employee_user, _ = client
    password = os.getenv("TEST_USER_PASSWORD")
    response = client.post('/authenticate', json={
        "email": employee_user.email,
        "password": password
    })
    data = json.loads(response.data)

    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "Authentication successful"
    assert data['data']['user']['email'] == employee_user.email

def test_authenticate_user_incorrect_password(client):
    client, _, _, _, _, _, _, employee_user, _ = client
    
    response = client.post('/authenticate', json={
        "email": employee_user.email,
        "password": "wrong_password"
    })
    data = json.loads(response.data)

    assert response.status_code == 401
    assert data['code'] == 401
    assert data['message'] == "Invalid password"

def test_authenticate_non_existent_user(client):
    client, _, _, _, _, _, _, _, _ = client
    
    response = client.post('/authenticate', json={
        "email": "nonexistent@example.com",
        "password": "any_password"
    })
    data = json.loads(response.data)

    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "User not found"