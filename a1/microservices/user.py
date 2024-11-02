from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import ForeignKey
from sqlalchemy.orm import relationship
from os import environ
from flask_cors import CORS
from models import *
import bcrypt
from dotenv import load_dotenv
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app, resources={
    r"/*": {
        "origins": ["https://main.d2sz63eovkcpdp.amplifyapp.com"],
        "methods": ["OPTIONS", "GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

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

    @app.route("/authenticate", methods=["POST"])
    def authenticate_user():
        data = request.json
        email = data.get("email", "")
        password = data.get("password", "").encode('utf-8')

        # Find the user by email
        user = db.session.query(User).filter_by(email=email).first()

        if user:
            # Assuming user.password is the hashed password
            if bcrypt.checkpw(password, user.password.encode('utf-8')):
                return jsonify({
                    "code": 200,
                    "message": "Authentication successful",
                    "data": {
                        "user": user.json()
                    }
                })
            else:
                return jsonify({
                    "code": 401,
                    "message": "Invalid password"
                }), 401
        return jsonify({
            "code": 404,
            "message": "User not found"
        }), 404
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5001, debug=True)
