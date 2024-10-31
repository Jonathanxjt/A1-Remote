import json
import pytest
from datetime import datetime
import sys
import os
from sqlalchemy import inspect
from unittest.mock import patch
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

from scheduler import create_app
from models import Employee, WorkRequest, Notification, db

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

def test_create_work_request_and_schedule(client):
    client, employee, manager, work_request, _, _ = client

    # Prepare data to create a new work request and schedule
    data = {
        "staff_id": employee.staff_id,
        "request_type": "Full Day",
        "request_date": "2025-04-01",
        "reason": "Test reason",
        "exceed": True
    }

    # Mock the responses for each microservice call
    with patch("requests.post") as mock_post, patch("requests.delete") as mock_delete:
        # Mock response for work_request creation
        mock_post.side_effect = [
            # Response for the work_request microservice
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": {
                        "request_id": 99999,
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": {
                        "id": 99999, 
                        "request_id": 1,
                        "status": "Pending"
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": [
                        {
                            "id": 99999, 
                            "request_id": 99999,
                            "message": "Test notification",
                            "sender_id": employee.staff_id,
                            "receiver_id": manager.staff_id
                        }
                    ]
                }
            })
        ]

        mock_delete.return_value = type('Response', (object,), {"status_code": 200})

        response = client.post("/New_WR", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 201
        assert response_data["code"] == 201
        assert "work_request" in response_data["data"]
        assert "schedule" in response_data["data"]
        assert "notification" in response_data["data"]
        assert response_data["data"]["work_request"]["staff_id"] == employee.staff_id

def test_create_work_request_and_schedule_rollback_on_work_request_failure(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "staff_id": employee.staff_id,
        "request_type": "Full Day",
        "request_date": "2025-04-01",
        "reason": "Test reason",
        "exceed": True
    }

    with patch("requests.post") as mock_post, patch("requests.delete") as mock_delete:
        mock_post.side_effect = [
            type('Response', (object,), {
                "status_code": 500,
                "json": lambda: {"message": "Work Request creation failed"}
            })
        ]

        mock_delete.return_value = type('Response', (object,), {"status_code": 200})

        response = client.post("/New_WR", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 500
        assert response_data["code"] == 500
        assert "Work Request creation failed" in response_data["message"]


def test_create_work_request_and_schedule_rollback_on_schedule_failure(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "staff_id": employee.staff_id,
        "request_type": "Full Day",
        "request_date": "2025-04-01",
        "reason": "Test reason",
        "exceed": True
    }

    with patch("requests.post") as mock_post, patch("requests.delete") as mock_delete:
        mock_post.side_effect = [
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": {
                        "request_id": 99999,
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 500,
                "json": lambda: {"message": "Schedule creation failed"}
            })
        ]

        mock_delete.return_value = type('Response', (object,), {"status_code": 200})

        response = client.post("/New_WR", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 500
        assert response_data["code"] == 500
        assert "Failed to create schedule" in response_data["message"]

def test_create_work_request_and_schedule_rollback_on_notification_failure(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "staff_id": employee.staff_id,
        "request_type": "Full Day",
        "request_date": "2025-04-01",
        "reason": "Test reason",
        "exceed": True
    }

    with patch("requests.post") as mock_post, patch("requests.delete") as mock_delete:
        mock_post.side_effect = [
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": {
                        "request_id": 99999,
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 201,
                "json": lambda: {
                    "data": {
                        "id": 88888,
                        "request_id": 99999,
                        "status": "Pending"
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 500,
                "json": lambda: {"message": "Notification creation failed"}
            })
        ]

        mock_delete.side_effect = [
            type('Response', (object,), {"status_code": 200}),
            type('Response', (object,), {"status_code": 200})  
        ]

        response = client.post("/New_WR", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 500
        assert response_data["code"] == 500
        assert "Failed to send notification" in response_data["message"]

def test_update_work_request_and_schedule_success(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "status": "Approved"
    }

    request_id = work_request.request_id

    with patch("requests.put") as mock_put, patch("requests.post") as mock_post:
        mock_put.side_effect = [
            type('Response', (object,), {
                "status_code": 200,
                "json": lambda: {
                    "data": {
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id,
                        "request_type": "Full Day",
                        "request_date": "Wed, 01 Apr 2025 00:00:00 GMT"
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 200,
                "json": lambda: {"data": {"status": "Approved"}}
            })
        ]

        # Mock successful notification creation
        mock_post.return_value = type('Response', (object,), {
            "status_code": 201,
            "json": lambda: {"data": {"id": 99999}}
        })

        # Send PUT request to update work request, schedule, and notification
        response = client.put(f"/scheduler/{request_id}/update_work_request_and_schedule", json=data)
        response_data = json.loads(response.data)

        # Assert successful response
        assert response.status_code == 200
        assert response_data["code"] == 200
        assert "WorkRequest, Schedule, and Notification updated successfully." in response_data["message"]

def test_update_work_request_and_schedule_failure_in_schedule(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "status": "Approved",
        "comments": "Manager approved the request"
    }

    request_id = work_request.request_id

    with patch("requests.put") as mock_put, patch("requests.post") as mock_post:
        mock_put.side_effect = [
            type('Response', (object,), {
                "status_code": 200,
                "json": lambda: {
                    "data": {
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id,
                        "request_type": "Full Day",
                        "request_date": "Wed, 01 Apr 2025 00:00:00 GMT"
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 500,
                "json": lambda: {"message": "Schedule update failed"}
            }),
            type('Response', (object,), {"status_code": 200})
        ]

        response = client.put(f"/scheduler/{request_id}/update_work_request_and_schedule", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 500
        assert response_data["code"] == 500
        assert "Schedule update failed, WorkRequest rolled back." in response_data["message"]

def test_update_work_request_and_schedule_failure_in_notification(client):
    client, employee, manager, work_request, _, _ = client

    data = {
        "status": "Approved",
        "comments": "Manager approved the request"
    }

    request_id = work_request.request_id

    with patch("requests.put") as mock_put, patch("requests.post") as mock_post:
        mock_put.side_effect = [
            type('Response', (object,), {
                "status_code": 200,
                "json": lambda: {
                    "data": {
                        "approval_manager_id": manager.staff_id,
                        "staff_id": employee.staff_id,
                        "request_type": "Full Day",
                        "request_date": "Wed, 01 Apr 2025 00:00:00 GMT"
                    }
                }
            }),
            type('Response', (object,), {
                "status_code": 200,
                "json": lambda: {"data": {"status": "Approved"}}
            })
        ]

        mock_post.return_value = type('Response', (object,), {
            "status_code": 500,
            "json": lambda: {"message": "Notification creation failed"}
        })

        response = client.put(f"/scheduler/{request_id}/update_work_request_and_schedule", json=data)
        response_data = json.loads(response.data)

        assert response.status_code == 500
        assert response_data["code"] == 500
        assert "Failed to send notification" in response_data["message"]

