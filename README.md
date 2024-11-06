
# A1-Remote: Work From Home Management System

## 📖 Overview
A1-Remote is a modern Work From Home (WFH) management system designed to help organizations efficiently oversee their remote workforce. Built with Vite and TypeScript, A1-Remote offers tools for managing schedules, processing WFH requests, tracking productivity, and facilitating communication.

## 🚀 Features


### My Schedule (All Employees)
- **Team Schedule View**: Employees can view their team’s schedule in the **Day View**.
- **Personal Schedule View**: Access to their own schedule, including approved and pending requests, with options to switch between **Month** and **Week Views** for a comprehensive overview of their team members.

![Month View](https://github.com/user-attachments/assets/783f46a7-1b5f-4152-97cc-d5a5de6df530)
*Month View*

![Week View](https://github.com/user-attachments/assets/b2356d41-ace1-4c3e-a3c4-a33fbeac3de4)
*Week View*

![Day View](https://github.com/user-attachments/assets/fc093a2f-8a6a-418e-b427-a76633fb33bd)
*Day View*

### Work-From-Home (WFH) Request Management
- **Apply for WFH**: Users can submit WFH requests for weekdays, with options for **AM**, **PM**, or **Full Day**.
- **Manage WFH Requests**: Users can handle their requests on the **My Requests** page:
  - Cancel “Pending” requests
  - Withdraw “Appending” requests
  - Track the status of each request, including Rejected, Revoked, and Approved statuses
- **Request Filters**: Easily filter requests by status or date on the **My Requests** page.

![WFH Form](https://github.com/user-attachments/assets/5c8dca84-c125-49e0-82d6-3e3085486f94)
*WFH Application Form*

### Direct Managers
- **Approve/Reject Requests**: Managers can approve or reject “Pending” requests and revoke “Approved” requests with explanations when necessary.
- **Bulk Actions**: Simplified bulk approvals, rejections, and revocations for efficient request management.

![Manage Request](https://github.com/user-attachments/assets/f1e30dd7-5967-419a-9d24-0e0c31ee48f9)
*Manager View: Manage Requests*

### Dashboard
- **Company Overview**: Directors can view summary statistics for the company by day or week using **Day View** and **Week View**.
- **Departmental Filters**: Option to filter by department for focused insights and statistics relevant to specific teams.

### Real-Time Notification System
- **Instant Notifications**: Built with WebSockets, ensuring users receive immediate updates as notifications pop up as toasts and in their **Mailbox**.
- **Timely Decision-Making**: Enables managers to respond quickly, with employees always updated in real-time.

![Mailbox](https://github.com/user-attachments/assets/11c17403-eca1-4efa-b539-e5aa08655e40)
*Mailbox view*

### Automated Request Handling
- **Auto-Rejection**: Automatically rejects “Pending” requests that exceed a 1-day threshold, preventing last-minute requests. Urgent WFH needs can be handled outside the system for exceptions.

## 🛠️ Tech Stack

- **Frontend:** [Vite](https://vitejs.dev/), [TypeScript](https://www.typescriptlang.org/), [React](https://reactjs.org/)
- **Database:** [MySQL](https://www.mysql.com/) for reliable data storage
- **Containerization:** [Docker](https://www.docker.com/) for consistent development and deployment
- **Real-time Communication:** [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) for live updates

## 📋 Prerequisites

- npm or yarn package manager
- Docker
- MySQL 8.0 or higher
- Python 3.8+
- Modern web browser

## :computer: CI/CD Pipeline
- **Tool Used:** Github Actions
- **CI:**
Configured to run Unit Tests on Github Actions Runner and for Integration Tests to our database (AWS RS) it will SSH into the EC2 instance to run the tests.
- **CD:**
It will SSH into EC2 instance first to docker-compose down existing microservices, upon success it will run the deploy.sh file to automatically docker-compose --build.
### Location of Action .yml file:
```bash
cd a1-remote/.github/workflows
```

### Deploy.sh (Inside EC2 Instance):
```bash
#!/bin/bash

# Change directory to where your app's repository is located
cd /home/ec2-user/A1-Remote  # Use the correct path

# Pull the latest changes from the 'main' branch
git fetch --all
git reset --hard origin/main  # Resets local changes and ensures you get the latest from remote

# Navigate to the directory where the docker-compose.yml file is located
cd /home/ec2-user/A1-Remote/a1/microservices

# Stop and remove existing containers
docker-compose down

# Check if the docker-compose.yml file has changed since the last deployment
if [ ! -f .docker_compose_hash ] || [ "$(sha256sum docker-compose.yml | awk '{print $1}')" != "$(cat .docker_compose_hash)" ]; then
    echo "Changes detected in docker-compose.yml. Rebuilding containers..."
    # Start containers with the latest changes and build if necessary
    docker-compose up -d --build

    # Update the stored hash for future checks
    sha256sum docker-compose.yml | awk '{print $1}' > .docker_compose_hash
else
    echo "No changes in docker-compose.yml. Starting containers without rebuild..."

    # Start containers without rebuilding
    docker-compose up -d
fi
echo "Deployment successful!"
```

### Note on CI/CD Pipeline Stability
We’ve observed occasional stability issues in our CI/CD pipeline due to limited RAM on our EC2 instance, which operates under AWS’s Free Tier restrictions. (See below where only 60 MB of free memory available after a Docker build.) Before the end of Sprint 3, we experimented with various approaches to improve this stability without exceeding Free Tier limits but are still unable to achieve 100% stability.

If you encounter a timeout while testing our CI/CD script, please let us know so we can reset the EC2 instance. For deployment purposes, everything is configured and ready for Release 1 (tested and deployed for over a week), aside from this rare CI/CD stability issue.

<img width="606" alt="Screenshot 2024-11-05 at 22 33 31" src="https://github.com/user-attachments/assets/27933ffd-5d7b-42a5-8059-1f2f726743e9">


## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/Jonathanxjt/a1-remote.git
cd a1-remote/a1
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Database Setup

#### Initialize the Database and Load Data:
In the a1/src/sqldump/A1-Database.sql file, ensure that the path to your employee CSV file is correctly set and accessible by your MySQL instance:
```bash
LOAD DATA INFILE '<path_to_your_employee_data.csv>'
```

Execute the SQL script in `a1/src/sqldump/A1-Database.sql` to set up the required tables. Make sure the database and tables are created successfully.

#### Start All Services
Use Docker Compose to start the necessary services:
```bash
docker-compose up -d
```

To stop the services:
```bash
docker-compose down
```

View logs:
```bash
docker-compose logs -f
```

### 4. Initialize Mock Data
To populate your database with mock data for demo purposes, run the mock data scripts locally. Before doing so, temporarily modify the `.env` file in the `microservices` directory to connect to your local database instead of the deployed one. Use the reference `.env` file setup detailed below for guidance.

```bash
# Navigate to the microservices directory
cd microservices

# Populate user data
python user_populate.py

# Generate additional mock data
python generate_mock.py
```

### 5. Start the Development Server
Launch the development server locally:

```bash
npm run dev
# or
yarn dev
```

## 🏗️ Build for Production
To build the application for production:

```bash
npm run build
# or
yarn build
```

## 🧪 Testing
Run tests to ensure everything is working as expected :
First Change your directory to the root of A1-Remote
```bash
pytest --cov=. --cov-report=html:htmlcov
# To get Coverage in HTML
open htmlcov/index.html
```

Test Files can be found on:
```bash
# Unit Tests
cd a1/tests/unit

# Integration Tests
cd a1/tests/integration
```

## 🔑 Environment Variables

### Frontend `.env` in `/a1`
Create a `.env` file in the `a1` directory with the following variables:

```env
VITE_API_BASE_URL=http://localhost
VITE_USER_SERVICE_URL=http://localhost:5001
VITE_EMPLOYEE_SERVICE_URL=http://localhost:5002
VITE_WORK_REQUEST_URL=http://localhost:5003
VITE_SCHEDULE_SERVICE_URL=http://localhost:5004
VITE_SCHEDULER_SERVICE_URL=http://localhost:5005
VITE_NOTIFICATION_URL=http://localhost:5008
```

### Microservices `.env` in `/microservices`
Create another `.env` file in `/microservices` with your database configuration:

When using Docker, adjust the `DATABASE_URL` to connect to the database container. Instead of `localhost`, use `host.docker.internal` as the host:

```env
DATABASE_URL=mysql+mysqlconnector://<username>:<password>@<host>:<port>/<database_name>
```

Replace the placeholders with your database details:
- `<username>`: MySQL username
- `<password>`: MySQL password
- `<host>`: Database host (use `host.docker.internal` if connecting from within Docker)
- `<port>`: Database port (default: 3306)
- `<database_name>`: Name of your database

Example for local setup (Windows):
```env
DATABASE_URL=mysql+mysqlconnector://root@localhost:3306/a1_database
```

Example for local setup (MacOS):
```env
DATABASE_URL=mysql+mysqlconnector://root:root@localhost:3306/a1_database
```

Example for Docker (Windows):
```env
DATABASE_URL=mysql+mysqlconnector://root@host.docker.internal:3306/a1_database
```

Example for Docker (MacOS):
```env
DATABASE_URL=mysql+mysqlconnector://root:root@host.docker.internal:3306/a1_database
```
## 👥 Authors
- **Jonathan Tan** - [GitHub](https://github.com/Jonathanxjt)
- **Darren Foo** - [GitHub](https://github.com/Rexisk)
- **Mirf Omar** - [GitHub](https://github.com/economicdonut)
- **Matthew James** - [GitHub](https://github.com/matthewaeria)


## 🙏 Acknowledgments
- Special thanks to [Shadcn/ui](https://github.com/shadcn/ui) for providing UI inspiration.
- [Jira](https://www.atlassian.com/software/jira) and [Confluence](https://www.atlassian.com/software/confluence) for supporting our Scrum processes and requirements management.

---

Made with ❤️ by IS212 G5T8:
- Jonathan
- Darren
- Mirf
- Yee Wei
- Matthew
