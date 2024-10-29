from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from sqlalchemy import text
from models import *
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit, join_room
import os

def create_app():
    app = Flask(__name__)
    load_dotenv()
    app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)
    CORS(app)

    # Initialize SocketIO with proper CORS settings
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=True,
        engineio_logger=True
    )
    return app, socketio

app, socketio = create_app()


# Socket.IO event handlers
@socketio.on('connect')
def handle_connect():
    print('Client connected')

@socketio.on('join')
def on_join(data):
    staff_id = data.get('staff_id')
    if staff_id:
        room = f"staff_{staff_id}"
        join_room(room)
        print(f"Client joined room: {room}")

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

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
        required_fields = ['sender_id', 'receiver_id', 'request_id', 'request_type', 'status']
        
        # Check for missing required fields
        if any(field not in data or not data[field] for field in required_fields):
            return jsonify({"code": 400, "message": "Missing required fields"}), 400

        # Extract individual fields
        sender_id = data['sender_id']
        receiver_id = data['receiver_id']
        request_id = data['request_id']
        request_type = data['request_type']
        status = data['status']
        request_date = data['request_date']
        
        # Check if "exceed" field is provided in the request payload
        exceed = data.get('exceed', False)  # Default to False if not provided

    
        try:
            parsed_request_date = datetime.strptime(request_date, '%Y-%m-%d').strftime('%d/%m/%Y')
        except ValueError:
            return jsonify({"code": 400, "message": "Invalid date format for request_date"}), 400

        # Status-to-message mapping for the original notification
        status_messages = {
            "Pending": "Submitted a WFH Request ({request_type}) for {parsed_request_date} ",
            "Approved": "WFH Request ({request_type}) for {parsed_request_date} Approved ",
            "Rejected": "WFH Request ({request_type}) for {parsed_request_date} Rejected ",
            "Cancelled": "WFH Request ({request_type}) for {parsed_request_date} Cancelled ",
            "Withdrawn": "WFH Request ({request_type}) for {parsed_request_date} Withdrawn ",
            "Revoked": "WFH Request ({request_type}) for {parsed_request_date} Revoked "
        }


        # Validate status
        if status not in status_messages:
            return jsonify({"code": 400, "message": "Invalid status provided"}), 400

         # Format the message with request_type and parsed_request_date
        message = status_messages[status].format(request_type=request_type, parsed_request_date=parsed_request_date)


        # Create the original notification
        # Fetch sender's name
        sender = db.session.query(Employee).filter_by(staff_id=sender_id).first()
        sender_name = f"{sender.staff_fname} {sender.staff_lname}" if sender else "N/A"

        # Include sender's name in the message
        message_with_sender = f"{sender_name}: {message}"

        new_notification = Notification(
            sender_id=sender_id,
            receiver_id=receiver_id,
            request_id=request_id,
            message=message_with_sender
        )
        db.session.add(new_notification)

        

        if exceed:
            special_message = f"{sender_name} has exceeded 2 WFH requests for this week."
            special_notification = Notification(
                sender_id=sender_id,
                receiver_id=receiver_id,
                request_id=request_id,
                message=special_message
            )
            db.session.add(special_notification)


        add = False
        # Handle special case for 'Pending', 'Cancelled', and 'Withdrawn'
        if status in ["Pending", "Cancelled", "Withdrawn"]:
            additional_message_template = {
                "Pending": "Your WFH Request ({request_type}) for {parsed_request_date} has been submitted",
                "Cancelled": "Your WFH Request ({request_type}) for {parsed_request_date} has been cancelled",
                "Withdrawn": "Your WFH Request ({request_type}) for {parsed_request_date} has been withdrawn"
            }

            additional_message = additional_message_template[status].format(
                request_type=request_type, parsed_request_date=parsed_request_date
            )

            additional_notification = Notification(
                sender_id=sender_id,  
                receiver_id=sender_id,  
                request_id=request_id,
                message=additional_message
            )
            db.session.add(additional_notification)
            add = True

        db.session.commit()

        # Emit to specific room instead of broadcast
        room = f"staff_{receiver_id}"
        socketio.emit('new_notification', new_notification.json(), room=room)
        if exceed:
            socketio.emit('new_notification', special_notification.json(), room=room)
           
        if add:
            sender_room = f"staff_{sender_id}"
            socketio.emit('new_notification', additional_notification.json(), room=sender_room)

        # Prepare the response data
        response_data = [new_notification.json()]
        if add:
            response_data.append(additional_notification.json())
        if exceed:
            response_data.append(special_notification.json())

        return jsonify({
            "code": 201,
            "message": "Notification(s) created successfully",
            "data": response_data
        }), 201

    except Exception as e:
        db.session.rollback()  # Rollback the transaction if any error occurs
        return jsonify({"code": 500, "message": f"An error occurred: {str(e)}"}), 500

@app.route("/notification/read_notification/<int:notification_id>", methods=['PUT'])
def read_notification(notification_id):
    try:
        # Fetch the notification by its ID
        notification_query = db.session.query(Notification).filter_by(notification_id=notification_id).first()
        
        if notification_query:
            # Toggle the is_read flag
            notification_query.is_read = not notification_query.is_read
            
            db.session.commit()

            # Return success response with updated notification
            return jsonify({
                "code": 200,
                "message": "Notification updated successfully.",
                "data": notification_query.json()
            }), 200
        else:
            return jsonify({
                "code": 404,
                "message": "Notification not found."
            }), 404

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




if __name__ == '__main__':
    socketio.run(
        app,
        host="0.0.0.0",
        port=5008,
        debug=True,
        use_reloader=False,
        allow_unsafe_werkzeug=True
    )