from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *

import os
import sys

app = Flask(__name__)

# Configure your database URL (e.g., MySQL)
# app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/a1_database"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:root@localhost:3306/a1_database"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)
CORS(app)

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5004, debug=True)