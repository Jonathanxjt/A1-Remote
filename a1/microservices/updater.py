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

# To get both employee and manager schedule
@app.route("/updater", methods=["POST"])
def get_manager_schedule():
    staff_id = request.get_json().get("staff_id")
    request_type = request.get_json().get("request_type")
    request_date = request.get_json().get("request_date")
    reason = request.get_json().get("reason")
    manager = db.session.scalars(db.select(Employee.reporting_manager).filter_by(staff_id=staff_id)).first()
    
    existing_request = db.session.query(WorkRequest).filter_by(staff_id = staff_id, request_date = request_date).first()

    if existing_request:
        return jsonify(
            {
                "code": 400,
                "message": "You have already submitted a WFH request for that day."
            }
        ), 400
    
    new_request = WorkRequest(staff_id, request_type, request_date, manager, reason)

    try:
        db.session.add(new_request)
        db.session.flush()

        new_request_id = db.session.query(WorkRequest.request_id).filter_by(staff_id = staff_id, request_date = request_date).first()[0]
        schedule = Schedule(staff_id, request_date, manager, request_type, new_request_id)
        db.session.add(schedule)
        db.session.commit()
        return (
            jsonify(
                {
                    "code": 201,
                    "data": {
                        "request": new_request.json()
                        ,"schedule": schedule.json()
                    },
                }
            ),
            201,
        )
    except Exception as e:
        db.session.rollback()
        exc_type, exc_obj, exc_tb = sys.exc_info()
        fname = os.path.split(exc_tb.tb_frame.f_code.co_filename)[1]
        ex_str = (
            str(e)
            + " at "
            + str(exc_type)
            + ": "
            + fname
            + ": line "
            + str(exc_tb.tb_lineno)
        )
        print(ex_str)
        return (
            jsonify(
                {
                    "code": 500,
                    "message": "An error occurred while creating the ticket. " + str(e),
                }
            ),
            500,
        )

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True)