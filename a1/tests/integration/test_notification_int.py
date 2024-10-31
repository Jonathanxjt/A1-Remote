import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from notification import create_app
from models import Employee, WorkRequest, Notification, db

@pytest.fixture
def client():
    app, socketio = create_app()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    client = app.test_client()

    with app.app_context():
        db.create_all()

        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print("Tables in the in-memory database:", tables)

        # Get existing test data from database
        employee = db.session.query(Employee).filter_by(staff_id=999998).first()
        manager = db.session.query(Employee).filter_by(staff_id=999999).first()
        work_request = db.session.query(WorkRequest).filter_by(staff_id=999998).first()

        # Create test notifications
        notification1 = Notification(
            sender_id=manager.staff_id,
            receiver_id=employee.staff_id,
            request_id=work_request.request_id,
            message="Test notification 1"
        )
        notification2 = Notification(
            sender_id=manager.staff_id,
            receiver_id=employee.staff_id,
            request_id=work_request.request_id,
            message="Test notification 2"
        )
        db.session.add(notification1)
        db.session.add(notification2)
        db.session.flush()

        yield client, employee, manager, work_request, notification1, notification2
        db.session.remove()

# Test GET /notification/<int:receiver_id>
def test_get_staff_notifications(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.get(f"/notification/{employee.staff_id}")
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['data']['Notifications']) == db.session.query(Notification).filter_by(receiver_id=employee.staff_id).count() 
    assert data['data']['Notifications'][0]['receiver_id'] == employee.staff_id

# Test POST /notification/create_notification - Success case
# def test_create_notification_success(client):
#     client, employee, manager, work_request, notification1, notification2 = client
    
#     notification_data = {
#         'sender_id': manager.staff_id,
#         'receiver_id': employee.staff_id,
#         'request_id': work_request.request_id,
#         'request_type': 'Full Day',
#         'status': 'Pending',
#         'request_date': '2025-10-17'
#     }
    
#     response = client.post('/notification/create_notification', 
#                           json=notification_data,
#                           content_type='application/json')
#     data = json.loads(response.data)
    
#     assert response.status_code == 201
#     assert data['code'] == 201
#     assert len(data['data']) >= db.session.query(Notification).filter_by(receiver_id=employee.staff_id).count()
#     assert data['message'] == "Notification(s) created successfully"

# # Test POST /notification/create_notification - Missing required fields
# def test_create_notification_missing_fields(client):
#     client, employee, manager, work_request, notification1, notification2 = client
    
#     incomplete_data = {
#         'sender_id': manager.staff_id,
#         'receiver_id': employee.staff_id
#         # Missing required fields
#     }
    
#     response = client.post('/notification/create_notification', 
#                           json=incomplete_data,
#                           content_type='application/json')
#     data = json.loads(response.data)
    
#     assert response.status_code == 400
#     assert data['code'] == 400
#     assert data['message'] == "Missing required fields"