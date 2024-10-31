import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))
import pytest
from datetime import datetime
from unittest.mock import MagicMock

# Assuming the models are in the `models` module
from models import Notification, Employee

@pytest.fixture
def employees():
    """
    Fixture to create and return two Employee instances: sender and receiver.
    """
    sender = Employee(
        staff_fname="John",
        staff_lname="Doe",
        dept="IT",
        position="Developer",
        country="Singapore",
        email="john@example.com",
        role=1
    )
    receiver = Employee(
        staff_fname="Jane",
        staff_lname="Smith",
        dept="HR",
        position="Manager",
        country="Singapore",
        email="jane@example.com",
        role=2
    )
    # Manually assign staff_id since we're not using a database
    sender.staff_id = 1
    receiver.staff_id = 2
    return sender, receiver

@pytest.fixture
def notification(employees):
    """
    Fixture to create and return a Notification instance.
    """
    sender, receiver = employees
    notification = Notification(
        sender_id=sender.staff_id,
        receiver_id=receiver.staff_id,
        request_id=789,
        message="Test Notification"
    )
    # Manually set relationships by assigning Employee instances
    notification.sender = sender
    notification.receiver = receiver
    # Set notification_date manually if necessary
    notification.notification_date = datetime(2021, 1, 1, 0, 0, 0)
    # Explicitly set is_read to False
    notification.is_read = False
    return notification

def test_notification_creation(notification):
    """Test basic notification attributes."""
    assert notification.sender_id == 1, "Sender ID should be 1"
    assert notification.receiver_id == 2, "Receiver ID should be 2"
    assert notification.request_id == 789, "Request ID should be 789"
    assert notification.message == "Test Notification", "Message content mismatch"
    assert notification.is_read is False, "Notification should be unread by default"
    assert notification.notification_date == datetime(2021, 1, 1, 0, 0, 0), "Notification date mismatch"

def test_notification_json(notification):
    """Test JSON serialization with relationships."""
    # Mock the sender and receiver relationships
    notification.sender = MagicMock()
    notification.sender.staff_fname = 'John'
    notification.sender.staff_lname = 'Doe'

    notification.receiver = MagicMock()
    notification.receiver.staff_fname = 'Jane'
    notification.receiver.staff_lname = 'Smith'

    # Ensure is_read is set
    notification.is_read = False

    notification_json = notification.json()

    assert notification_json['sender_id'] == notification.sender_id, "Sender ID mismatch in JSON"
    assert notification_json['receiver_id'] == notification.receiver_id, "Receiver ID mismatch in JSON"
    assert notification_json['request_id'] == 789, "Request ID mismatch in JSON"
    assert notification_json['message'] == "Test Notification", "Message content mismatch in JSON"
    assert notification_json['is_read'] is False, "is_read flag mismatch in JSON"
    assert notification_json['sender_name'] == 'John Doe', "Sender name mismatch in JSON"
    assert notification_json['receiver_name'] == 'Jane Smith', "Receiver name mismatch in JSON"
    assert 'notification_date' in notification_json, "Notification date missing in JSON"

def test_notification_relationships(notification, employees):
    """Test that relationships are properly set up."""
    sender, receiver = employees
    notification.sender = sender
    notification.receiver = receiver

    assert notification.sender.staff_fname == "John", "Sender first name mismatch"
    assert notification.sender.staff_lname == "Doe", "Sender last name mismatch"
    assert notification.receiver.staff_fname == "Jane", "Receiver first name mismatch"
    assert notification.receiver.staff_lname == "Smith", "Receiver last name mismatch"

def test_notification_mark_as_read(notification):
    """Test marking a notification as read."""
    assert not notification.is_read, "Notification should initially be unread"
    notification.is_read = True
    assert notification.is_read, "Notification should be marked as read"


