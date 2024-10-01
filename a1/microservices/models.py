from flask_sqlalchemy import SQLAlchemy

# Initialize the database
db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'role'

    role = db.Column(db.Integer, primary_key=True, autoincrement=True)
    role_name = db.Column(db.String(50), nullable=False, unique=True)
    role_description = db.Column(db.Text)

    # Relationship with Employee
    employees = db.relationship('Employee', back_populates='role_ref')

    def __init__(self, role_name, role_description=None):
        self.role_name = role_name
        self.role_description = role_description

    def json(self):
        return {
            'role': self.role,
            'role_name': self.role_name,
            'role_description': self.role_description
        }
    

class Employee(db.Model):
    __tablename__ = 'employee'

    staff_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_fname = db.Column(db.String(50), nullable=False)
    staff_lname = db.Column(db.String(50), nullable=False)
    dept = db.Column(db.String(50), nullable=False)
    position = db.Column(db.String(50), nullable=False)
    country = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(50), nullable=False, unique=True)
    reporting_manager = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=True)
    role = db.Column(db.Integer, db.ForeignKey('role.role'), nullable=False)

    # Relationships
    manager = db.relationship('Employee', remote_side=[staff_id], backref='subordinates')
    role_ref = db.relationship('Role', back_populates='employees')

    def __init__(self, staff_fname, staff_lname, dept, position, country, email, reporting_manager=None, role=None):
        self.staff_fname = staff_fname
        self.staff_lname = staff_lname
        self.dept = dept
        self.position = position
        self.country = country
        self.email = email
        self.reporting_manager = reporting_manager
        self.role = role

    def json(self):
        return {
            'staff_id': self.staff_id,
            'staff_fname': self.staff_fname,
            'staff_lname': self.staff_lname,
            'dept': self.dept,
            'position': self.position,
            'country': self.country,
            'email': self.email,
            'reporting_manager': self.reporting_manager,
            'role': self.role
        }


class User(db.Model):
    __tablename__ = 'user'

    staff_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), primary_key=True)
    email = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(255), nullable=False)

    employee = db.relationship('Employee', backref='user_ref')

    def __init__(self, staff_id, email, password):
        self.staff_id = staff_id
        self.email = email
        self.password = password

    def json(self):
        return {
            'staff_id': self.staff_id,
            'email': self.email,
            'password': self.password
        }


class WorkRequest(db.Model):
    __tablename__ = 'work_request'

    request_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    request_type = db.Column(db.String(20), nullable=False)
    request_date = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String(20), default='Pending', nullable=False)
    approval_manager_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'))
    decision_date = db.Column(db.DateTime)
    comments = db.Column(db.Text)

    staff = db.relationship('Employee', foreign_keys=[staff_id], backref='requests')
    approval_manager = db.relationship('Employee', foreign_keys=[approval_manager_id], backref='approved_requests')

    def __init__(self, staff_id, request_type, reason=None, approval_manager_id=None, status='Pending'):
        self.staff_id = staff_id
        self.request_type = request_type
        self.reason = reason
        self.approval_manager_id = approval_manager_id
        self.status = status

    def json(self):
        return {
            'request_id': self.request_id,
            'staff_id': self.staff_id,
            'request_type': self.request_type,
            'request_date': self.request_date,
            'reason': self.reason,
            'status': self.status,
            'approval_manager_id': self.approval_manager_id,
            'decision_date': self.decision_date,
            'comments': self.comments
        }


class Schedule(db.Model):
    __tablename__ = 'schedule'

    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    location = db.Column(db.String(50), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('work_request.request_id'))
    created_by = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    created_date = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    staff = db.relationship('Employee', foreign_keys=[staff_id], backref='schedules')
    creator = db.relationship('Employee', foreign_keys=[created_by], backref='created_schedules')

    def __init__(self, staff_id, date, location, created_by, request_id=None):
        self.staff_id = staff_id
        self.date = date
        self.location = location
        self.created_by = created_by
        self.request_id = request_id

    def json(self):
        return {
            'schedule_id': self.schedule_id,
            'staff_id': self.staff_id,
            'date': self.date,
            'location': self.location,
            'request_id': self.request_id,
            'created_by': self.created_by,
            'created_date': self.created_date
        }


class Audit(db.Model):
    __tablename__ = 'audit'

    log_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    request_id = db.Column(db.Integer, db.ForeignKey('work_request.request_id'), nullable=False)
    manager_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    action_taken = db.Column(db.String(20), nullable=False)
    timestamp = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)
    comments = db.Column(db.Text)

    request = db.relationship('WorkRequest', backref='audits')
    manager = db.relationship('Employee', backref='audit_logs')

    def __init__(self, request_id, manager_id, action_taken, comments=None):
        self.request_id = request_id
        self.manager_id = manager_id
        self.action_taken = action_taken
        self.comments = comments

    def json(self):
        return {
            'log_id': self.log_id,
            'request_id': self.request_id,
            'manager_id': self.manager_id,
            'action_taken': self.action_taken,
            'timestamp': self.timestamp,
            'comments': self.comments
        }

