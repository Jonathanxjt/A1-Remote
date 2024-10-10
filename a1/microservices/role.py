from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv


load_dotenv()

import os
import sys

app = Flask(__name__)

# Configure your database URL (e.g., MySQL)
# app.config["SQLALCHEMY_DATABASE_URI"] = environ.get("dbURL") or "mysql+mysqlconnector://root@localhost:3306/a1_database"
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+mysqlconnector://root:root@localhost:3306/a1_database"
# app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)
CORS(app)    
@app.route("/employee")
def get_all():
    employeelist = db.session.scalars(db.select(Employee)).all()
    if len(employeelist):
        return jsonify(
            {
                "code": 200,
                "data": {"employee_list": [user.json() for user in employeelist]},
            }
        )
    return jsonify({"code": 404, "message": "There are no employees."}), 404

@app.route("/employee/<int:staff_id>")
def get_attendee_by_EID(staff_id):
    employeelist = db.session.scalars(db.select(Employee).filter_by(staff_id=staff_id)).first()

    if len(employeelist):
        return jsonify(
            {
                "code": 200,
                "data": {
                    "employee": [employee.json() for employee in employeelist]
                },
            }
        )
    return jsonify({"code": 404, "message": "There are no employee with this Staff ID."}), 404