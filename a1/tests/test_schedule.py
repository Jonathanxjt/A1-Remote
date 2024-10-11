import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../microservices')))

import pytest
from datetime import datetime, timedelta, date
from models import Schedule  # Now, import WorkRequest after adding the path
from unittest.mock import patch

@pytest.fixture
def schedule():
    return Schedule(staff_id=1, date=date.today(), approved_by=2, request_type="WFH", request_id=1)

def test_schedule_creation(schedule):
    assert schedule.staff_id == 1
    assert schedule.date == date.today()
    assert schedule.approved_by == 2
    assert schedule.request_type == "WFH"
    assert schedule.request_id == 1

def test_schedule_json(schedule):
    schedule_json = schedule.json()
    assert schedule_json['staff_id'] == 1
    assert schedule_json['approved_by'] == 2
    assert schedule_json['request_type'] == "WFH"
    assert schedule_json['request_id'] == 1