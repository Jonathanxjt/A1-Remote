from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)