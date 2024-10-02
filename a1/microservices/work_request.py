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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=True)