# Requirements Document - Student Expulsion Management

## Introduction

Hệ thống Quản lý Đuổi học (Student Expulsion Management) cho phép Admin chấm dứt tư cách học tập vĩnh viễn của sinh viên khi vi phạm quy định hoặc không đạt yêu cầu học tập. Khác với bảo lưu (tạm thời), đuổi học là quyết định vĩnh viễn và chỉ Admin mới có quyền thực hiện. Hệ thống cũng cung cấp cơ chế cảnh báo tự động và xử lý khiếu nại.

## Glossary

- **Expulsion_System**: Hệ thống quản lý đuổi học
- **Admin**: Người dùng có vai trò quản trị viên (role = "admin")
- **Teacher**: Người dùng có vai trò giáo viên (role = "teacher")
- **Student**: Người dùng có vai trò sinh viên (role = "student")
- **Expelled_Student**: Sinh viên có status = "dismissed"
- **Active_Student**: Sinh viên có status = "active"
- **Expulsion_Record**: Bản ghi quyết định đuổi học
- **Academic_Warning**: Cảnh báo học tập do điểm trung bình thấp
- **Attendance_Warning**: Cảnh báo vắng học quá nhiều
- **Appeal**: Đơn khiếu nại quyết định đuổi học
- **GPA**: Grade Point Average - Điểm trung bình tích lũy
- **Absence_Rate**: Tỷ lệ vắng học = (absentSessions / totalSessions) * 100
- **Session**: Một buổi học trong lịch học
- **Future_Schedule**: Lịch học có ngày bắt đầu sau ngày hiệu lực đuổi học
- **Pending_Assignment**: Bài tập chưa nộp có deadline sau ngày hiệu lực đuổi học
- **Gradebook**: Bảng điểm của sinh viên trong các lớp học

## Requirements

### Requirement 1: Expulsion Record Data Model

**User Story:** Là Admin, tôi muốn lưu trữ đầy đủ thông tin quyết định đuổi học, để có thể tra cứu và xử lý khiếu nại sau này.

#### Acceptance Criteria

1. THE Expulsion_System SHALL store Expulsion_Record with fields: studentId, reason, reasonType, effectiveDate, attachments, notes, status, appealStatus, createdBy, createdAt
2. THE Expulsion_System SHALL validate reasonType is one of: "low_gpa", "discipline_violation", "excessive_absence", "expired_leave"
3. THE Expulsion_System SHALL validate effectiveDate is not in the past
4. THE Expulsion_System SHALL validate status is one of: "pending", "active", "appealed", "revoked"
5. THE Expulsion_System SHALL validate appealStatus is one of: "none", "pending", "approved", "rejected"
6. FOR ALL Expulsion_Record objects, serializing to JSON then deserializing SHALL produce an equivalent object (round-trip property)

### Requirement 2: Academic Warning Data Model

**User Story:** Là hệ thống, tôi muốn lưu trữ cảnh báo học tập, để theo dõi sinh viên có nguy cơ bị đuổi học.

#### Acceptance Criteria

1. THE Expulsion_System SHALL store Academic_Warning with fields: studentId, warningType, warningLevel, gpa, threshold, semester, createdBy, createdAt, notifiedAt
2. THE Expulsion_System SHALL validate warningType is one of: "low_gpa", "probation"
3. THE Expulsion_System SHALL validate warningLevel is one of: 1, 2, 3
4. THE Expulsion_System SHALL validate gpa is between 0.0 and 10.0
5. THE Expulsion_System SHALL validate threshold is between 0.0 and 10.0
6. THE Expulsion_System SHALL ensure gpa is less than threshold

### Requirement 3: Attendance Warning Data Model

**User Story:** Là hệ thống, tôi muốn lưu trữ cảnh báo vắng học, để theo dõi sinh viên vắng học quá nhiều.

#### Acceptance Criteria

1. THE Expulsion_System SHALL store Attendance_Warning with fields: studentId, classId, absenceRate, totalSessions, absentSessions, warningLevel, createdAt, notifiedAt
2. THE Expulsion_System SHALL validate absenceRate is between 0 and 100
3. THE Expulsion_System SHALL validate totalSessions is greater than 0
4. THE Expulsion_System SHALL validate absentSessions is less than or equal to totalSessions
5. THE Expulsion_System SHALL validate warningLevel is one of: "warning", "critical"
6. THE Expulsion_System SHALL ensure absenceRate equals (absentSessions / totalSessions) * 100 (invariant property)

### Requirement 4: Create Expulsion Decision

**User Story:** Là Admin, tôi muốn tạo quyết định đuổi học cho sinh viên, để chấm dứt tư cách học tập của họ.

#### Acceptance Criteria

