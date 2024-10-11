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


# Work Request Creation
@app.route("/work_request/submit_work_request", methods=["POST"])
def create_work_request():
    try:
        data = request.json

        staff_id = data.get("staff_id")
        request_type = data.get("request_type")
        request_date_str = data.get("request_date")  # date string in "YYYY-MM-DD" format
        reason = data.get("reason", "")  # required
        comments = data.get("comments", "")  # Optional

        request_date = datetime.strptime(request_date_str, "%Y-%m-%d") if request_date_str else None

        WorkRequest.validate_required_fields(staff_id, request_type, request_date, reason)
        WorkRequest.validate_weekday(request_date)
        WorkRequest.validate_advance_request(request_date)
        WorkRequest.check_duplicate_request(staff_id, request_date)

        manager = db.session.scalars(db.select(Employee.reporting_manager).filter_by(staff_id=staff_id)).first()
        if not manager:
            return jsonify({"code": 404, "message": "Manager not found for the given staff member."}), 404

        new_work_request = WorkRequest(
            staff_id=staff_id,
            request_type=request_type,
            request_date=request_date,
            approval_manager_id=manager,
            reason=reason,
            comments=comments
        )

        db.session.add(new_work_request)
        db.session.commit()

        return jsonify({
            "code": 201,
            "message": "Work request created successfully.",
            "data": new_work_request.json()
        }), 201

    except ValueError as ve:
        return jsonify({"code": 400, "message": str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500
    
@app.route("/work_request/<int:request_id>/update_status", methods=["PUT"])
def update_work_request_status(request_id):
    try:
        data = request.json

        new_status = data.get('status')
        comments = data.get('comments')

        if not new_status:
            return jsonify({"code": 400, "message": "Status is required."}), 400

        if new_status not in ['Approved', 'Rejected']:
            return jsonify({"code": 400, "message": "Invalid status. Status must be either 'Approved' or 'Rejected'."}), 400

        work_request = db.session.query(WorkRequest).filter_by(request_id=request_id).first()
        if not work_request:
            return jsonify({"code": 404, "message": "WorkRequest not found."}), 404

        if new_status == 'Rejected' and not comments:
            return jsonify({"code": 400, "message": "Comments are required when rejecting a request."}), 400

        work_request.status = new_status
        work_request.comments = comments if comments else work_request.comments
        work_request.decision_date = datetime.now()

        db.session.commit()

        return jsonify({
            "code": 200,
            "message": "WorkRequest updated successfully.",
            "data": work_request.json()
        }), 200

    except Exception as e:
        return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)