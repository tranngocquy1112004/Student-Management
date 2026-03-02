# Requirements Document

## Introduction

Tính năng này cho phép giáo viên đặt lại mật khẩu cho sinh viên trong lớp của mình khi sinh viên quên mật khẩu. Hệ thống sẽ hash mật khẩu mới, lưu vào database và gửi email thông báo cho sinh viên.

## Glossary

- **Teacher**: Người dùng có vai trò giáo viên trong hệ thống
- **Student**: Người dùng có vai trò sinh viên trong hệ thống
- **Password_Reset_System**: Hệ thống con xử lý việc đặt lại mật khẩu
- **Email_Service**: Service gửi email thông báo (Nodemailer)
- **User_Database**: MongoDB collection User chứa thông tin người dùng
- **Authentication_System**: Hệ thống xác thực sử dụng JWT tokens
- **Class**: Lớp học mà Teacher quản lý
- **Password_Hash**: Mật khẩu đã được mã hóa bằng bcrypt

## Requirements

### Requirement 1: Authorization for Password Reset

**User Story:** As a system administrator, I want to restrict password reset functionality to authorized users only, so that student account security is maintained.

#### Acceptance Criteria

1. WHEN a Teacher attempts to reset a Student password, THE Authentication_System SHALL verify the Teacher role
2. WHEN an Admin attempts to reset a Student password, THE Authentication_System SHALL verify the Admin role
3. IF a user without Teacher or Admin role attempts to reset a password, THEN THE Password_Reset_System SHALL reject the request with an authorization error
4. THE Password_Reset_System SHALL verify the requesting user has a valid JWT token before processing any reset request

### Requirement 2: Class Membership Verification

**User Story:** As a teacher, I want to reset passwords only for students in my classes, so that I cannot access students outside my responsibility.

#### Acceptance Criteria

1. WHEN a Teacher requests to reset a Student password, THE Password_Reset_System SHALL verify the Student is enrolled in a Class managed by the Teacher
2. IF the Student is not in any Class managed by the requesting Teacher, THEN THE Password_Reset_System SHALL reject the request with a permission error
3. WHERE the requesting user is an Admin, THE Password_Reset_System SHALL allow password reset for any Student without class membership verification

### Requirement 3: Password Validation

**User Story:** As a system administrator, I want to enforce password strength requirements, so that student accounts remain secure.

#### Acceptance Criteria

1. WHEN a new password is provided, THE Password_Reset_System SHALL validate the password has at least 6 characters
2. IF the password has fewer than 6 characters, THEN THE Password_Reset_System SHALL reject the request with a validation error message
3. THE Password_Reset_System SHALL accept passwords containing any combination of letters, numbers, and special characters

### Requirement 4: Password Storage

**User Story:** As a system administrator, I want passwords to be securely stored, so that student credentials cannot be compromised.

#### Acceptance Criteria

1. WHEN a valid new password is provided, THE Password_Reset_System SHALL hash the password using bcrypt
2. THE Password_Reset_System SHALL store the Password_Hash in the User_Database
3. THE Password_Reset_System SHALL never store plaintext passwords in the User_Database
4. WHEN the password update is complete, THE Password_Reset_System SHALL return a success confirmation

### Requirement 5: Email Notification

**User Story:** As a student, I want to receive an email when my password is reset, so that I am aware of the change and can access my account.

#### Acceptance Criteria

1. WHEN a password reset is successfully completed, THE Email_Service SHALL send an email notification to the Student email address
2. THE Email_Service SHALL include the new password in the email content
3. IF the email fails to send, THEN THE Password_Reset_System SHALL log the error but still complete the password reset operation
4. THE Email_Service SHALL use the existing Nodemailer configuration for sending emails

### Requirement 6: User Interface for Password Reset

**User Story:** As a teacher, I want an easy way to reset student passwords from the class detail page, so that I can quickly help students who forgot their passwords.

#### Acceptance Criteria

1. WHEN a Teacher views the Students tab in the Class Detail page, THE User_Interface SHALL display a "Đặt lại MK" button for each Student
2. WHEN the Teacher clicks the "Đặt lại MK" button, THE User_Interface SHALL display a modal dialog
3. THE User_Interface SHALL provide an input field in the modal for entering the new password
4. THE User_Interface SHALL display the password validation requirement (minimum 6 characters) in the modal
5. WHEN the Teacher submits the new password, THE User_Interface SHALL send the reset request to the Password_Reset_System
6. WHEN the reset is successful, THE User_Interface SHALL display a success message and close the modal
7. IF the reset fails, THEN THE User_Interface SHALL display an error message with the failure reason

### Requirement 7: API Endpoint for Password Reset

**User Story:** As a frontend developer, I want a clear API endpoint for password reset, so that I can integrate the functionality into the user interface.

#### Acceptance Criteria

1. THE Password_Reset_System SHALL provide a REST API endpoint for password reset requests
2. THE Password_Reset_System SHALL accept the Student user ID and new password as request parameters
3. WHEN the request is valid and authorized, THE Password_Reset_System SHALL return HTTP 200 with a success message
4. IF authorization fails, THEN THE Password_Reset_System SHALL return HTTP 403 with an error message
5. IF validation fails, THEN THE Password_Reset_System SHALL return HTTP 400 with a validation error message
6. IF the Student is not found, THEN THE Password_Reset_System SHALL return HTTP 404 with an error message

### Requirement 8: Audit Logging

**User Story:** As a system administrator, I want to track password reset actions, so that I can audit security-related activities.

#### Acceptance Criteria

1. WHEN a password reset is initiated, THE Password_Reset_System SHALL log the Teacher ID, Student ID, and timestamp
2. WHEN a password reset is completed, THE Password_Reset_System SHALL log the completion status
3. IF a password reset fails, THEN THE Password_Reset_System SHALL log the failure reason
4. THE Password_Reset_System SHALL include sufficient information in logs for security auditing purposes
