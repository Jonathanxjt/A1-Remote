const apiUrl = import.meta.env.VITE_API_BASE_URL;
const USER_URL = import.meta.env.VITE_USER_SERVICE_URL;           // 5001
const EMPLOYEE_URL = import.meta.env.VITE_EMPLOYEE_SERVICE_URL;   // 5002
const WORK_REQUEST_URL = import.meta.env.VITE_WORK_REQUEST_URL;   // 5003
const SCHEDULE_URL = import.meta.env.VITE_SCHEDULE_SERVICE_URL;   // 5004
const SCHEDULER_URL = import.meta.env.VITE_SCHEDULER_SERVICE_URL; // 5005
const NOTIFICATION_URL = import.meta.env.VITE_NOTIFICATION_URL;   // 5008

export default { apiUrl, USER_URL, EMPLOYEE_URL, WORK_REQUEST_URL, SCHEDULE_URL, SCHEDULER_URL, NOTIFICATION_URL };
