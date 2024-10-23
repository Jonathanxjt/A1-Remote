from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from models import *
from dotenv import load_dotenv
import os
import requests

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

    @app.route("/notification/<int:receiver_id>")
    def get_staff_notifications(receiver_id):
        notifications = db.session.query(Notification).filter_by(receiver_id=receiver_id).all()
        return jsonify(
            {
                "code": 200,
                "data": {"Notifications": [notif.json() for notif in notifications]},
            }
        )

    @app.route("/notification/create_notification", methods=['POST'])
    def create_notification():
        try:
            # Extract data from the request JSON payload
            data = request.json
            sender_id = data.get('sender_id')
            receiver_id = data.get('receiver_id')
            request_id = data.get('request_id')
            request_type = data.get('request_type')
            status = data.get('status')

            if not sender_id or not receiver_id or not request_id or not request_type or not status:
                return jsonify({"code": 400, "message": "Missing required fields"}), 400

            todays_date = datetime.now().strftime('%Y-%m-%d')
            if status == "Pending":
                message = f"WFH Request on {todays_date} ({request_type})"
            elif status == "Approved":
                message = f"WFH Request Approved on {todays_date} ({request_type})"
            elif status == "Rejected":
                message = f"WFH Request Rejected on {todays_date} ({request_type})"
            elif status == "Cancelled":
                message = f"WFH Request Cancelled on {todays_date} ({request_type})"
            elif status == "Withdrawn":
                message = f"WFH Request Withdrawn on {todays_date} ({request_type})"
            elif status == "Revoked":
                message = f"WFH Request Revoked on {todays_date} ({request_type})"
            else:
                return jsonify({"code": 400, "message": "Invalid status provided"}), 400

            new_notification = Notification(
                sender_id=sender_id,
                receiver_id=receiver_id,
                request_id=request_id,
                message=message
            )

            db.session.add(new_notification)
            db.session.commit()

            return jsonify({
                "code": 201,
                "message": "Notification created successfully",
                "data": new_notification.json()
            }), 201

        except Exception as e:
            db.session.rollback()  # Rollback if there's an error
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500
        
    @app.route("/notification/read_notification/<int:notification_id>", methods=['PUT'])
    def read_notification(notification_id):
        try:
            notification_query = db.session.query(Notification).filter_by(notification_id=notification_id).first()
            notification_query.is_read = True
            db.session.commit()
            return jsonify({
                "code": 200,
                "message": "Notification updated successfully.",
                "data": notification_query.json()
            }), 200
        except Exception as e:
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500

    @app.route("/notification/delete_notification/<int:notification_id>", methods=['DELETE'])
    def delete_notification(notification_id):
        try:
            notification_query = db.session.query(Notification).filter_by(notification_id=notification_id).first()
            if not notification_query:
                return jsonify({
                    "code": 404,
                    "message": "Notification not found."
                }), 404

            db.session.delete(notification_query)
            db.session.commit()

            return jsonify({
                "code": 200,
                "message": "Notification deleted successfully."
            }), 200

        except Exception as e:
            db.session.rollback()
            return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500

    return app

if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5008, debug=True)