1. WHEN Admin submits expulsion form with valid data, THE Expulsion_System SHALL create an Expulsion_Record with status "active"
2. WHEN Admin submits expulsion form with valid data, THE Expulsion_System SHALL update Student status to "dismissed"
3. WHEN Admin submits expulsion form without required fields, THE Expulsion_System SHALL return validation error
4. WHEN Admin submits expulsion form for non-existent student, THE Expulsion_System SHALL return error "Student not found"
5. WHERE attachments are provided, THE Expulsion_System SHALL store file references in Expulsion_Record
6. THE Expulsion_System SHALL record createdBy as the Admin's userId

### Requirement 5: Terminate Student Sessions

**User Story:** Là Admin, tôi muốn hệ thống tự động đăng xuất sinh viên bị đuổi, để họ không thể tiếp tục sử dụng hệ thống.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL invalidate all active sessions of the Expelled_Student
2. WHEN Expelled_Student attempts to login, THE Expulsion_System SHALL return error "Account has been dismissed"
3. WHEN Expelled_Student has active session and status changes to "dismissed", THE Expulsion_System SHALL terminate the session within 60 seconds

### Requirement 6: Send Expulsion Notification

**User Story:** Là Admin, tôi muốn hệ thống tự động gửi email thông báo đuổi học, để sinh viên và phụ huynh được biết quyết định.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL send email notification to Student email address
2. THE Expulsion_System SHALL include in email: reason, effectiveDate, appeal instructions
3. IF email sending fails, THEN THE Expulsion_System SHALL log the error and continue processing
4. THE Expulsion_System SHALL record email sent timestamp in Expulsion_Record

### Requirement 7: Cancel Future Schedules

**User Story:** Là Admin, tôi muốn hệ thống tự động hủy lịch học tương lai của sinh viên bị đuổi, để họ không còn xuất hiện trong danh sách lớp.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL identify all Future_Schedule entries for the Expelled_Student
2. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL mark Future_Schedule entries as cancelled
3. THE Expulsion_System SHALL preserve historical attendance records for past sessions
4. THE Expulsion_System SHALL remove Expelled_Student from class rosters for future sessions

### Requirement 8: Lock Pending Assignments

**User Story:** Là Admin, tôi muốn hệ thống tự động khóa bài tập chưa nộp của sinh viên bị đuổi, để họ không thể nộp bài sau khi bị đuổi.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL identify all Pending_Assignment entries for the Expelled_Student
2. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL mark Pending_Assignment entries as locked
3. WHEN Expelled_Student attempts to submit locked assignment, THE Expulsion_System SHALL return error "Submission not allowed"
4. THE Expulsion_System SHALL preserve existing submissions made before effectiveDate

### Requirement 9: Mark Gradebook

**User Story:** Là Admin, tôi muốn hệ thống đánh dấu bảng điểm của sinh viên bị đuổi, để giáo viên biết sinh viên đã bị đuổi học.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created with status "active", THE Expulsion_System SHALL add "DISMISSED" marker to Gradebook entries
2. THE Expulsion_System SHALL preserve all existing grade data
3. WHEN Teacher views Gradebook, THE Expulsion_System SHALL display "DISMISSED" status for Expelled_Student
4. THE Expulsion_System SHALL prevent grade modifications for Expelled_Student after effectiveDate

### Requirement 10: Automatic Academic Warning

**User Story:** Là hệ thống, tôi muốn tự động tạo cảnh báo học tập khi GPA thấp, để kịp thời can thiệp trước khi sinh viên bị đuổi.

#### Acceptance Criteria

1. WHEN Student GPA falls below 4.0, THE Expulsion_System SHALL create Academic_Warning with warningLevel 1
2. WHEN Student GPA remains below 4.0 for 2 consecutive semesters, THE Expulsion_System SHALL create Academic_Warning with warningLevel 2
3. WHEN Student GPA remains below 4.0 for 3 consecutive semesters, THE Expulsion_System SHALL create Academic_Warning with warningLevel 3
4. WHEN Academic_Warning is created, THE Expulsion_System SHALL send notification to Student, Teacher, and Admin
5. THE Expulsion_System SHALL calculate GPA based on all completed courses in the semester

### Requirement 11: Automatic Attendance Warning

**User Story:** Là hệ thống, tôi muốn tự động tạo cảnh báo vắng học khi tỷ lệ vắng cao, để kịp thời nhắc nhở sinh viên.

#### Acceptance Criteria

