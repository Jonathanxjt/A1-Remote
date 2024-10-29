from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
import requests
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


    db.init_app(app)
    CORS(app)    

    # URLs for the microservices
    WORK_REQUEST_SERVICE_URL = "http://work-request:5003/work_request"
    SCHEDULE_SERVICE_URL = "http://schedule:5004/schedule"
    NOTIFICATION_SERVICE_URL = "http://notification:5008/notification"

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
            exceed = data.get('exceed', False)  # Default to False if not provided

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
                    "message": f"{work_request_response.json().get('message', 'Unknown error')}"
                }), work_request_response.status_code

            # Extract the work request data
            work_request = work_request_response.json()["data"]
            approval_manager_id = work_request["approval_manager_id"]

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

            notification_data = {
                "sender_id": staff_id,  # The employee submitting the request
                "receiver_id": approval_manager_id,  # The manager who will approve the request
                "request_id": new_request_id,
                "request_type": request_type,
                "request_date": request_date,
                "status": "Pending",  # Initial status of the work request
                "exceed": exceed
            }

            notification_response = requests.post(f"{NOTIFICATION_SERVICE_URL}/create_notification", json=notification_data)

            if notification_response.status_code != 201:
                return jsonify({
                    "code": notification_response.status_code,
                    "message": f"Failed to send notification: {notification_response.json().get('message', 'Unknown error')}"
                }), notification_response.status_code

            # Success: Return work request, schedule, and notification details
            return jsonify({
                "code": 201,
                "data": {
                    "work_request": work_request,
                    "schedule": schedule,
                    "notification": notification_response.json()["data"]
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



    @app.route("/scheduler/<int:request_id>/update_work_request_and_schedule", methods=["PUT"])
    def update_work_request_and_schedule(request_id):
        try:
            data = request.json
            new_status = data.get('status')
            comments = data.get('comments')

            # Validate required fields
            if not new_status:
                return jsonify({"code": 400, "message": "Status is required."}), 400

            # Update WorkRequest status
            work_request_url = f"{WORK_REQUEST_SERVICE_URL}/{request_id}/update_status"
            work_request_payload = {
                "status": new_status,
                "comments": comments
            }
            work_request_response = requests.put(work_request_url, json=work_request_payload)
            
            if work_request_response.status_code != 200:
                return jsonify({
                    "code": work_request_response.status_code,
                    "message": "Failed to update WorkRequest",
                    "details": work_request_response.json()
                }), work_request_response.status_code

            # Retrieve necessary fields from the work request response
            work_request = work_request_response.json().get("data", {})
            approval_manager_id = work_request.get("approval_manager_id")
            receiver_id = work_request.get("staff_id")
            request_type = work_request.get("request_type")
            request_date = work_request.get("request_date")

            # Validate and reformat request_date
            try:
                parsed_request_date = datetime.strptime(request_date, "%a, %d %b %Y %H:%M:%S %Z").strftime("%Y-%m-%d")
            except ValueError:
                return jsonify({"code": 400, "message": "Invalid date format for request_date"}), 400

            # Update Schedule status
            schedule_url = f"{SCHEDULE_SERVICE_URL}/{request_id}/update_status"
            schedule_payload = {"status": new_status}
            schedule_response = requests.put(schedule_url, json=schedule_payload)
            
            if schedule_response.status_code != 200:
                # Rollback WorkRequest if schedule update fails
                rollback_url = f"{WORK_REQUEST_SERVICE_URL}/{request_id}/update_status"
                rollback_payload = {"status": "Pending", "comments": ""}
                rollback_response = requests.put(rollback_url, json=rollback_payload)

                if rollback_response.status_code != 200:
                    return jsonify({
                        "code": 500,
                        "message": "Schedule update failed and WorkRequest rollback also failed.",
                        "details": rollback_response.json()
                    }), 500

                return jsonify({
                    "code": schedule_response.status_code,
                    "message": "Schedule update failed, WorkRequest rolled back.",
                    "details": schedule_response.json()
                }), schedule_response.status_code

            # Prepare notification data with formatted request_date
            sender_id = approval_manager_id if new_status in ["Approved", "Rejected", "Revoked"] else receiver_id
            receiver_id = receiver_id if new_status in ["Approved", "Rejected", "Revoked"] else approval_manager_id

            notification_data = {
                "sender_id": sender_id,
                "receiver_id": receiver_id,
                "request_id": request_id,
                "request_type": request_type,
                "request_date": parsed_request_date,  # Correctly formatted date
                "status": new_status
            }

            # Send Notification
            notification_response = requests.post(f"{NOTIFICATION_SERVICE_URL}/create_notification", json=notification_data)
            if notification_response.status_code != 201:
                return jsonify({
                    "code": notification_response.status_code,
                    "message": f"Failed to send notification: {notification_response.json().get('message', 'Unknown error')}"
                }), notification_response.status_code

            # Return success response
            return jsonify({
                "code": 200,
                "message": "WorkRequest, Schedule, and Notification updated successfully.",
                "work_request_response": work_request_response.json(),
                "schedule_response": schedule_response.json(),
                "notification_response": notification_response.json().get("data")
            }), 200

        except requests.exceptions.RequestException as e:
            return jsonify({"code": 500, "message": f"An error occurred while making a request: {str(e)}"}), 500

        except Exception as e:
            return jsonify({"code": 500, "message": f"An internal error occurred: {str(e)}"}),

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5005, debug=True)