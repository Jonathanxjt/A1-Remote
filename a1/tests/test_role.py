import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../microservices')))

import pytest
from datetime import datetime, timedelta
from models import Role  # Now, import WorkRequest after adding the path
from unittest.mock import patch

@pytest.fixture
def role():
    return Role(role_name="Admin", role_description="Administrator role")

def test_role_creation(role):
    assert role.role_name == "Admin"
    assert role.role_description == "Administrator role"

def test_role_json(role):
    role_json = role.json()
    assert role_json['role_name'] == "Admin"
    assert role_json['role_description'] == "Administrator role"