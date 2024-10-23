from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import pytz
# Initialize the database
db = SQLAlchemy()

# class Role(db.Model):
#     __tablename__ = 'role'

#     role = db.Column(db.Integer, primary_key=True, autoincrement=True)
#     role_name = db.Column(db.String(50), nullable=False, unique=True)
#     role_description = db.Column(db.Text)

#     # Relationship with Employee
#     employees = db.relationship('Employee', back_populates='role_ref')

#     def __init__(self, role_name, role_description=None):
#         self.role_name = role_name
#         self.role_description = role_description

#     def json(self):
#         return {
#             'role': self.role,
#             'role_name': self.role_name,
#             'role_description': self.role_description
#         }
    

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
    role = db.Column(db.Integer, nullable=False)

    # Relationships
    manager = db.relationship('Employee', remote_side=[staff_id], backref='subordinates')

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
    
    # to encapsulate is it to get_password in the class? so def get_password(self)


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
    created_date = db.Column(db.DateTime, default=db.func.current_timestamp(), nullable=False)

    staff = db.relationship('Employee', foreign_keys=[staff_id], backref='requests')
    approval_manager = db.relationship('Employee', foreign_keys=[approval_manager_id], backref='approved_requests')

    def __init__(self, staff_id, request_type, request_date, approval_manager_id, reason, comments = None, decision_date = None, status='Pending'):
        self.staff_id = staff_id
        self.request_type = request_type
        self.request_date = request_date
        self.reason = reason
        self.approval_manager_id = approval_manager_id
        self.decision_date = decision_date
        self.comments = comments
        self.status = status

    # Validation to ensure required fields
    @staticmethod
    def validate_required_fields(staff_id, request_type, request_date, reason):
        if not staff_id or not request_type or not request_date or not reason:
            raise ValueError("Missing required fields: staff_id, request_type, request_date, or reason.")

    # Validation to ensure request date is not a weekend
    @staticmethod
    def validate_weekday(request_date):
        if request_date.weekday() in (5, 6):  # 5 is Saturday, 6 is Sunday
            raise ValueError("You cannot submit a work-from-home request for a Saturday or Sunday.")

    # Validation to ensure request is made at least 24 hours in advance
    @staticmethod
    def validate_advance_request(request_date):
        current_time = datetime.now()
        if (request_date - current_time).total_seconds() < 86400:
            raise ValueError("You must submit the request at least 24 hours in advance.")

    # Validation to ensure no duplicate work requests
    @staticmethod
    def check_duplicate_request(staff_id, request_date):
        existing_request = db.session.query(WorkRequest).filter(
            WorkRequest.staff_id == staff_id,
            WorkRequest.request_date == request_date,
            WorkRequest.status.in_(["Pending", "Approved"])
        ).first()
        if existing_request:
            raise ValueError("You have already submitted a WFH request for that day.")

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
            'comments': self.comments,
            'created_date': self.created_date
        }


class Schedule(db.Model):
    __tablename__ = 'schedule'

    schedule_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    staff_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('work_request.request_id'))
    approved_by = db.Column(db.Integer, db.ForeignKey('employee.staff_id'))
    request_type = db.Column(db.String(20), nullable=False)
    status = db.Column(db.String(20), default='Pending', nullable=False)

    staff = db.relationship('Employee', foreign_keys=[staff_id], backref='schedules')
    manager = db.relationship('Employee', foreign_keys=[approved_by], backref='created_schedules')

    def __init__(self, staff_id, date, approved_by, request_type, request_id, status = "Pending"):
        self.staff_id = staff_id
        self.date = date
        self.approved_by = approved_by
        self.request_id = request_id
        self.request_type = request_type
        self.status = status

    def json(self):
        return {
            'schedule_id': self.schedule_id,
            'staff_id': self.staff_id,
            'date': self.date,
            'request_id': self.request_id,
            'approved_by': self.approved_by,
            'request_type': self.request_type,
            'status': self.status
        }
    
    # Static method to validate if the schedule date is on a weekend
    @staticmethod
    def validate_weekend(date):
        if date.weekday() in (5, 6):
            raise ValueError("You cannot create a schedule for a Saturday or Sunday.")

    # Static method to validate if the schedule is at least 24 hours in the future
    @staticmethod
    def validate_advance_schedule(date):
        current_time = datetime.now()
        if (date - current_time).total_seconds() < 86400:
            raise ValueError("The schedule must be created for a date at least 24 hours in advance.")

    # Class method to check for existing schedule by request ID
    @classmethod
    def check_existing_schedule(cls, request_id):
        existing_schedule = db.session.query(cls).filter_by(request_id=request_id).first()
        if existing_schedule:
            raise ValueError("A schedule for this work request already exists.")

    # Class method to create a new schedule from a work request
    @classmethod
    def create_from_work_request(cls, work_request):
        staff_id = work_request.staff_id
        approved_by = work_request.approval_manager_id
        date = work_request.request_date
        request_type = work_request.request_type
        status = work_request.status

        # Validate date (e.g., not on a weekend or less than 24 hours in the future)
        cls.validate_weekend(date)
        cls.validate_advance_schedule(date)

        # Create a new Schedule object
        new_schedule = cls(
            staff_id=staff_id,
            date=date,
            approved_by=approved_by,
            request_id=work_request.request_id,
            request_type=request_type,
            status=status
        )

        db.session.add(new_schedule)
        db.session.commit()
        return new_schedule


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

class Notification(db.Model):
    __tablename__ = 'notification'

    notification_id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('employee.staff_id'), nullable=False)
    request_id = db.Column(db.Integer, db.ForeignKey('work_request.request_id'), nullable=False)
    message = db.Column(db.Text, nullable=False)

    notification_date = db.Column(
        db.DateTime, 
        default=lambda: datetime.now(pytz.timezone('Asia/Singapore')), 
        nullable=False
    )
    is_read = db.Column(db.Boolean, default=False, nullable=False)

    sender = db.relationship('Employee', foreign_keys=[sender_id], backref='sent_notifications')
    receiver = db.relationship('Employee', foreign_keys=[receiver_id], backref='received_notifications')
    work_request = db.relationship('WorkRequest', backref='notifications')

    def __init__(self, sender_id, receiver_id, request_id, message):
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.request_id = request_id
        self.message = message

    def json(self):
        return {
            'notification_id': self.notification_id,
            'sender_id': self.sender_id,
            'sender_name': f"{self.sender.staff_fname} {self.sender.staff_lname}" if self.sender else None,
            'receiver_id': self.receiver_id,
            'receiver_name': f"{self.receiver.staff_fname} {self.receiver.staff_lname}" if self.receiver else None,
            'request_id': self.request_id,
            'message': self.message,
            'notification_date': self.notification_date.strftime('%Y-%m-%d %H:%M:%S'),
            'is_read': self.is_read
        }