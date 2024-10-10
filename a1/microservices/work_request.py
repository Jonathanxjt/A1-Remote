from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
from datetime import datetime
import requests

load_dotenv()

import os
import sys

app = Flask(__name__)

# Configure your database URL (e.g., MySQL)
# app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:root@localhost:3306/a1_database"
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")


app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)
CORS(app)    


@app.route("/work_request")
def get_all():
    work_request = db.session.scalars(db.select(WorkRequest)).all()
    if len(work_request):
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [request.json() for request in work_request]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Requests."}), 404

@app.route("/work_request/<int:staff_id>/employee")
def get_employee_work_requests(staff_id):
    work_request = db.session.query(WorkRequest).filter_by(staff_id=staff_id).all()
    if work_request:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [request.json() for request in work_request]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Requests."}), 404

@app.route("/work_request/<int:approval_manager_id>/manager")
def get_manager_work_requests(approval_manager_id):
    work_request = db.session.query(WorkRequest).filter_by(approval_manager_id = approval_manager_id).all()
    if work_request:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [request.json() for request in work_request]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Requests."}), 404


@app.route("/email_request/<string:email>/employee")
def get_employee_work_requests_email(email):
    staff_id = db.session.query(Employee).filter_by(email=email).first().staff_id
    work_request = db.session.query(WorkRequest).filter_by(staff_id=staff_id).all()
    if work_request:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [request.json() for request in work_request]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Requests."}), 404


@app.route("/email_request/<string:email>/manager")
def get_manager_work_requests_email(email):
    approval_manager_id = db.session.query(Employee).filter_by(email=email).first().staff_id
    work_request = db.session.query(WorkRequest).filter_by(approval_manager_id = approval_manager_id).all()
    if work_request:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [request.json() for request in work_request]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Requests."}), 404


# Work Request Creation
@app.route("/work_request/submit_work_request", methods=["POST"])
def create_work_request():
    try:
        # Parse the incoming JSON data
        data = request.json
        
        # Required fields in the request body
        staff_id = data.get("staff_id")
        request_type = data.get("request_type")
        request_date_str = data.get("request_date")  # date string in "YYYY-MM-DD" format
        reason = data.get("reason", "")  # required

        # Optional fields
        comments = data.get("comments", "")  # nullable, optional
        status = "Pending"  # Default status
        decision_date = None  # No decision_date upon submission

        # Convert string dates to actual datetime objects
        request_date = datetime.strptime(request_date_str, "%Y-%m-%d") if request_date_str else None

        # Check for required fields
        if not staff_id or not request_type or not request_date or not reason:
            return jsonify({"code": 400, "message": "Missing required fields: staff_id, request_type, request_date, or reason."}), 400

        # Check if the request date is a weekend (Saturday = 5, Sunday = 6)
        if request_date.weekday() in (5, 6):
            return jsonify({"code": 400, "message": "You cannot submit a work-from-home request for a Saturday or Sunday."}), 400

        # Check if the request date is at least 24 hours in the future
        current_time = datetime.now()
        time_difference = (request_date - current_time).total_seconds()
        if time_difference < 86400:  # 86400 seconds in 24 hours
            return jsonify({"code": 400, "message": "You must submit the request at least 24 hours in advance."}), 400

        # Get the reporting manager for the staff
        manager = db.session.scalars(db.select(Employee.reporting_manager).filter_by(staff_id=staff_id)).first()
        if not manager:
            return jsonify({"code": 404, "message": "Manager not found for the given staff member."}), 404

        # Check if a WorkRequest already exists for the same staff_id and request_date
        existing_request = db.session.query(WorkRequest).filter_by(staff_id=staff_id, request_date=request_date).first()
        if existing_request:
            return jsonify(
                {
                    "code": 400,
                    "message": "You have already submitted a WFH request for that day."
                }
            ), 400
        
        # Create new WorkRequest object
        new_work_request = WorkRequest(
            staff_id=staff_id,
            request_type=request_type,
            request_date=request_date,
            approval_manager_id=manager,
            reason=reason,
            comments=comments,  # Optional
            decision_date=decision_date,  # Initially null
            status=status  # Default 'Pending'
        )

        try:
            # Add the new request to the database
            db.session.add(new_work_request)
            db.session.flush()  # This flushes to get the new request_id but doesn't commit yet

            # Commit the transaction
            db.session.commit()

            return jsonify({
                "code": 201,
                "message": "Work request created successfully.",
                "data": new_work_request.json()
            }), 201
        
        except Exception as e:
            db.session.rollback()
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500

    except Exception as e:
        # Handle any other exceptions
        return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)