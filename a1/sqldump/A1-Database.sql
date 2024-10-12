-- ! Drop the database if it already exists
DROP DATABASE IF EXISTS a1_database;


CREATE DATABASE a1_database;
USE a1_database;

CREATE TABLE Role (
    Role INT PRIMARY KEY AUTO_INCREMENT,
    Role_Name VARCHAR(50) NOT NULL UNIQUE,
    Role_Description TEXT
);


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
    FOREIGN KEY (Reporting_Manager) REFERENCES Employee(Staff_ID),
    FOREIGN KEY (Role) REFERENCES Role(Role)
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

INSERT INTO Role (Role, Role_Name, Role_Description)
VALUES (1, 'HR', NULL), 
       (2, 'Staff', NULL), 
       (3, 'Manager', NULL);
ALTER TABLE Employee MODIFY Reporting_Manager INT NULL;

SET FOREIGN_KEY_CHECKS = 0;

# Change this path to the csv file path
# C:/wamp64/tmp/employeenew.csv
LOAD DATA INFILE 'a1/src/assets/employeenew.csv'
INTO TABLE Employee
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n' 
(Staff_ID, Staff_FName, Staff_LName, Dept, Position, Country, Email, @Reporting_Manager, Role)
SET Reporting_Manager = IF(@Reporting_Manager = '', NULL, @Reporting_Manager);

SET FOREIGN_KEY_CHECKS = 1;

UPDATE Employee SET Reporting_Manager = Staff_ID WHERE Staff_ID = 130002;

INSERT INTO User (Staff_ID, Email, Password)
VALUES (130002, 'jack.sim@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO User (Staff_ID, Email, Password)
VALUES (140002, 'Susan.Goh@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO User (Staff_ID, Email, Password)
VALUES (140894, 'Rahim.Khalid@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO User (Staff_ID, Email, Password)
VALUES (150318, 'Emma.Tan@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO User (Staff_ID, Email, Password)
VALUES (151408, 'Philip.Lee@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO Work_Request (Request_ID, Staff_ID, Request_Type, Request_Date, Reason, Status, Approval_Manager_ID, Decision_Date, Comments, Created_Date)
VALUES 
(1, 150318, 'Full Day', '2024-10-15', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(2, 150318, 'AM', '2024-10-16', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(3, 150318, 'PM', '2024-10-17', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(4, 150318, 'Full Day', '2024-10-18', '-', 'Approved', 151408, '2024-10-11', '', '2024-10-05'),
(5, 150318, 'Full Day', '2024-10-19', '-', 'Rejected', 151408, '2024-10-11', 'You need to work more in office.', '2024-10-05');

INSERT INTO Schedule (Schedule_ID, Staff_ID, Date, Request_ID, Approved_By, Request_Type, Status)
VALUES 
(1, 150318, '2024-10-15', 1, 151408, 'Full Day', 'Pending'),
(2, 150318, '2024-10-16', 2, 151408, 'AM', 'Pending'),
(3, 150318, '2024-10-17', 3, 151408, 'PM', 'Pending'),
(4, 150318, '2024-10-18', 4, 151408, 'Full Day', 'Approved'),
(5, 150318, '2024-10-19', 5, 151408, 'Full Day', 'Rejected');





