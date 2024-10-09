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
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# Initialize the database
db.init_app(app)
CORS(app)    

@app.route("/user")
def get_all():
    userlist = db.session.scalars(db.select(User)).all()
    if len(userlist):
        return jsonify(
            {
                "code": 200,
                "data": {"user_list": [user.json() for user in userlist]},
            }
        )
    return jsonify({"code": 404, "message": "There are no users."}), 404

@app.route("/user/<int:staff_id>")
def get_user_by_staff_id(staff_id):
    userlist = db.session.scalars(db.select(User).filter_by(staff_id=staff_id)).all()

    if len(userlist):
        return jsonify(
            {
                "code": 200,
                "data": {
                    "user": [user.json() for user in userlist]
                },
            }
        )
    return jsonify({"code": 404, "message": "There are no users."}), 404

@app.route("/user_email/<string:email>")
def get_user_by_email(email):
    userlist = db.session.scalars(db.select(User).filter_by(email=email)).all()

    if len(userlist):
        return jsonify(
            {
                "code": 200,
                "data": {
                    "user": [user.json() for user in userlist]
                },
            }
        )
    return jsonify({"code": 404, "message": "There are no users."}), 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
