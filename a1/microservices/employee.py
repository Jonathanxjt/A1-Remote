from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

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
    def get_employee_by_staff_id(staff_id):
        employee = db.session.scalars(db.select(Employee).filter_by(staff_id=staff_id)).first()

        if employee:
            return jsonify(
                {
                    "code": 200,
                    "data": {
                        "employee": employee.json()
                    },
                }
            )
        return jsonify({"code": 404, "message": "There are no employee with this Staff ID."}), 404

    @app.route("/employee/<int:staff_id>/manager")
    def get_reporting_manager(staff_id):
        employeelist = db.session.query(Employee.reporting_manager).filter_by(staff_id=staff_id).first()

        if employeelist:
            return jsonify(
                {
                    "code": 200,
                    "data": {
                        "staff_id": staff_id,
                        "reporting_manager": employeelist.reporting_manager
                    },
                }
            )
        return jsonify({"code": 404, "message": "There are no employee with this Staff ID."}), 404

    @app.route("/employee/<int:staff_id>/role")
    def get_employee_role(staff_id):
        employeelist = db.session.query(Employee.role).filter_by(staff_id=staff_id).first()

        if employeelist:
            return jsonify(
                {
                    "code": 200,
                    "data": {
                        "staff_id": staff_id,
                        "role": employeelist.role
                    },
                }
            )
        return jsonify({"code": 404, "message": "There are no employee with this Staff ID."}), 404

    @app.route("/employee/<int:role>/get_by_role")
    def get_employees_by_role(role):
        employeelist = db.session.scalars(db.select(Employee).filter_by(role=role)).all()

        if employeelist:
            return jsonify(
                {
                    "code": 200,
                    "data": {
                        "employee": [employee.json() for employee in employeelist]
                    },
                }
            )
        return jsonify({"code": 404, "message": "There are no employees with this role."}), 404

    @app.route("/employee/<string:dept>/get_by_dept")
    def get_employees_by_dept(dept):
        employeelist = db.session.scalars(db.select(Employee).filter_by(dept=dept)).all()

        if employeelist:
            return jsonify(
                {
                    "code": 200,
                    "data": {
                        "employee": [employee.json() for employee in employeelist]
                    },
                }
            )
        return jsonify({"code": 404, "message": "There are no employees with this role."}), 404


    @app.route("/employee/<int:reporting_manager>/team")
    def get_team_members(reporting_manager):
        team_members = db.session.query(Employee).filter_by(reporting_manager = reporting_manager).all()
        if team_members:
            return jsonify(
                {
                    "code": 200,
                    "data": {"members": [member.json() for member in team_members]},
                }
            )
        return jsonify({"code": 404, "message": "There are no members in this team."}), 404
    
    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5002, debug=True)