1. WHEN Student Absence_Rate exceeds 20% in a class, THE Expulsion_System SHALL create Attendance_Warning with warningLevel "warning"
2. WHEN Student Absence_Rate exceeds 30% in a class, THE Expulsion_System SHALL create Attendance_Warning with warningLevel "critical"
3. WHEN Attendance_Warning with warningLevel "warning" is created, THE Expulsion_System SHALL notify Student and Teacher
4. WHEN Attendance_Warning with warningLevel "critical" is created, THE Expulsion_System SHALL notify Student, Teacher, and Admin
5. THE Expulsion_System SHALL calculate Absence_Rate after each attendance record is updated

### Requirement 12: Submit Appeal

**User Story:** Là sinh viên bị đuổi, tôi muốn gửi đơn khiếu nại quyết định đuổi học, để có cơ hội được xem xét lại.

#### Acceptance Criteria

1. WHEN Expelled_Student submits appeal with reason and evidence, THE Expulsion_System SHALL update Expulsion_Record appealStatus to "pending"
2. WHEN Expelled_Student submits appeal, THE Expulsion_System SHALL store appeal reason, evidence attachments, and submission timestamp
3. WHEN Expelled_Student submits appeal, THE Expulsion_System SHALL notify Admin
4. IF Expulsion_Record already has appealStatus "pending", THEN THE Expulsion_System SHALL return error "Appeal already submitted"
5. WHERE evidence attachments are provided, THE Expulsion_System SHALL store file references

### Requirement 13: Process Appeal - Reject

**User Story:** Là Admin, tôi muốn từ chối đơn khiếu nại, để giữ nguyên quyết định đuổi học.

#### Acceptance Criteria

1. WHEN Admin rejects appeal with justification, THE Expulsion_System SHALL update appealStatus to "rejected"
2. WHEN Admin rejects appeal, THE Expulsion_System SHALL keep Student status as "dismissed"
3. WHEN Admin rejects appeal, THE Expulsion_System SHALL send notification to Student with rejection reason
4. THE Expulsion_System SHALL record rejection timestamp and Admin userId

### Requirement 14: Process Appeal - Approve

**User Story:** Là Admin, tôi muốn chấp nhận đơn khiếu nại và phục hồi sinh viên, để họ có thể tiếp tục học tập.

#### Acceptance Criteria

1. WHEN Admin approves appeal, THE Expulsion_System SHALL update appealStatus to "approved"
2. WHEN Admin approves appeal, THE Expulsion_System SHALL update Expulsion_Record status to "revoked"
3. WHEN Admin approves appeal, THE Expulsion_System SHALL update Student status to "active"
4. WHEN Admin approves appeal, THE Expulsion_System SHALL restore Student access to the system
5. WHEN Admin approves appeal, THE Expulsion_System SHALL send notification to Student
6. THE Expulsion_System SHALL record approval timestamp and Admin userId

### Requirement 15: Restore Student Access

**User Story:** Là Admin, tôi muốn hệ thống tự động khôi phục quyền truy cập khi chấp nhận khiếu nại, để sinh viên có thể đăng nhập lại.

#### Acceptance Criteria

1. WHEN appeal is approved, THE Expulsion_System SHALL allow Student to login
2. WHEN appeal is approved, THE Expulsion_System SHALL unlock previously locked assignments
3. WHEN appeal is approved, THE Expulsion_System SHALL restore Student to class rosters
4. WHEN appeal is approved, THE Expulsion_System SHALL remove "DISMISSED" marker from Gradebook
5. THE Expulsion_System SHALL NOT restore cancelled attendance records for past sessions

### Requirement 16: Admin View Expulsion List

**User Story:** Là Admin, tôi muốn xem danh sách sinh viên bị đuổi học, để quản lý và theo dõi các quyết định.

#### Acceptance Criteria

1. WHEN Admin requests expulsion list, THE Expulsion_System SHALL return all Expulsion_Record entries
2. THE Expulsion_System SHALL support filtering by status, reasonType, and date range
3. THE Expulsion_System SHALL support sorting by effectiveDate, createdAt
4. THE Expulsion_System SHALL include Student information (name, studentId, email) in the response
5. THE Expulsion_System SHALL support pagination with configurable page size

### Requirement 17: Admin View Warning List

**User Story:** Là Admin, tôi muốn xem danh sách cảnh báo học tập và vắng học, để theo dõi sinh viên có nguy cơ.

#### Acceptance Criteria

1. WHEN Admin requests warning list, THE Expulsion_System SHALL return all Academic_Warning and Attendance_Warning entries
2. THE Expulsion_System SHALL support filtering by warningType, warningLevel, and date range
3. THE Expulsion_System SHALL support sorting by createdAt, gpa, absenceRate
4. THE Expulsion_System SHALL include Student information in the response
5. THE Expulsion_System SHALL highlight warnings that may lead to expulsion

### Requirement 18: Teacher Report Violation

**User Story:** Là Teacher, tôi muốn báo cáo vi phạm kỷ luật của sinh viên, để Admin xem xét đuổi học.

