import asyncio
import json
import os
import sys
from datetime import datetime
from unittest.mock import MagicMock, patch
import pytest
from flask_socketio import SocketIO, SocketIOTestClient
from sqlalchemy import inspect

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from models import Employee, Notification, WorkRequest, db
from notification import create_app


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
        db.session.rollback()
        db.session.remove()

@pytest.fixture
def socketio_client(client):
    app, socketio = create_app()
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Create a test client for Socket.IO
    socket_client = socketio.test_client(app)
    
    return socket_client, app, socketio

# Test GET /notification/<int:receiver_id>
def test_get_staff_notifications(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.get(f"/notification/{employee.staff_id}")
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert len(data['data']['Notifications']) == db.session.query(Notification).filter_by(receiver_id=employee.staff_id).count() 
    assert data['data']['Notifications'][0]['receiver_id'] == employee.staff_id

# Test POST /notification/create_notification - Success case
def test_create_notification_success(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'Pending',
        'request_date': '2025-10-17'
    }
    
    response = client.post('/notification/create_notification', 
                          json=notification_data,
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 201
    assert data['code'] == 201
    assert db.session.query(Notification).filter_by(
        receiver_id=employee.staff_id,
        request_id=work_request.request_id
    ).count() >= len(data['data'])
    assert data['message'] == "Notification(s) created successfully"


# Test POST /notification/create_notification - Missing required fields
def test_create_notification_missing_fields(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    incomplete_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id
        # Missing required fields
    }
    
    response = client.post('/notification/create_notification', 
                          json=incomplete_data,
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Missing required fields"


# Test POST /notification/create_notification - Invalid date format
def test_create_notification_invalid_date(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'Pending',
        'request_date': 'invalid-date'
    }
    
    response = client.post('/notification/create_notification', 
                          json=notification_data,
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Invalid date format for request_date"

# Test POST /notification/create_notification - Invalid status
def test_create_notification_invalid_status(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'InvalidStatus',
        'request_date': '2025-10-17'
    }
    
    response = client.post('/notification/create_notification', 
                          json=notification_data,
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 400
    assert data['code'] == 400
    assert data['message'] == "Invalid status provided"

# Test PUT /notification/read_notification/<int:notification_id>
def test_read_notification_success(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.put(f'/notification/read_notification/{notification1.notification_id}')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "Notification updated successfully."
    assert data['data']['is_read'] == True



# Test PUT /notification/read_notification/<int:notification_id> - Not found
def test_read_notification_not_found(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.put('/notification/read_notification/99999')
    data = json.loads(response.data)
    
    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Notification not found."

# Test DELETE /notification/delete_notification/<int:notification_id>
def test_delete_notification_success(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.delete(f'/notification/delete_notification/{notification1.notification_id}')
    data = json.loads(response.data)
    
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['message'] == "Notification deleted successfully."



# Test DELETE /notification/delete_notification/<int:notification_id> - Not found
def test_delete_notification_not_found(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    response = client.delete('/notification/delete_notification/99999')
    data = json.loads(response.data)
    
    assert response.status_code == 404
    assert data['code'] == 404
    assert data['message'] == "Notification not found."


# Test special case - Create notification with exceed flag
def test_create_notification_with_exceed(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'Pending',
        'request_date': '2025-10-17',
        'exceed': True
    }
    
    response = client.post('/notification/create_notification', 
                          json=notification_data,
                          content_type='application/json')
    data = json.loads(response.data)
    
    assert response.status_code == 201
    assert data['code'] == 201
    assert len(data['data']) > 1  # Should have both regular and exceed notifications
    assert any("exceeded 2 WFH requests" in notif['message'] for notif in data['data'])

# Test create_notification with an exception on db.session.commit()
def test_create_notification_commit_exception(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'Pending',
        'request_date': '2025-10-17'
    }
    
    # Simulate a commit exception
    with patch('notification.db.session.commit', side_effect=Exception("Commit failed")):
        response = client.post('/notification/create_notification', json=notification_data)
        data = json.loads(response.data)
        
        assert response.status_code == 500
        assert data['code'] == 500
        assert "An error occurred" in data['message']

# Test read_notification where db.session.commit() raises an exception
def test_read_notification_commit_exception(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    with patch('notification.db.session.commit', side_effect=Exception("Commit failed")):
        response = client.put(f'/notification/read_notification/{notification1.notification_id}')
        data = json.loads(response.data)
        
        assert response.status_code == 500
        assert data['code'] == 500
        assert "An error occurred" in data['message']

# Test delete_notification with exception on db.session.commit()
def test_delete_notification_commit_exception(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    # Simulate a commit exception during deletion
    with patch('notification.db.session.commit', side_effect=Exception("Commit failed")):
        response = client.delete(f'/notification/delete_notification/{notification1.notification_id}')
        data = json.loads(response.data)
        
        assert response.status_code == 500
        assert data['code'] == 500
        assert "An error occurred" in data['message']

# Test create_notification with missing request_date
def test_create_notification_missing_request_date(client):
    client, employee, manager, work_request, notification1, notification2 = client
    
    # Missing the 'request_date' field
    notification_data = {
        'sender_id': manager.staff_id,
        'receiver_id': employee.staff_id,
        'request_id': work_request.request_id,
        'request_type': 'Full Day',
        'status': 'Pending'
    }
    
    response = client.post('/notification/create_notification', json=notification_data)
    data = json.loads(response.data)
    
    assert response.status_code == 500
    assert data['code'] == 500
    assert "An error occurred" in data['message']

    # Cleanup: delete all notifications sent by the manager
    db.session.query(Notification).filter_by(sender_id=manager.staff_id).delete()
    db.session.commit()

# Test Socket.IO connection
def test_socketio_connection(socketio_client):
    socket_client, _, _ = socketio_client
    
    assert socket_client.is_connected()

# Test joining a room
def test_join_room(socketio_client):
    socket_client, _, _ = socketio_client
    
    # Emit join event with staff_id
    socket_client.emit('join', {'staff_id': 999998})
    
    # Get the received message (if any)
    received = socket_client.get_received()
    
    # Verify connection is still active after joining
    assert socket_client.is_connected()

# Test WebSocket disconnection
def test_socketio_disconnect(socketio_client):
    socket_client, _, _ = socketio_client
    
    # Disconnect the client
    socket_client.disconnect()
    
    # Verify the client is disconnected
    assert not socket_client.is_connected()


