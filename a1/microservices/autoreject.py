from sqlalchemy import create_engine, func, text
from sqlalchemy.orm import sessionmaker
from models import WorkRequest
from dotenv import load_dotenv
import os
import requests
import logging
from datetime import datetime, timedelta, date
import pytz

LOCAL_TIMEZONE = pytz.timezone("Asia/Singapore")


class TZFormatter(logging.Formatter):
    def __init__(self, fmt=None, datefmt=None, tz=None):
        super().__init__(fmt, datefmt)
        self.tz = tz

    def converter(self, timestamp):
        # Convert the timestamp to the specified timezone
        dt = datetime.fromtimestamp(timestamp, self.tz)
        return dt
    
# Set up logging with timezone-aware formatter
logging.basicConfig(
    level=logging.INFO,
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/var/log/auto_reject.log')
    ]
)

logger = logging.getLogger(__name__)

# Override the default formatter with timezone-aware formatter
for handler in logger.handlers:
    handler.setFormatter(TZFormatter('%Y-%m-%d %H:%M:%S %Z - %(levelname)s - %(message)s', tz=LOCAL_TIMEZONE))

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
SCHEDULER_SERVICE_URL = "http://scheduler:5005/scheduler"

# Set up SQLAlchemy
engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

def get_rejection_reason(request_date, current_date, tomorrow_date):
    """Determine the specific reason for rejection based on the date"""
    if isinstance(request_date, datetime):
        request_date = request_date.date()
    if isinstance(current_date, datetime):
        current_date = current_date.date()
    if isinstance(tomorrow_date, datetime):
        tomorrow_date = tomorrow_date.date()
        
    if request_date < current_date:
        return "Automatically rejected as request date has already passed."
    else:
        return "Automatically rejected due to proximity to request date."

def time_until_next_cron():
    """Calculate the time until the next cron job scheduled at midnight Singapore Time and format it."""
    now = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
    next_run = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    # Localize next_run to ensure it's timezone-aware
    next_run = LOCAL_TIMEZONE.localize(next_run.replace(tzinfo=None))
    time_left = next_run - now

    # Break down the timedelta into hours, minutes, and seconds
    total_seconds = int(time_left.total_seconds())
    hours, remainder = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    return hours, minutes, seconds, next_run

def autoreject_expired_requests():
    session = Session()
    try:
        # Log the start of execution with timestamp
        start_time = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
        logger.info(f"Starting auto-reject process at {start_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")

        # Get formatted time until next scheduled cron job
        hours, minutes, seconds, next_run = time_until_next_cron()
        time_formatted = f"{hours} hours, {minutes} minutes, {seconds} seconds"
        next_run_formatted = next_run.strftime('%Y-%m-%d %H:%M:%S %Z')

        # Log the formatted time until next cron job and its exact datetime
        logger.info(f"Time until next scheduled cron job: {time_formatted}")
        logger.info(f"Next scheduled cron job at: {next_run_formatted}")

        # Get current date and tomorrow's date from database to ensure timezone consistency
        current_date_query = session.query(text("DATE(CURRENT_DATE)")).scalar()
        tomorrow_date_query = session.query(text("DATE(DATE_ADD(CURRENT_DATE, INTERVAL 1 DAY))")).scalar()

        logger.info(f"Current date: {current_date_query}")
        logger.info(f"Tomorrow's date: {tomorrow_date_query}")

        # Query for requests with a request_date less than or equal to tomorrow's date
        work_requests_to_reject = session.query(WorkRequest).filter(
            func.date(WorkRequest.request_date) <= tomorrow_date_query,
            WorkRequest.status == "Pending"
        ).all()

        logger.info(f"Found {len(work_requests_to_reject)} requests to process")

        if not work_requests_to_reject:
            logger.info("No work requests to auto-reject.")
            return

        reject_count = 0
        for request in work_requests_to_reject:
            try:
                logger.info(f"Processing request ID: {request.request_id} with date: {request.request_date}")

                # Determine rejection reason based on the date
                rejection_reason = get_rejection_reason(
                    request.request_date,
                    current_date_query,
                    tomorrow_date_query
                )

                # Call the scheduler service to update both work request and schedule
                update_data = {
                    "status": "Rejected",
                    "comments": rejection_reason
                }

                logger.info(f"Sending update request to scheduler service for request ID: {request.request_id}")
                response = requests.put(
                    f"{SCHEDULER_SERVICE_URL}/{request.request_id}/update_work_request_and_schedule",
                    json=update_data
                )

                if response.status_code == 200:
                    reject_count += 1
                    logger.info(f"Successfully auto-rejected request ID: {request.request_id}")
                    logger.info(f"Scheduler service response: {response.text}")
                else:
                    logger.error(f"Failed to auto-reject request ID: {request.request_id}. Status code: {response.status_code}")
                    logger.error(f"Response: {response.text}")

            except requests.exceptions.RequestException as e:
                logger.error(f"Network error while rejecting request ID {request.request_id}: {str(e)}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing request ID {request.request_id}: {str(e)}")
                continue

        logger.info(f"Auto-rejected {reject_count} out of {len(work_requests_to_reject)} work request(s).")

    except Exception as e:
        logger.error(f"An error occurred: {str(e)}")
        session.rollback()

    finally:
        session.close()
        # Log the completion time with timezone
        completion_time = datetime.now(pytz.utc).astimezone(LOCAL_TIMEZONE)
        logger.info(f"Completed auto-reject process at {completion_time.strftime('%Y-%m-%d %H:%M:%S %Z')}")

if __name__ == "__main__":
    logger.info("=== Auto-reject script execution started ===")
    autoreject_expired_requests()
    logger.info("=== Auto-reject script execution completed ===")
