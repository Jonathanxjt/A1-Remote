import sys
import os

# Add the microservices folder to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../microservices')))

import pytest
from datetime import datetime, timedelta
from models import WorkRequest  # Now, import WorkRequest after adding the path
from unittest.mock import patch


@pytest.fixture
def work_request():
    return WorkRequest(staff_id=1, request_type="WFH", request_date=datetime.now(), approval_manager_id=2, reason="Personal work")

def test_work_request_creation(work_request):
    assert work_request.staff_id == 1
    assert work_request.request_type == "WFH"
    assert work_request.reason == "Personal work"
    assert work_request.approval_manager_id == 2

def test_work_request_json(work_request):
    work_request_json = work_request.json()
    assert work_request_json['staff_id'] == 1
    assert work_request_json['request_type'] == "WFH"
    assert work_request_json['reason'] == "Personal work"
    assert work_request_json['approval_manager_id'] == 2
    
# Test validate_required_fields
def test_validate_required_fields_success():
    # This should pass with all required fields
    WorkRequest.validate_required_fields(1, "WFH", datetime.now(), "Personal reason")

def test_validate_required_fields_missing():
    # This should raise ValueError due to missing fields
    with pytest.raises(ValueError, match="Missing required fields: staff_id, request_type, request_date, or reason."):
        WorkRequest.validate_required_fields(None, "WFH", datetime.now(), "Personal reason")

    with pytest.raises(ValueError, match="Missing required fields: staff_id, request_type, request_date, or reason."):
        WorkRequest.validate_required_fields(1, None, datetime.now(), "Personal reason")

    with pytest.raises(ValueError, match="Missing required fields: staff_id, request_type, request_date, or reason."):
        WorkRequest.validate_required_fields(1, "WFH", None, "Personal reason")

    with pytest.raises(ValueError, match="Missing required fields: staff_id, request_type, request_date, or reason."):
        WorkRequest.validate_required_fields(1, "WFH", datetime.now(), "")

# Test validate_weekday
def test_validate_weekday_success():
    # Test a weekday (not a weekend)
    weekday_date = datetime(2023, 10, 10)  # Tuesday
    WorkRequest.validate_weekday(weekday_date)  # Should pass with no error

def test_validate_weekday_fail():
    # Test for a weekend (Saturday)
    saturday_date = datetime(2023, 10, 7)  # Saturday
    with pytest.raises(ValueError, match="You cannot submit a work-from-home request for a Saturday or Sunday."):
        WorkRequest.validate_weekday(saturday_date)

    # Test for a weekend (Sunday)
    sunday_date = datetime(2023, 10, 8)  # Sunday
    with pytest.raises(ValueError, match="You cannot submit a work-from-home request for a Saturday or Sunday."):
        WorkRequest.validate_weekday(sunday_date)

# Test validate_advance_request
def test_validate_advance_request_success():
    # Test for a date 2 days in the future
    future_date = datetime.now() + timedelta(days=2)
    WorkRequest.validate_advance_request(future_date)  # Should pass with no error

def test_validate_advance_request_fail():
    # Test for a date less than 24 hours in the future
    less_than_24_hours = datetime.now() + timedelta(hours=23)
    with pytest.raises(ValueError, match="You must submit the request at least 24 hours in advance."):
        WorkRequest.validate_advance_request(less_than_24_hours)

# Test check_duplicate_request using mock
@patch('models.db.session.query')  # Adjust the mock path to match your project structure
def test_check_duplicate_request_no_duplicate(mock_query):
    # Simulate no existing work request
    mock_query.return_value.filter.return_value.first.return_value = None
    WorkRequest.check_duplicate_request(1, datetime.now())  # Should pass with no error

@patch('models.db.session.query')  # Adjust the mock path to match your project structure
def test_check_duplicate_request_duplicate(mock_query):
    # Simulate an existing work request
    mock_query.return_value.filter.return_value.first.return_value = True
    with pytest.raises(ValueError, match="You have already submitted a WFH request for that day."):
        WorkRequest.check_duplicate_request(1, datetime.now())
