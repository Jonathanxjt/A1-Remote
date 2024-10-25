from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
import os
import requests

# db = SQLAlchemy()
EMPLOYEE_SERVICE_URL = "http://employee:5002"

def create_app():
    app = Flask(__name__)

    # Always set the TESTING config in the testing environment
    if os.getenv("TESTING"):
        app.config["SQLALCHEMY_DATABASE_URI"] = 'sqlite:///:memory:'
        
    else:
        load_dotenv()
        if not app.config.get('SQLALCHEMY_DATABASE_URI'):
            app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app)

    # Define your routes here or import from another module
    @app.route("/schedule")
    def get_all():
        schedule = db.session.scalars(db.select(Schedule)).all()
        if schedule:
            return jsonify({
                "code": 200,
                "data": {"schedule": [s.json() for s in schedule]},
            })
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
        
    @app.route("/schedule/dept/<string:dept>")
    def get_dept_schedules(dept):
        try:
            employee_response = requests.get(f"{EMPLOYEE_SERVICE_URL}/employee/{dept}/get_by_dept")
            
            if employee_response.status_code == 200:
                team_members = employee_response.json().get("data").get("employee", [])
                
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
            
        
    @app.route("/schedule/all")
    def get_all_schedules():
        try:
            employee_response = requests.get(f"{EMPLOYEE_SERVICE_URL}/employee")
            
            if employee_response.status_code == 200:
                team_members = employee_response.json().get("data").get("employee_list", [])
                
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
            
            if not request_id:
                return jsonify({"code": 400, "message": "Missing required field: request_id."}), 400

            # Check if the work request exists
            work_request = db.session.query(WorkRequest).filter_by(request_id=request_id).first()
            if not work_request:
                return jsonify({"code": 404, "message": "Work request not found."}), 404

            # Check if the schedule already exists
            try:
                Schedule.check_existing_schedule(request_id)
            except ValueError as e:
                return jsonify({"code": 400, "message": str(e)}), 400

            # Create the schedule from the work request
            try:
                new_schedule = Schedule.create_from_work_request(work_request)
            except ValueError as e:
                return jsonify({"code": 400, "message": str(e)}), 400

            return jsonify({
                "code": 201,
                "message": "Schedule created successfully.",
                "data": new_schedule.json()
            }), 201

        except Exception as e:
            db.session.rollback()
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500
        
    @app.route("/schedule/<int:request_id>/update_status", methods=["PUT"])
    def update_schedule_status(request_id):
        try:
            data = request.json

            new_status = data.get('status')

            if not new_status:
                return jsonify({"code": 400, "message": "Status is required."}), 400

            if new_status not in ['Approved', 'Rejected', 'Revoked', 'Withdrawn', 'Cancelled']:
                return jsonify({"code": 400, "message": "Invalid status"}), 400

            schedule_query = db.session.query(Schedule).filter_by(request_id=request_id).first()
            if not schedule_query:
                return jsonify({"code": 404, "message": "Schedule not found."}), 404

            schedule_query.status = new_status

            db.session.commit()

            return jsonify({
                "code": 200,
                "message": "Schedule updated successfully.",
                "data": schedule_query.json()
            }), 200

        except Exception as e:
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5004, debug=True)