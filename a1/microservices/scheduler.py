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


# URLs for the microservices
WORK_REQUEST_SERVICE_URL = "http://work-request:5003/work_request"
SCHEDULE_SERVICE_URL = "http://schedule:5004/schedule"

# To Create a new Work Request and Schedule
@app.route("/New_WR", methods=["POST"])
def create_WkRq_Sch():
    # Extract data from the incoming request
    try:
        data = request.json
        staff_id = data.get("staff_id")
        request_type = data.get("request_type")
        request_date = data.get("request_date")
        reason = data.get("reason")

        if not staff_id or not request_type or not request_date or not reason:
            return jsonify({"code": 400, "message": "Missing required fields"}), 400

        # Step 1: Create the work request by calling the work_request microservice
        work_request_data = {
            "staff_id": staff_id,
            "request_type": request_type,
            "request_date": request_date,
            "reason": reason
        }

        # Send POST request to the work_request microservice
        work_request_response = requests.post(f"{WORK_REQUEST_SERVICE_URL}/submit_work_request", json=work_request_data)

        if work_request_response.status_code != 201:
            return jsonify({
                "code": work_request_response.status_code,
                "message": f"Failed to create work request: {work_request_response.json().get('message', 'Unknown error')}"
            }), work_request_response.status_code

        # Extract the work request data
        work_request = work_request_response.json()["data"]

        # Step 2: Create the schedule based on the work request ID returned
        new_request_id = work_request["request_id"]
        schedule_data = {
            "request_id": new_request_id  # Only request_id is required, the rest is fetched in the schedule service
        }

        # Send POST request to the schedule microservice
        schedule_response = requests.post(f"{SCHEDULE_SERVICE_URL}/create_schedule", json=schedule_data)

        if schedule_response.status_code != 201:
            # If the schedule creation fails, rollback the work request by deleting it
            delete_work_request = requests.delete(f"{WORK_REQUEST_SERVICE_URL}/{new_request_id}")

            if delete_work_request.status_code != 200:
                return jsonify({
                    "code": 500,
                    "message": f"Schedule creation failed, and failed to rollback work request: {schedule_response.json().get('message', 'Unknown error')}"
                }), 500

            return jsonify({
                "code": schedule_response.status_code,
                "message": f"Failed to create schedule: {schedule_response.json().get('message', 'Unknown error')}"
            }), schedule_response.status_code

        # Extract the schedule data
        schedule = schedule_response.json()["data"]

        # Success: Return both work request and schedule details
        return jsonify({
            "code": 201,
            "data": {
                "work_request": work_request,
                "schedule": schedule
            },
        }), 201

    except requests.exceptions.RequestException as e:
        # Handle any network errors
        return jsonify({
            "code": 500,
            "message": f"An error occurred while processing the request: {str(e)}"
        }), 500

    except Exception as e:
        return jsonify({
            "code": 500,
            "message": f"An unexpected error occurred: {str(e)}"
        }), 500

# def create_WkRq_Sch():
    # staff_id = request.get_json().get("staff_id")
    # request_type = request.get_json().get("request_type")
    # request_date = request.get_json().get("request_date")
    # reason = request.get_json().get("reason")
    # manager = db.session.scalars(db.select(Employee.reporting_manager).filter_by(staff_id=staff_id)).first()
    
    # existing_request = db.session.query(WorkRequest).filter_by(staff_id = staff_id, request_date = request_date).first()

    # if existing_request:
    #     return jsonify(
    #         {
    #             "code": 400,
    #             "message": "You have already submitted a WFH request for that day."
    #         }
    #     ), 400
    
    # new_request = WorkRequest(staff_id, request_type, request_date, manager, reason)

    # try:
    #     db.session.add(new_request)
    #     db.session.flush()

    #     new_request_id = db.session.query(WorkRequest.request_id).filter_by(staff_id = staff_id, request_date = request_date).first()[0]
    #     schedule = Schedule(staff_id, request_date, manager, request_type, new_request_id)
    #     db.session.add(schedule)
    #     db.session.commit()
    #     return (
    #         jsonify(
    #             {
    #                 "code": 201,
    #                 "data": {
    #                     "request": new_request.json()
    #                     ,"schedule": schedule.json()
    #                 },
    #             }
    #         ),
    #         201,
    #     )
    # except Exception as e:
    #     db.session.rollback()
    #     exc_type, exc_obj, exc_tb = sys.exc_info()
    #     fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
    #     ex_str = (
    #         str(e)
    #         + " at "
    #         + str(exc_type)
    #         + ": "
    #         + fname
    #         + ": line "
    #         + str(exc_tb.tb_lineno)
    #     )
    #     print(ex_str)
    #     return (
    #         jsonify(
    #             {
    #                 "code": 500,
    #                 "message": "An error occurred while creating the ticket. " + str(e),
    #             }
    #         ),
    #         500,
    #     )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)