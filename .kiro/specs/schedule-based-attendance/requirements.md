# Requirements Document

## Introduction

Hệ thống điểm danh tự động theo lịch học cho phép giáo viên và sinh viên thực hiện điểm danh dựa trên lịch học đã được tạo trước. Hệ thống đảm bảo điểm danh chỉ được thực hiện trong khung giờ và ngày đã định, lưu trữ dữ liệu điểm danh vào database, và cung cấp thống kê chuyên cần cho giáo viên.

## Glossary

- **Attendance_System**: Hệ thống điểm danh tự động
- **Schedule**: Lịch học được tạo bởi giáo viên, bao gồm ngày trong tuần, thời gian bắt đầu và kết thúc
- **Teacher**: Giáo viên, người tạo lịch học và xem thống kê điểm danh
- **Student**: Sinh viên, người thực hiện điểm danh
- **Attendance_Record**: Bản ghi điểm danh trong database
- **Class**: Lớp học
- **Dashboard**: Giao diện hiển thị thống kê và biểu đồ
- **Attendance_Window**: Khung thời gian cho phép điểm danh (từ startTime đến endTime của Schedule)
- **Attendance_Rate**: Tỷ lệ chuyên cần được tính từ dữ liệu điểm danh

## Requirements

### Requirement 1: Schedule Validation for Attendance

**User Story:** As a student or teacher, I want the system to validate schedule existence before allowing attendance, so that attendance is only taken on scheduled class days.

#### Acceptance Criteria

1. WHEN a user attempts to take attendance, THE Attendance_System SHALL verify that a Schedule exists for the current day of week
2. IF no Schedule exists for the current day, THEN THE Attendance_System SHALL display the message "Hôm nay không có lịch học"
3. WHEN a Schedule exists for the current day, THE Attendance_System SHALL verify that the current time is within the Attendance_Window
4. IF the current time is outside the Attendance_Window, THEN THE Attendance_System SHALL prevent attendance and display an appropriate error message

### Requirement 2: Time-Based Attendance Validation

**User Story:** As a system administrator, I want attendance to be restricted to scheduled time windows, so that students cannot mark attendance outside of class hours.

#### Acceptance Criteria

1. THE Attendance_System SHALL compare the current time against the Schedule startTime and endTime
2. WHEN the current time is before startTime, THE Attendance_System SHALL reject the attendance request
3. WHEN the current time is after endTime, THE Attendance_System SHALL reject the attendance request
4. WHEN the current time is between startTime and endTime (inclusive), THE Attendance_System SHALL allow the attendance request to proceed

### Requirement 3: Attendance Record Persistence

**User Story:** As a teacher, I want all attendance data to be saved in the database, so that I can track student attendance over time.

#### Acceptance Criteria

1. WHEN a Student successfully marks attendance, THE Attendance_System SHALL create an Attendance_Record in the database
2. THE Attendance_Record SHALL include studentId, classId, scheduleId, date, time, and status fields
3. THE Attendance_System SHALL ensure each Student can only create one Attendance_Record per Schedule per day
4. WHEN an Attendance_Record is created, THE Attendance_System SHALL set the status to "present"
5. THE Attendance_System SHALL store the exact timestamp when attendance was marked

### Requirement 4: Teacher Attendance Statistics View

**User Story:** As a teacher, I want to view attendance statistics for my classes, so that I can monitor student participation.

#### Acceptance Criteria

1. THE Attendance_System SHALL display a statistics table for the Teacher role
2. THE statistics table SHALL include columns: Class name, Total students, Students attended
3. THE "Total students" column SHALL display the total number of students enrolled in each Class
4. THE "Students attended" column SHALL display the count of students who marked attendance for the current day's Schedule
5. THE Attendance_System SHALL calculate these statistics from Attendance_Record data in the database

### Requirement 5: Student Attendance Interface

**User Story:** As a student, I want to see attendance options only for scheduled class days, so that I know when I need to mark attendance.

#### Acceptance Criteria

1. THE Attendance_System SHALL display the attendance interface to Students only on days with a Schedule
2. WHEN a Student marks attendance within the Attendance_Window, THE Attendance_System SHALL save the Attendance_Record to the database
3. WHEN a Student attempts to mark attendance outside the Attendance_Window, THE Attendance_System SHALL prevent the action and display an error message
4. THE Attendance_System SHALL display confirmation to the Student after successfully marking attendance

### Requirement 6: Attendance Rate Calculation

**User Story:** As a teacher, I want the system to automatically calculate attendance rates, so that I can evaluate student participation without manual calculation.

#### Acceptance Criteria

1. THE Attendance_System SHALL calculate Attendance_Rate for each Class based on Attendance_Record data
2. THE Attendance_Rate SHALL be computed as (number of attended sessions / total scheduled sessions) × 100
3. THE Attendance_System SHALL update Attendance_Rate calculations when new Attendance_Record entries are created
4. THE Attendance_System SHALL provide an API endpoint to retrieve Attendance_Rate for a specific Class

### Requirement 7: Teacher Dashboard Visualization

**User Story:** As a teacher, I want to see attendance rate charts in my dashboard, so that I can quickly understand attendance trends across my classes.

#### Acceptance Criteria

1. THE Dashboard SHALL display a chart showing Attendance_Rate for each Class
2. THE chart SHALL retrieve data from Attendance_Record entries in the database
3. THE Dashboard SHALL update the chart when new attendance data is available
4. THE chart SHALL clearly identify each Class and its corresponding Attendance_Rate

### Requirement 8: Attendance API Endpoints

**User Story:** As a developer, I want API endpoints for attendance operations, so that the frontend can interact with attendance data.

#### Acceptance Criteria

1. THE Attendance_System SHALL provide an API endpoint to mark attendance
2. THE Attendance_System SHALL provide an API endpoint to retrieve attendance statistics for a Class
3. THE Attendance_System SHALL provide an API endpoint to retrieve Attendance_Rate data for dashboard charts
4. THE Attendance_System SHALL provide an API endpoint to retrieve attendance history for a Student
5. ALL API endpoints SHALL validate user authentication and authorization before processing requests

### Requirement 9: Database Schema for Attendance

**User Story:** As a system architect, I want a well-defined database schema for attendance, so that data is stored consistently and can be queried efficiently.

#### Acceptance Criteria

1. THE Attendance_System SHALL store Attendance_Record with fields: id, studentId, classId, scheduleId, date, time, status
2. THE studentId field SHALL reference the Student table
3. THE classId field SHALL reference the Class table
4. THE scheduleId field SHALL reference the Schedule table
5. THE Attendance_System SHALL create a unique constraint on (studentId, scheduleId, date) to prevent duplicate attendance records

### Requirement 10: Schedule Day and Time Matching

**User Story:** As a system administrator, I want the system to match current day and time against schedules accurately, so that attendance validation is reliable.

#### Acceptance Criteria

1. THE Attendance_System SHALL retrieve the current day of week from the system clock
2. THE Attendance_System SHALL compare the current day of week against the Schedule dayOfWeek field
3. THE Attendance_System SHALL retrieve the current time from the system clock
4. THE Attendance_System SHALL compare the current time against the Schedule startTime and endTime fields
5. THE Attendance_System SHALL use the server timezone for all time comparisons to ensure consistency