#### Acceptance Criteria

1. WHEN Teacher submits violation report with studentId and description, THE Expulsion_System SHALL create a violation record
2. WHEN Teacher submits violation report, THE Expulsion_System SHALL notify Admin
3. WHERE evidence attachments are provided, THE Expulsion_System SHALL store file references
4. THE Expulsion_System SHALL record Teacher userId as reporter
5. THE Expulsion_System SHALL allow Admin to convert violation report to Expulsion_Record

### Requirement 19: Access Control - Expulsion Actions

**User Story:** Là hệ thống, tôi muốn đảm bảo chỉ Admin mới có quyền đuổi học, để tránh lạm dụng quyền hạn.

#### Acceptance Criteria

1. WHEN non-Admin user attempts to create Expulsion_Record, THE Expulsion_System SHALL return error "Unauthorized"
2. WHEN non-Admin user attempts to process appeal, THE Expulsion_System SHALL return error "Unauthorized"
3. WHEN Teacher attempts to view expulsion list, THE Expulsion_System SHALL return error "Unauthorized"
4. THE Expulsion_System SHALL allow Admin to perform all expulsion-related actions
5. THE Expulsion_System SHALL log all expulsion actions with userId and timestamp

### Requirement 20: Access Control - Expelled Student

**User Story:** Là hệ thống, tôi muốn ngăn sinh viên bị đuổi truy cập hệ thống, để đảm bảo quyết định được thực thi.

#### Acceptance Criteria

1. WHEN Expelled_Student attempts to access any protected resource, THE Expulsion_System SHALL return error "Account dismissed"
2. WHEN Expelled_Student attempts to submit assignment, THE Expulsion_System SHALL return error "Submission not allowed"
3. WHEN Expelled_Student attempts to view class materials, THE Expulsion_System SHALL return error "Access denied"
4. THE Expulsion_System SHALL allow Expelled_Student to view expulsion details and submit appeal
5. THE Expulsion_System SHALL allow Expelled_Student to download their academic records

### Requirement 21: Expulsion Statistics

**User Story:** Là Admin, tôi muốn xem thống kê đuổi học, để đánh giá tình hình và xu hướng.

#### Acceptance Criteria

1. WHEN Admin requests expulsion statistics, THE Expulsion_System SHALL return count by reasonType
2. WHEN Admin requests expulsion statistics, THE Expulsion_System SHALL return count by semester
3. WHEN Admin requests expulsion statistics, THE Expulsion_System SHALL return appeal success rate
4. WHEN Admin requests expulsion statistics, THE Expulsion_System SHALL return warning-to-expulsion conversion rate
5. THE Expulsion_System SHALL support date range filtering for statistics

### Requirement 22: Audit Trail

**User Story:** Là Admin, tôi muốn xem lịch sử thay đổi của quyết định đuổi học, để đảm bảo tính minh bạch.

#### Acceptance Criteria

1. WHEN Expulsion_Record is created or modified, THE Expulsion_System SHALL log the action with timestamp and userId
2. WHEN appeal status changes, THE Expulsion_System SHALL log the change with reason
3. WHEN Student status changes, THE Expulsion_System SHALL log the change with reference to Expulsion_Record
4. THE Expulsion_System SHALL preserve all historical data and prevent deletion
5. THE Expulsion_System SHALL allow Admin to view complete audit trail for any Expulsion_Record

### Requirement 23: Data Validation and Error Handling

**User Story:** Là hệ thống, tôi muốn xác thực dữ liệu đầu vào, để đảm bảo tính toàn vẹn của dữ liệu.

#### Acceptance Criteria

1. WHEN invalid data is submitted, THE Expulsion_System SHALL return descriptive error messages
2. IF database operation fails, THEN THE Expulsion_System SHALL rollback all related changes
3. IF email service is unavailable, THEN THE Expulsion_System SHALL queue notification for retry
4. THE Expulsion_System SHALL validate all date fields are in ISO 8601 format
5. THE Expulsion_System SHALL sanitize all text inputs to prevent injection attacks

### Requirement 24: Performance Requirements

**User Story:** Là người dùng, tôi muốn hệ thống phản hồi nhanh, để có trải nghiệm tốt.

#### Acceptance Criteria

1. WHEN Admin creates Expulsion_Record, THE Expulsion_System SHALL complete processing within 5 seconds
2. WHEN Admin requests expulsion list with pagination, THE Expulsion_System SHALL return results within 2 seconds
3. WHEN automatic warning is triggered, THE Expulsion_System SHALL create warning record within 3 seconds
4. THE Expulsion_System SHALL handle concurrent expulsion operations without data corruption
5. THE Expulsion_System SHALL support at least 100 concurrent users

