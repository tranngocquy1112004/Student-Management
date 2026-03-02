# Requirements Document - Academic Leave Management (Phase 1 MVP)

## Introduction

Hệ thống Quản lý Bảo lưu (Academic Leave Management) cho phép sinh viên nộp đơn xin bảo lưu học tập và admin xem xét, phê duyệt hoặc từ chối các đơn này. Khi đơn được phê duyệt, trạng thái của sinh viên và các enrollment sẽ được cập nhật tự động, và sinh viên sẽ không thể truy cập các lớp học trong thời gian bảo lưu.

## Glossary

- **Student**: Người dùng với role 'student' trong hệ thống
- **Admin**: Người dùng với role 'admin' trong hệ thống
- **Leave_Request**: Đơn xin bảo lưu được tạo bởi sinh viên
- **User_Status**: Trạng thái của người dùng trong hệ thống (active, on_leave, dismissed, suspended)
- **Enrollment_Status**: Trạng thái của enrollment (active, completed, dropped, on_leave)
- **Leave_Reason**: Lý do xin bảo lưu (voluntary, medical, military, financial, personal)
- **Request_Status**: Trạng thái của đơn xin bảo lưu (pending, approved, rejected)
- **AcademicLeave_Model**: Model lưu trữ thông tin đơn xin bảo lưu
- **Leave_Period**: Khoảng thời gian bảo lưu từ startDate đến endDate
- **Email_Service**: Dịch vụ gửi email thông báo

## Requirements

### Requirement 1: Thêm User Status Field

**User Story:** Là một admin, tôi muốn theo dõi trạng thái của sinh viên, để có thể quản lý các sinh viên đang bảo lưu, bị đình chỉ hoặc bị buộc thôi học.

#### Acceptance Criteria

1. THE User_Model SHALL have a status field with enum values ['active', 'on_leave', 'dismissed', 'suspended']
2. WHEN a new User is created, THE User_Model SHALL set status to 'active' by default
3. THE User_Model SHALL allow status transitions from 'active' to any other status value
4. THE User_Model SHALL allow status transitions from 'on_leave' back to 'active'

### Requirement 2: Thêm Enrollment Status Field

**User Story:** Là một admin, tôi muốn theo dõi trạng thái của từng enrollment, để biết sinh viên nào đang học, đã hoàn thành, đã drop hoặc đang bảo lưu lớp học.

#### Acceptance Criteria

1. THE Enrollment_Model SHALL have a status field with enum values ['active', 'completed', 'dropped', 'on_leave']
2. WHEN a new Enrollment is created, THE Enrollment_Model SHALL set status to 'active' by default
3. THE Enrollment_Model SHALL allow status transitions from 'active' to any other status value
4. THE Enrollment_Model SHALL preserve the existing isCompleted field for backward compatibility

### Requirement 3: Tạo AcademicLeave Model

**User Story:** Là một developer, tôi muốn có model lưu trữ thông tin đơn xin bảo lưu, để quản lý toàn bộ quy trình xin bảo lưu của sinh viên.

#### Acceptance Criteria

1. THE AcademicLeave_Model SHALL store studentId as a reference to User model
2. THE AcademicLeave_Model SHALL store reason with enum values ['voluntary', 'medical', 'military', 'financial', 'personal']
3. THE AcademicLeave_Model SHALL store startDate and endDate as Date fields
4. THE AcademicLeave_Model SHALL store status with enum values ['pending', 'approved', 'rejected']
5. THE AcademicLeave_Model SHALL store reasonText as a String field for detailed explanation
6. THE AcademicLeave_Model SHALL store reviewedBy as a reference to User model with admin role
7. THE AcademicLeave_Model SHALL store reviewedAt as a Date field
8. THE AcademicLeave_Model SHALL store reviewNote as an optional String field
9. WHEN a new Leave_Request is created, THE AcademicLeave_Model SHALL set status to 'pending' by default
10. THE AcademicLeave_Model SHALL include timestamps for createdAt and updatedAt

### Requirement 4: Nộp Đơn Xin Bảo Lưu

**User Story:** Là một sinh viên, tôi muốn nộp đơn xin bảo lưu học tập, để tạm dừng việc học trong một khoảng thời gian xác định.

#### Acceptance Criteria

1. WHEN a Student submits a leave request, THE System SHALL create a new Leave_Request with status 'pending'
2. WHEN a Student submits a leave request, THE System SHALL require reason, reasonText, startDate, and endDate fields
3. WHEN a Student submits a leave request, THE System SHALL validate that startDate is before endDate
4. WHEN a Student submits a leave request, THE System SHALL validate that startDate is not in the past
5. IF a Student already has a pending Leave_Request, THEN THE System SHALL reject the new submission with error message
6. IF a Student has User_Status 'on_leave', THEN THE System SHALL reject the new submission with error message
7. WHEN a leave request is successfully created, THE System SHALL return the Leave_Request details with status code 201

