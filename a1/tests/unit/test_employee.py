import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../microservices')))

import pytest
from datetime import datetime, timedelta
from models import Employee  # Now, import WorkRequest after adding the path
from unittest.mock import patch

@pytest.fixture
def employee():
    return Employee(staff_fname="John", staff_lname="Doe", dept="HR", position="Manager", country="US", email="john.doe@example.com", role=1)

def test_employee_creation(employee):
    assert employee.staff_fname == "John"
    assert employee.staff_lname == "Doe"
    assert employee.dept == "HR"
    assert employee.position == "Manager"
    assert employee.country == "US"
    assert employee.email == "john.doe@example.com"
    assert employee.role == 1

def test_employee_json(employee):
    employee_json = employee.json()
    assert employee_json['staff_fname'] == "John"
    assert employee_json['staff_lname'] == "Doe"
    assert employee_json['dept'] == "HR"
    assert employee_json['position'] == "Manager"
    assert employee_json['country'] == "US"
    assert employee_json['email'] == "john.doe@example.com"
    assert employee_json['role'] == 1