-- ! Drop the database if it already exists
DROP DATABASE IF EXISTS a1_database;


CREATE DATABASE a1_database;
USE a1_database;

CREATE TABLE Employee (
    Staff_ID INT PRIMARY KEY AUTO_INCREMENT,
    Staff_FName VARCHAR(50) NOT NULL,
    Staff_LName VARCHAR(50) NOT NULL,
    Dept VARCHAR(50) NOT NULL,
    Position VARCHAR(50) NOT NULL,
    Country VARCHAR(50) NOT NULL,
    Email VARCHAR(50) NOT NULL UNIQUE,
    Reporting_Manager INT,
    Role INT NOT NULL,
    FOREIGN KEY (Reporting_Manager) REFERENCES Employee(Staff_ID)
);

CREATE TABLE User (
    Staff_ID INT PRIMARY KEY AUTO_INCREMENT,
    Email VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    FOREIGN KEY (Staff_ID) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Email) REFERENCES Employee(Email)
);


CREATE TABLE Work_Request (
    Request_ID INT PRIMARY KEY AUTO_INCREMENT,
    Staff_ID INT NOT NULL,
    Request_Type VARCHAR(20) NOT NULL,
    Request_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Reason TEXT,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    Approval_Manager_ID INT,
    Decision_Date DATETIME,
    Comments TEXT,
    Created_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Staff_ID) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Approval_Manager_ID) REFERENCES Employee(Staff_ID)
);

CREATE TABLE Schedule (
    Schedule_ID INT PRIMARY KEY AUTO_INCREMENT,
    Staff_ID INT NOT NULL,
    Date DATE NOT NULL,
    Request_ID INT,
    Approved_By INT,
    Request_Type VARCHAR(20) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (Staff_ID) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Request_ID) REFERENCES Work_Request(Request_ID),
    FOREIGN KEY (Approved_By) REFERENCES Employee(Staff_ID)
);

CREATE TABLE Audit (
    Log_ID INT PRIMARY KEY AUTO_INCREMENT,
    Request_ID INT NOT NULL,
    Manager_ID INT NOT NULL,
    Action_Taken VARCHAR(20) NOT NULL,
    Timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Comments TEXT,
    FOREIGN KEY (Request_ID) REFERENCES Work_Request(Request_ID),
    FOREIGN KEY (Manager_ID) REFERENCES Employee(Staff_ID)
);


CREATE TABLE Notification (
    Notification_ID INT PRIMARY KEY AUTO_INCREMENT,
    Sender_ID INT NOT NULL,  
    Receiver_ID INT NOT NULL,
    Request_ID INT NOT NULL,  
    Message TEXT NOT NULL,  
    Notification_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    Is_Read BOOLEAN NOT NULL DEFAULT FALSE, 
    FOREIGN KEY (Sender_ID) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Receiver_ID) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Request_ID) REFERENCES Work_Request(Request_ID)
);


SET FOREIGN_KEY_CHECKS = 0;

# Change this path to the csv file path
# C:/wamp64/tmp/employeenew.csv
LOAD DATA INFILE '/Users/darren/Desktop/SQL Stuff/employeenew.csv'
INTO TABLE Employee
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n' 
(Staff_ID, Staff_FName, Staff_LName, Dept, Position, Country, Email, @Reporting_Manager, Role)
SET Reporting_Manager = IF(@Reporting_Manager = '', NULL, @Reporting_Manager);

SET FOREIGN_KEY_CHECKS = 1;

UPDATE Employee SET Reporting_Manager = Staff_ID WHERE Staff_ID = 130002;