### Requirement 5: Xem Danh Sách Đơn Chờ Duyệt

**User Story:** Là một admin, tôi muốn xem danh sách tất cả đơn xin bảo lưu đang chờ duyệt, để xem xét và phê duyệt các đơn này.

#### Acceptance Criteria

1. WHEN an Admin requests the list of pending leave requests, THE System SHALL return all Leave_Request records with status 'pending'
2. THE System SHALL include Student information (studentCode, name, email) in each Leave_Request response
3. THE System SHALL sort the leave requests by createdAt in ascending order (oldest first)
4. THE System SHALL support pagination with default page size of 20 records
5. IF no pending leave requests exist, THEN THE System SHALL return an empty array with status code 200

### Requirement 6: Phê Duyệt Đơn Xin Bảo Lưu

**User Story:** Là một admin, tôi muốn phê duyệt đơn xin bảo lưu, để cho phép sinh viên tạm dừng học tập trong thời gian đã đăng ký.

#### Acceptance Criteria

1. WHEN an Admin approves a Leave_Request, THE System SHALL update the Leave_Request status to 'approved'
2. WHEN an Admin approves a Leave_Request, THE System SHALL update the Student User_Status to 'on_leave'
3. WHEN an Admin approves a Leave_Request, THE System SHALL update all active Enrollment records of the Student to status 'on_leave'
4. WHEN an Admin approves a Leave_Request, THE System SHALL store the Admin userId in reviewedBy field
5. WHEN an Admin approves a Leave_Request, THE System SHALL store the current timestamp in reviewedAt field
6. WHEN an Admin approves a Leave_Request, THE System SHALL store the optional reviewNote if provided
7. WHEN an Admin approves a Leave_Request, THE System SHALL send an approval notification email to the Student
8. IF the Leave_Request status is not 'pending', THEN THE System SHALL reject the approval with error message
9. WHEN approval is successful, THE System SHALL return the updated Leave_Request with status code 200

### Requirement 7: Từ Chối Đơn Xin Bảo Lưu

**User Story:** Là một admin, tôi muốn từ chối đơn xin bảo lưu, để thông báo cho sinh viên rằng đơn của họ không được chấp nhận.

#### Acceptance Criteria

1. WHEN an Admin rejects a Leave_Request, THE System SHALL update the Leave_Request status to 'rejected'
2. WHEN an Admin rejects a Leave_Request, THE System SHALL store the Admin userId in reviewedBy field
3. WHEN an Admin rejects a Leave_Request, THE System SHALL store the current timestamp in reviewedAt field
4. WHEN an Admin rejects a Leave_Request, THE System SHALL require a reviewNote explaining the rejection reason
5. WHEN an Admin rejects a Leave_Request, THE System SHALL send a rejection notification email to the Student
6. WHEN an Admin rejects a Leave_Request, THE System SHALL NOT modify the Student User_Status
7. WHEN an Admin rejects a Leave_Request, THE System SHALL NOT modify any Enrollment_Status
8. IF the Leave_Request status is not 'pending', THEN THE System SHALL reject the operation with error message
9. WHEN rejection is successful, THE System SHALL return the updated Leave_Request with status code 200

### Requirement 8: Xem Trạng Thái Đơn Của Sinh Viên

**User Story:** Là một sinh viên, tôi muốn xem trạng thái các đơn xin bảo lưu của mình, để biết đơn đã được duyệt, từ chối hay đang chờ xử lý.

#### Acceptance Criteria

1. WHEN a Student requests their leave requests, THE System SHALL return all Leave_Request records belonging to that Student
2. THE System SHALL include reviewedBy Admin information (name, email) for approved or rejected requests
3. THE System SHALL include reviewNote for rejected requests
4. THE System SHALL sort the leave requests by createdAt in descending order (newest first)
5. IF the Student has no leave requests, THEN THE System SHALL return an empty array with status code 200

### Requirement 9: Kiểm Soát Truy Cập Lớp Học

**User Story:** Là một admin, tôi muốn sinh viên đang bảo lưu không thể truy cập các lớp học, để đảm bảo họ không tham gia học tập trong thời gian bảo lưu.

#### Acceptance Criteria

1. WHEN a Student with User_Status 'on_leave' attempts to access class content, THE System SHALL deny access with status code 403
2. WHEN a Student with User_Status 'on_leave' attempts to submit assignments, THE System SHALL deny access with status code 403
3. WHEN a Student with User_Status 'on_leave' attempts to view attendance, THE System SHALL deny access with status code 403
4. THE System SHALL allow Students with User_Status 'on_leave' to login and view their profile
5. THE System SHALL allow Students with User_Status 'on_leave' to view their leave request status
6. WHEN checking class access, THE System SHALL verify both User_Status and Enrollment_Status

### Requirement 10: Email Notification Service

