# Requirements Document

## Introduction

This feature simplifies the attendance system by allowing teachers to create attendance schedules for specific dates and time slots, and enabling students to mark their attendance with a single click on the scheduled date. The system automatically marks expired sessions and eliminates the complexity of QR code generation and recurring weekly schedules.

## Glossary

- **Attendance_System**: The system component responsible for managing attendance schedules and student check-ins
- **Schedule**: A specific date and time slot when attendance can be marked for a class
- **Attendance_Session**: A database record representing an attendance opportunity for a specific schedule
- **Teacher**: A user with permission to create and manage attendance schedules
- **Student**: A user enrolled in a class who can mark attendance
- **Time_Slot**: A specific time range (start time and end time) on a given date
- **Expired_Session**: An attendance session where the scheduled date and time have passed
- **Check_In**: The action of a student marking their attendance for a session
- **Class**: A group of students and a teacher with associated schedules

## Requirements

### Requirement 1: Create Date-Based Schedule

**User Story:** As a teacher, I want to create attendance schedules for specific dates and time slots, so that students can mark attendance on those exact dates without recurring weekly patterns.

#### Acceptance Criteria

1. WHEN a teacher creates a schedule, THE Attendance_System SHALL store the specific date (not day of week)
2. WHEN a teacher creates a schedule, THE Attendance_System SHALL store the time slot with start time and end time
3. WHEN a teacher creates a schedule, THE Attendance_System SHALL associate the schedule with a specific class
4. THE Attendance_System SHALL validate that the schedule date is not in the past
5. THE Attendance_System SHALL validate that the end time is after the start time
6. WHEN a schedule is created, THE Attendance_System SHALL persist it to the database

### Requirement 2: Automatic Attendance Session Creation

**User Story:** As a teacher, I want attendance sessions to be automatically created when I create a schedule, so that I don't need to manually generate QR codes or create sessions separately.

#### Acceptance Criteria

1. WHEN a teacher creates a schedule, THE Attendance_System SHALL automatically create an associated Attendance_Session
2. THE Attendance_System SHALL link the Attendance_Session to the schedule and class
3. THE Attendance_System SHALL set the Attendance_Session status to active
4. THE Attendance_System SHALL store the session creation timestamp

### Requirement 3: One-Click Student Attendance

**User Story:** As a student, I want to mark my attendance with a single click on the scheduled date, so that I can quickly check in without scanning QR codes.

#### Acceptance Criteria

1. WHEN a student views a class on the scheduled date, THE Attendance_System SHALL display a "Điểm danh" button
2. WHEN a student clicks the "Điểm danh" button, THE Attendance_System SHALL record the check-in with timestamp
3. WHEN a student clicks the "Điểm danh" button, THE Attendance_System SHALL associate the check-in with the student and session
4. WHEN a check-in is successful, THE Attendance_System SHALL display a confirmation message to the student
5. WHEN a student has already checked in, THE Attendance_System SHALL display the check-in status instead of the button
6. THE Attendance_System SHALL prevent duplicate check-ins for the same student and session

### Requirement 4: Time-Based Session Validation

**User Story:** As a student, I want to see when attendance sessions are available or expired, so that I know whether I can still mark my attendance.

#### Acceptance Criteria

1. WHEN the current date and time is within the scheduled time slot, THE Attendance_System SHALL allow check-in
2. WHEN the current date and time is before the scheduled time slot, THE Attendance_System SHALL display a message indicating the session is not yet available
3. WHEN the scheduled date and time have passed, THE Attendance_System SHALL mark the session as expired
4. WHEN a session is expired, THE Attendance_System SHALL display "Đã quá hạn" to students
5. WHEN a session is expired, THE Attendance_System SHALL prevent new check-ins
6. THE Attendance_System SHALL evaluate session status in real-time based on current date and time

### Requirement 5: Schedule Retrieval and Display

**User Story:** As a student, I want to view all attendance schedules for my classes, so that I know when I need to mark attendance.

#### Acceptance Criteria

1. WHEN a student views a class, THE Attendance_System SHALL retrieve all schedules for that class
2. THE Attendance_System SHALL display schedules ordered by date and time
3. FOR EACH schedule, THE Attendance_System SHALL display the date, time slot, and current status
4. FOR EACH schedule, THE Attendance_System SHALL display whether the student has checked in
5. THE Attendance_System SHALL distinguish between active, upcoming, and expired sessions visually

### Requirement 6: Teacher Schedule Management

**User Story:** As a teacher, I want to view and manage all schedules I've created, so that I can track attendance opportunities for my classes.

#### Acceptance Criteria

1. WHEN a teacher views a class, THE Attendance_System SHALL display all schedules for that class
2. THE Attendance_System SHALL display the number of students who have checked in for each schedule
3. THE Attendance_System SHALL allow teachers to view the list of students who checked in for a specific schedule
4. THE Attendance_System SHALL display check-in timestamps for each student
5. WHERE a schedule has not yet occurred, THE Attendance_System SHALL allow teachers to delete the schedule

### Requirement 7: Data Migration from Weekly to Date-Based

**User Story:** As a system administrator, I want to migrate existing weekly schedules to date-based schedules, so that the system maintains continuity during the transition.

#### Acceptance Criteria

1. THE Attendance_System SHALL provide a migration path from dayOfWeek-based schedules to date-based schedules
2. WHEN migrating, THE Attendance_System SHALL preserve existing attendance records
3. THE Attendance_System SHALL maintain referential integrity between schedules, sessions, and check-ins
4. THE Attendance_System SHALL log all migration operations for audit purposes

### Requirement 8: Schedule Validation

**User Story:** As a teacher, I want the system to validate my schedule inputs, so that I don't create invalid or conflicting schedules.

#### Acceptance Criteria

1. WHEN a teacher creates a schedule, THE Attendance_System SHALL validate that the date is in valid format
2. WHEN a teacher creates a schedule, THE Attendance_System SHALL validate that the time slot is in valid format
3. WHEN a teacher creates a schedule, THE Attendance_System SHALL validate that the class exists
4. WHEN a teacher creates a schedule, THE Attendance_System SHALL validate that the teacher has permission for that class
5. IF validation fails, THEN THE Attendance_System SHALL return a descriptive error message
6. THE Attendance_System SHALL prevent schedule creation if any validation fails

### Requirement 9: Attendance Record Persistence

**User Story:** As a teacher, I want all attendance records to be permanently stored, so that I can review historical attendance data.

#### Acceptance Criteria

1. WHEN a student checks in, THE Attendance_System SHALL persist the check-in record to the database
2. THE Attendance_System SHALL store the student ID, session ID, and check-in timestamp
3. THE Attendance_System SHALL maintain attendance records even after sessions expire
4. THE Attendance_System SHALL allow retrieval of historical attendance data by class, student, or date range
5. FOR ALL check-in operations, THE Attendance_System SHALL ensure data integrity through database transactions

### Requirement 10: Real-Time Status Updates

**User Story:** As a student, I want to see the current status of attendance sessions in real-time, so that I know exactly when I can check in.

#### Acceptance Criteria

1. WHEN a student views a class page, THE Attendance_System SHALL calculate session status based on current time
2. THE Attendance_System SHALL update session status without requiring page refresh
3. WHEN a session transitions from upcoming to active, THE Attendance_System SHALL enable the check-in button
4. WHEN a session transitions from active to expired, THE Attendance_System SHALL disable the check-in button and display "Đã quá hạn"
5. THE Attendance_System SHALL use the server time as the authoritative time source for status calculations
