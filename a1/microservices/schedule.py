from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
import requests
from datetime import datetime

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

EMPLOYEE_SERVICE_URL = "http://employee:5002"

# Get Everyone's Schedule
@app.route("/schedule")
def get_all():
    schedule = db.session.scalars(db.select(Schedule)).all()
    if schedule:
        return jsonify(
            {
                "code": 200,
                "data": {"schedule": [s.json() for s in schedule]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Schedule."}), 404

# Get Employee's Schedule
@app.route("/schedule/<int:staff_id>/employee")
def get_employee_schedule(staff_id):
    schedule = db.session.query(Schedule).filter_by(staff_id=staff_id).all()
    if schedule:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [s.json() for s in schedule]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Schedule."}), 404

# To get both employee and manager schedule
@app.route("/schedule/<int:staff_id>/manager")
def get_manager_schedule(staff_id):
    manager_schedule = db.session.query(Schedule).filter_by(staff_id=staff_id).all()
    team_schedule = db.session.query(Schedule).filter_by(approved_by=staff_id).all()

    combined_schedule = manager_schedule + team_schedule

    if len(combined_schedule) > 0:
        return jsonify(
            {
                "code": 200,
                "data": {
                    "manager_schedule": [s.json() for s in manager_schedule],
                    "team_schedule": [s.json() for s in team_schedule],
                },
            }
        ), 200
    return jsonify({"code": 404, "message": "There are no schedule found."}), 404

# Get Employee's Schedule Using Email
@app.route("/schedule_email/<string:email>/employee")
def get_employee_schedule_email(email):
    staff_id = db.session.query(Employee).filter_by(email=email).first().staff_id
    schedule = db.session.query(Schedule).filter_by(staff_id=staff_id).all()
    if schedule:
        return jsonify(
            {
                "code": 200,
                "data": {"work_request": [s.json() for s in schedule]},
            }
        )
    return jsonify({"code": 404, "message": "There are no Schedule."}), 404

# To get both employee and manager schedule using email
@app.route("/schedule_email/<string:email>/manager")
def get_manager_schedule_email(email):
    staff_id = db.session.query(Employee).filter_by(email=email).first().staff_id
    manager_schedule = db.session.query(Schedule).filter_by(staff_id=staff_id).all()
    team_schedule = db.session.query(Schedule).filter_by(approved_by=staff_id).all()

    combined_schedule = manager_schedule + team_schedule

    if len(combined_schedule) > 0:
        return jsonify(
            {
                "code": 200,
                "data": {
                    "manager_schedule": [s.json() for s in manager_schedule],
                    "team_schedule": [s.json() for s in team_schedule],
                },
            }
        ), 200
    return jsonify({"code": 404, "message": "There are no schedule found."}), 404

@app.route("/schedule/team/<int:reporting_manager>")
def get_team_schedules(reporting_manager):
    try:
        employee_response = requests.get(f"{EMPLOYEE_SERVICE_URL}/employee/{reporting_manager}/team")
        
        if employee_response.status_code == 200:
            team_members = employee_response.json().get("data").get("members", [])
            
            if not team_members:
                return jsonify({"code": 404, "message": "No team members found."}), 404

            schedules = []
            for member in team_members:
                staff_id = member.get("staff_id")
                schedule_response = db.session.query(Schedule).filter_by(staff_id=staff_id).all()
                
                if schedule_response:
                    schedules.append({
                        "employee": member,
                        "schedule": [s.json() for s in schedule_response]
                    })
                else:
                    schedules.append({
                        "employee": member,
                        "schedule": "No schedule found."
                    })
            
            return jsonify({
                "code": 200,
                "data": schedules
            }), 200
        
        else:
            return jsonify({"code": employee_response.status_code, "message": "Error fetching team members."}), employee_response.status_code

    except requests.exceptions.RequestException as e:
        return jsonify({"code": 500, "message": f"Error calling employee service: {str(e)}"}), 500


@app.route("/schedule/create_schedule", methods=["POST"])
def create_schedule():
    try:
        # Parse the incoming JSON data
        data = request.json
        
        # Required field from the request body (only request_id is required)
        request_id = data.get("request_id")
        
        # Validate that the required field is provided
        if not request_id:
            return jsonify({"code": 400, "message": "Missing required field: request_id."}), 400

        # Check if the request exists in the WorkRequest table
        work_request = db.session.query(WorkRequest).filter_by(request_id=request_id).first()
        if not work_request:
            return jsonify({"code": 404, "message": "Work request not found."}), 404

        # Extract relevant data from the WorkRequest record
        staff_id = work_request.staff_id
        approved_by = work_request.approval_manager_id
        date = work_request.request_date
        request_type = work_request.request_type
        status = work_request.status

        # Check if a schedule already exists for the given request_id
        existing_schedule = db.session.query(Schedule).filter_by(request_id=request_id).first()
        if existing_schedule:
            return jsonify({
                "code": 400,
                "message": "A schedule for this work request already exists."
            }), 400

        # Validate that the extracted fields are present
        if not staff_id or not approved_by or not date or not request_type:
            return jsonify({"code": 400, "message": "Missing required fields in the work request data."}), 400

        # Check if the date falls on a weekend (Saturday = 5, Sunday = 6)
        if date.weekday() in (5, 6):
            return jsonify({"code": 400, "message": "You cannot create a schedule for a Saturday or Sunday."}), 400

        # Check if the date is at least 24 hours in the future
        current_time = datetime.now()
        time_difference = (date - current_time).total_seconds()
        if time_difference < 86400:  # 86400 seconds in 24 hours
            return jsonify({"code": 400, "message": "The schedule must be created for a date at least 24 hours in advance."}), 400

        # Ensure that the staff and approved_by exist in the Employee table
        staff = db.session.query(Employee).filter_by(staff_id=staff_id).first()
        manager = db.session.query(Employee).filter_by(staff_id=approved_by).first()

        if not staff:
            return jsonify({"code": 404, "message": "Staff member not found."}), 404
        if not manager:
            return jsonify({"code": 404, "message": "Approving manager not found."}), 404

        # Create a new Schedule object using data from the work request
        new_schedule = Schedule(
            staff_id=staff_id,
            date=date,
            approved_by=approved_by,
            request_id=request_id,
            request_type=request_type,
            status=status
        )

        # Add the new schedule to the database
        db.session.add(new_schedule)
        db.session.commit()

        return jsonify({
            "code": 201,
            "message": "Schedule created successfully.",
            "data": new_schedule.json()
        }), 201

    except Exception as e:
        # Handle any errors, rollback on failure
        db.session.rollback()
        return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)