**User Story:** Là một sinh viên, tôi muốn nhận email thông báo khi đơn xin bảo lưu được duyệt hoặc từ chối, để biết kết quả xét duyệt ngay lập tức.

#### Acceptance Criteria

1. WHEN a Leave_Request is approved, THE Email_Service SHALL send an email to the Student email address
2. WHEN a Leave_Request is rejected, THE Email_Service SHALL send an email to the Student email address
3. THE Email_Service SHALL include Leave_Request details (reason, startDate, endDate) in approval emails
4. THE Email_Service SHALL include reviewNote in rejection emails
5. THE Email_Service SHALL include Admin contact information in both approval and rejection emails
6. IF email sending fails, THEN THE System SHALL log the error but SHALL NOT rollback the approval or rejection transaction
7. THE Email_Service SHALL use the existing email service configuration in the system

### Requirement 11: API Authorization

**User Story:** Là một developer, tôi muốn đảm bảo các API endpoints được bảo vệ đúng cách, để chỉ người dùng có quyền mới có thể thực hiện các thao tác tương ứng.

#### Acceptance Criteria

1. THE System SHALL require authentication for all leave management endpoints
2. THE System SHALL allow only Students to access POST /students/leave/request endpoint
3. THE System SHALL allow only Students to access GET /students/leave/my-requests endpoint
4. THE System SHALL allow only Admins to access GET /admin/leave-requests endpoint
5. THE System SHALL allow only Admins to access PUT /admin/leave-requests/:id/approve endpoint
6. THE System SHALL allow only Admins to access PUT /admin/leave-requests/:id/reject endpoint
7. IF an unauthorized user attempts to access protected endpoints, THEN THE System SHALL return status code 403

### Requirement 12: Student Leave Request Form UI

**User Story:** Là một sinh viên, tôi muốn có giao diện form để nộp đơn xin bảo lưu, để dễ dàng điền thông tin và gửi đơn.

#### Acceptance Criteria

1. THE Leave_Request_Form SHALL display a dropdown for selecting Leave_Reason with options ['voluntary', 'medical', 'military', 'financial', 'personal']
2. THE Leave_Request_Form SHALL display a textarea for entering reasonText with minimum 20 characters
3. THE Leave_Request_Form SHALL display a date picker for selecting startDate
4. THE Leave_Request_Form SHALL display a date picker for selecting endDate
5. THE Leave_Request_Form SHALL validate that startDate is before endDate before submission
6. THE Leave_Request_Form SHALL validate that startDate is not in the past before submission
7. THE Leave_Request_Form SHALL display validation error messages below each field
8. WHEN submission is successful, THE Leave_Request_Form SHALL display a success message and clear the form
9. IF submission fails, THEN THE Leave_Request_Form SHALL display the error message from the API

### Requirement 13: Admin Leave Requests List UI

**User Story:** Là một admin, tôi muốn có giao diện hiển thị danh sách đơn xin bảo lưu chờ duyệt, để xem xét và phê duyệt các đơn một cách hiệu quả.

#### Acceptance Criteria

1. THE Leave_Requests_List SHALL display a table with columns: Student Code, Student Name, Reason, Start Date, End Date, Submitted Date, Actions
2. THE Leave_Requests_List SHALL display an Approve button for each pending Leave_Request
3. THE Leave_Requests_List SHALL display a Reject button for each pending Leave_Request
4. WHEN an Admin clicks Approve, THE Leave_Requests_List SHALL show a confirmation dialog with optional note field
5. WHEN an Admin clicks Reject, THE Leave_Requests_List SHALL show a dialog requiring a rejection note
6. THE Leave_Requests_List SHALL display a loading indicator during API calls
7. WHEN approval or rejection is successful, THE Leave_Requests_List SHALL refresh the list automatically
8. THE Leave_Requests_List SHALL display pagination controls when there are more than 20 records
9. IF no pending requests exist, THEN THE Leave_Requests_List SHALL display a message "No pending leave requests"

### Requirement 14: Student Leave Status Display UI

**User Story:** Là một sinh viên, tôi muốn xem trạng thái các đơn xin bảo lưu của mình, để theo dõi tiến trình xét duyệt.

#### Acceptance Criteria

1. THE Leave_Status_Display SHALL show a list of all Leave_Request records for the logged-in Student
2. THE Leave_Status_Display SHALL display status badges with different colors: pending (yellow), approved (green), rejected (red)
3. THE Leave_Status_Display SHALL display Leave_Reason, reasonText, startDate, endDate for each request
4. THE Leave_Status_Display SHALL display reviewedBy Admin name and reviewedAt date for approved or rejected requests
5. THE Leave_Status_Display SHALL display reviewNote for rejected requests
6. THE Leave_Status_Display SHALL sort requests by createdAt in descending order (newest first)
7. IF the Student has no leave requests, THEN THE Leave_Status_Display SHALL display a message "You have no leave requests"
8. THE Leave_Status_Display SHALL include a button to submit a new leave request if no pending request exists

