-- Drop the database if it already exists
DROP DATABASE IF EXISTS a1_database;

CREATE DATABASE a1_database;
USE a1_database;

CREATE TABLE employee (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_fname VARCHAR(50) NOT NULL,
    staff_lname VARCHAR(50) NOT NULL,
    dept VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    country VARCHAR(50) NOT NULL,
    email VARCHAR(50) NOT NULL UNIQUE,
    reporting_manager INT,
    role INT NOT NULL,
    FOREIGN KEY (reporting_manager) REFERENCES employee(staff_id)
);

CREATE TABLE user (
    staff_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    FOREIGN KEY (staff_id) REFERENCES employee(staff_id),
    FOREIGN KEY (email) REFERENCES employee(email)
);

CREATE TABLE work_request (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    request_type VARCHAR(20) NOT NULL,
    request_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    approval_manager_id INT,
    decision_date DATETIME,
    comments TEXT,
    created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES employee(staff_id),
    FOREIGN KEY (approval_manager_id) REFERENCES employee(staff_id)
);

CREATE TABLE schedule (
    schedule_id INT PRIMARY KEY AUTO_INCREMENT,
    staff_id INT NOT NULL,
    date DATE NOT NULL,
    request_id INT,
    approved_by INT,
    request_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    FOREIGN KEY (staff_id) REFERENCES employee(staff_id),
    FOREIGN KEY (request_id) REFERENCES work_request(request_id),
    FOREIGN KEY (approved_by) REFERENCES employee(staff_id)
);

CREATE TABLE audit (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    manager_id INT NOT NULL,
    action_taken VARCHAR(20) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comments TEXT,
    FOREIGN KEY (request_id) REFERENCES work_request(request_id),
    FOREIGN KEY (manager_id) REFERENCES employee(staff_id)
);

CREATE TABLE notification (
    notification_id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,  
    receiver_id INT NOT NULL,
    request_id INT NOT NULL,  
    message TEXT NOT NULL,  
    notification_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, 
    is_read BOOLEAN NOT NULL DEFAULT FALSE, 
    FOREIGN KEY (sender_id) REFERENCES employee(staff_id),
    FOREIGN KEY (receiver_id) REFERENCES employee(staff_id),
    FOREIGN KEY (request_id) REFERENCES work_request(request_id)
);

SET FOREIGN_KEY_CHECKS = 0;

# Load data into employee table from CSV
LOAD DATA LOCAL INFILE '/Users/darren/Desktop/SQL Stuff/employeenew.csv'
INTO TABLE employee
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n' 
(staff_id, staff_fname, staff_lname, dept, position, country, email, @reporting_manager, role)
SET reporting_manager = IF(@reporting_manager = '', NULL, @reporting_manager);

SET FOREIGN_KEY_CHECKS = 1;

UPDATE employee SET reporting_manager = staff_id WHERE staff_id = 130002;

INSERT INTO user (staff_id, email, password)
VALUES (130002, 'jack.sim@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO user (staff_id, email, password)
VALUES (140002, 'Susan.Goh@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO user (staff_id, email, password)
VALUES (140894, 'Rahim.Khalid@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO user (staff_id, email, password)
VALUES (150318, 'Emma.Tan@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO user (staff_id, email, password)
VALUES (151408, 'Philip.Lee@allinone.com.sg', '$2b$12$mYEOIaiPiVCgGAgN2wmrPO0iiTlOwhhnhMmCg6Qr9XBlXndNeMrWy');

INSERT INTO work_request (request_id, staff_id, request_type, request_date, reason, status, approval_manager_id, decision_date, comments, created_date)
VALUES 
(1, 150318, 'Full Day', '2024-10-15', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(2, 150318, 'AM', '2024-10-16', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(3, 150318, 'PM', '2024-10-17', '-', 'Pending', 151408, NULL, '', '2024-10-05'),
(4, 150318, 'Full Day', '2024-10-18', '-', 'Approved', 151408, '2024-10-11', '', '2024-10-05'),
(5, 150318, 'Full Day', '2024-10-19', '-', 'Rejected', 151408, '2024-10-11', 'You need to work more in office.', '2024-10-05');

INSERT INTO schedule (schedule_id, staff_id, date, request_id, approved_by, request_type, status)
VALUES 
(1, 150318, '2024-10-15', 1, 151408, 'Full Day', 'Pending'),
(2, 150318, '2024-10-16', 2, 151408, 'AM', 'Pending'),
(3, 150318, '2024-10-17', 3, 151408, 'PM', 'Pending'),
(4, 150318, '2024-10-18', 4, 151408, 'Full Day', 'Approved'),
(5, 150318, '2024-10-19', 5, 151408, 'Full Day', 'Rejected');

INSERT INTO notification (sender_id, receiver_id, request_id, message, notification_date, is_read)
VALUES 
(151408, 150318, 1, 'Your WFH request for 2024-10-15 is pending.', '2024-10-05 10:00:00', FALSE),
(151408, 150318, 2, 'Your WFH request for 2024-10-16 is pending.', '2024-10-05 10:15:00', FALSE),
(151408, 150318, 3, 'Your WFH request for 2024-10-17 is pending.', '2024-10-05 10:30:00', FALSE),
(151408, 150318, 4, 'Your WFH request for 2024-10-18 has been approved.', '2024-10-11 09:00:00', TRUE),
(151408, 150318, 5, 'Your WFH request for 2024-10-19 has been rejected. You need to work more in the office.', '2024-10-11 09:15:00', TRUE);

INSERT INTO notification (sender_id, receiver_id, request_id, message, notification_date, is_read)
VALUES 
(150318, 151408, 1, 'I have submitted a WFH request for 2024-10-15.', '2024-10-05 08:45:00', TRUE),
(150318, 151408, 2, 'I have submitted a WFH request for 2024-10-16.', '2024-10-05 08:50:00', TRUE),
(150318, 151408, 3, 'I have submitted a WFH request for 2024-10-17.', '2024-10-05 08:55:00', TRUE),
(150318, 151408, 4, 'I have submitted a WFH request for 2024-10-18.', '2024-10-05 09:00:00', TRUE),
(150318, 151408, 5, 'I have submitted a WFH request for 2024-10-19.', '2024-10-05 09:05:00', TRUE);
