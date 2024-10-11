import sys
import os

# Add the microservices folder to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../microservices')))

import pytest
from datetime import datetime, timedelta
from models import User  # Now, import WorkRequest after adding the path
from unittest.mock import patch

@pytest.fixture
def user():
    return User(staff_id=1, email="john.doe@example.com", password="hashed_password")

def test_user_creation(user):
    assert user.staff_id == 1
    assert user.email == "john.doe@example.com"
    assert user.password == "hashed_password"

def test_user_json(user):
    user_json = user.json()
    assert user_json['staff_id'] == 1
    assert user_json['email'] == "john.doe@example.com"
    assert user_json['password'] == "hashed_password"