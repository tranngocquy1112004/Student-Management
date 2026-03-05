# Implementation Plan: Simplified Date-Based Attendance

## Overview

This implementation transforms the attendance system from recurring weekly schedules to specific date-based schedules with automatic session creation and simplified one-click check-in. The plan follows an incremental approach: modify data models, update backend services and APIs, implement frontend UI, add comprehensive testing, and provide a migration script.

## Tasks

- [x] 1. Update data models for date-based scheduling
  - [x] 1.1 Modify Schedule model to use date field instead of dayOfWeek
    - Update `backend/src/models/Schedule.js` to replace `dayOfWeek`, `startDate`, `endDate`, `isExam` with single `date` field
    - Add compound index `{ classId: 1, date: 1, isDeleted: 1 }` for efficient lookups
    - Keep `startTime`, `endTime`, `room`, soft delete fields
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [ ]* 1.2 Write property test for Schedule date-based storage
    - **Property 1: Schedule Date-Based Storage**
    - **Validates: Requirements 1.1**
  
  - [x] 1.3 Modify AttendanceSession model to link to schedules
    - Update `backend/src/models/AttendanceSession.js` to add `scheduleId` reference field
    - Add `startTime` and `endTime` fields (copied from schedule)
    - Remove `shift`, `code`, `codeExpiredAt` fields (QR code removal)
    - Add index `{ scheduleId: 1 }` for schedule-to-session lookup
    - _Requirements: 2.1, 2.2_
  
  - [ ]* 1.4 Write property test for automatic session creation
    - **Property 9: Automatic Session Creation**
    - **Validates: Requirements 2.1**
  
  - [ ]* 1.5 Write property test for session-schedule linkage
    - **Property 10: Session-Schedule Linkage**
    - **Validates: Requirements 2.2**

- [x] 2. Implement schedule service layer with validation
  - [x] 2.1 Create scheduleService.js with schedule creation logic
    - Implement `createScheduleWithSession()` using database transactions
    - Auto-create AttendanceSession when schedule is created
    - Copy `date`, `startTime`, `endTime` from schedule to session
    - Ensure atomic operation (both or neither created)
    - _Requirements: 1.6, 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 2.2 Write property test for schedule data completeness
    - **Property 2: Schedule Data Completeness**
    - **Validates: Requirements 1.2, 1.3**
  
  - [ ]* 2.3 Write property test for schedule persistence round-trip
    - **Property 3: Schedule Persistence Round-Trip**
    - **Validates: Requirements 1.6**
  
  - [x] 2.4 Implement schedule input validation
    - Create `validateScheduleInput()` function in scheduleService
    - Validate date format and ensure date is not in past
    - Validate time format (HH:MM) and ensure endTime > startTime
    - Validate class exists and user has permission
    - Return structured validation errors with codes
    - _Requirements: 1.4, 1.5, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
  
  - [ ]* 2.5 Write property tests for validation rules
    - **Property 4: Past Date Rejection**
    - **Property 5: Time Range Validation**
    - **Property 6: Invalid Class Reference Rejection**
    - **Property 7: Teacher Permission Validation**
    - **Property 8: Validation Error Response Format**
    - **Validates: Requirements 1.4, 1.5, 8.3, 8.4, 8.5, 8.6**
  
  - [x] 2.6 Implement session status calculation
    - Create `calculateSessionStatus()` function using server time
    - Return "upcoming" if before start time
    - Return "active" if within time window
    - Return "expired" if after end time
    - Use current server time as authoritative source
    - _Requirements: 4.3, 4.6, 10.1, 10.5_
  
  - [ ]* 2.7 Write property tests for session status calculation
    - **Property 16: Session Status Calculation - Upcoming**
    - **Property 17: Session Status Calculation - Active**
    - **Property 18: Session Status Calculation - Expired**
    - **Property 19: Server Time Authority**
    - **Validates: Requirements 4.3, 4.6, 10.1, 10.5**
  
  - [x] 2.8 Implement schedule retrieval with status enrichment
    - Create `getSchedulesWithStatus()` function
    - Fetch schedules for class with pagination support
    - Calculate and attach status for each schedule
    - Order by date ascending, then startTime ascending
    - _Requirements: 5.1, 5.2, 5.3, 6.1_
  
  - [ ]* 2.9 Write property tests for schedule retrieval
    - **Property 20: Schedule Retrieval Completeness**
    - **Property 21: Schedule Ordering**
    - **Property 22: Schedule Response Data Completeness**
    - **Validates: Requirements 5.1, 5.2, 5.3, 6.1**
  
  - [x] 2.10 Implement schedule deletion with validation
    - Create `deleteSchedule()` function with soft delete
    - Validate schedule date is in future (not past or today)
    - Soft delete both schedule and associated session
    - Use transaction to ensure atomicity
    - _Requirements: 6.5_
  
  - [ ]* 2.11 Write property tests for schedule deletion
    - **Property 26: Future Schedule Deletion**
    - **Property 27: Past Schedule Deletion Prevention**
    - **Validates: Requirements 6.5**

- [x] 3. Checkpoint - Ensure schedule service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement attendance service layer for check-in
  - [x] 4.1 Create attendanceService.js with check-in validation
    - Implement `validateCheckInEligibility()` function
    - Check current time is within session time window
    - Validate student is enrolled in class
    - Check for duplicate check-in records
    - Return structured validation errors
    - _Requirements: 3.2, 3.6, 4.1, 4.2, 4.5_
  
  - [ ]* 4.2 Write property tests for check-in validation
    - **Property 15: Time Window Check-In Validation**
    - **Property 35: Enrollment Validation for Check-In**
    - **Validates: Requirements 3.2, 4.1, 4.2, 4.5**
  
  - [x] 4.3 Implement student check-in logic
    - Create `checkInStudent()` function
    - Create AttendanceRecord with sessionId, studentId, timestamp
    - Set status to 'present' and checkInMethod to 'manual'
    - Use database transaction for atomicity
    - _Requirements: 3.2, 3.3, 9.1, 9.2, 9.5_
  
  - [ ]* 4.4 Write property tests for check-in record creation
    - **Property 12: Check-In Record Creation**
    - **Property 13: Check-In Persistence Round-Trip**
    - **Property 14: Duplicate Check-In Prevention**
    - **Property 34: Check-In Transaction Atomicity**
    - **Validates: Requirements 3.2, 3.3, 3.6, 9.1, 9.2, 9.5**
  
  - [x] 4.5 Implement student attendance status retrieval
    - Create `getStudentAttendanceStatus()` function
    - Check if student has checked in for current session
    - Return session details with check-in status
    - Include calculated session status (upcoming/active/expired)
    - _Requirements: 3.5, 5.4_
  
  - [ ]* 4.6 Write property test for student check-in status
    - **Property 23: Student Check-In Status Inclusion**
    - **Validates: Requirements 5.4**
  
  - [x] 4.7 Implement attendance report generation
    - Create `getAttendanceReport()` function
    - Support filtering by class, student, or date range
    - Return all attendance records with populated student details
    - Maintain historical data access even for expired sessions
    - _Requirements: 6.3, 6.4, 9.3, 9.4_
  
  - [ ]* 4.8 Write property tests for attendance persistence
    - **Property 31: Attendance Record Persistence Over Time**
    - **Property 32: Historical Data Retrieval by Class**
    - **Property 33: Historical Data Retrieval by Student**
    - **Validates: Requirements 9.3, 9.4**

- [x] 5. Checkpoint - Ensure attendance service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement schedule API endpoints
  - [x] 6.1 Update scheduleController.js with createSchedule endpoint
    - Implement POST `/api/classes/:classId/schedules` endpoint
    - Call scheduleService.validateScheduleInput()
    - Call scheduleService.createScheduleWithSession()
    - Return 201 with schedule and session data on success
    - Return 400/403 with error codes on validation failure
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 8.5, 8.6_
  
  - [x] 6.2 Implement getSchedules endpoint with status calculation
    - Implement GET `/api/classes/:classId/schedules` endpoint
    - Support pagination with query parameters (page, limit)
    - Support date range filtering (startDate, endDate)
    - Call scheduleService.getSchedulesWithStatus()
    - Return schedules with calculated status and ordering
    - _Requirements: 5.1, 5.2, 5.3, 6.1_
  
  - [x] 6.3 Implement deleteSchedule endpoint with validation
    - Implement DELETE `/api/schedules/:scheduleId` endpoint
    - Validate user permission (teacher owns class or admin)
    - Call scheduleService.deleteSchedule()
    - Return 200 on success, 400 if schedule is past/today
    - _Requirements: 6.5_
  
  - [ ]* 6.4 Write integration tests for schedule endpoints
    - Test schedule creation with valid and invalid inputs
    - Test schedule retrieval with pagination and filtering
    - Test schedule deletion with permission checks
    - Test error responses and status codes

- [x] 7. Implement attendance API endpoints
  - [x] 7.1 Update attendanceController.js with directCheckIn endpoint
    - Implement POST `/api/classes/:classId/attendance/check-in` endpoint
    - Extract studentId from authenticated user
    - Call attendanceService.validateCheckInEligibility()
    - Call attendanceService.checkInStudent()
    - Return 200 with success message or 400 with error code
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.6, 4.1, 4.2, 4.5_
  
  - [x] 7.2 Implement getStudentAttendanceStatus endpoint
    - Implement GET `/api/classes/:classId/attendance/status` endpoint
    - Extract studentId from authenticated user
    - Call attendanceService.getStudentAttendanceStatus()
    - Return session status and check-in indicator
    - _Requirements: 3.5, 5.4, 10.1_
  
  - [x] 7.3 Implement getSessionRecords endpoint for teachers
    - Implement GET `/api/sessions/:sessionId/records` endpoint
    - Validate user is teacher of class or admin
    - Fetch all AttendanceRecords for session
    - Populate student details (name, email, studentCode)
    - Return records with check-in timestamps
    - _Requirements: 6.2, 6.3, 6.4_
  
  - [x] 7.4 Implement getMyAttendance endpoint for students
    - Implement GET `/api/classes/:classId/attendance/my-attendance` endpoint
    - Extract studentId from authenticated user
    - Call attendanceService.getAttendanceReport() with student filter
    - Support pagination
    - _Requirements: 9.3, 9.4_
  
  - [ ]* 7.5 Write integration tests for attendance endpoints
    - Test check-in with valid and invalid time windows
    - Test duplicate check-in prevention
    - Test enrollment validation
    - Test attendance status retrieval
    - Test session records retrieval with permissions

- [x] 8. Update API routes configuration
  - [x] 8.1 Update scheduleRoutes.js with new endpoints
    - Add POST `/classes/:classId/schedules` route with auth middleware
    - Add GET `/classes/:classId/schedules` route with auth middleware
    - Add DELETE `/schedules/:scheduleId` route with auth middleware
    - Ensure proper role-based access control
    - _Requirements: 1.1, 5.1, 6.1, 6.5_
  
  - [x] 8.2 Update attendanceRoutes.js with new endpoints
    - Add POST `/classes/:classId/attendance/check-in` route with student auth
    - Add GET `/classes/:classId/attendance/status` route with student auth
    - Add GET `/sessions/:sessionId/records` route with teacher auth
    - Add GET `/classes/:classId/attendance/my-attendance` route with student auth
    - _Requirements: 3.1, 3.5, 6.3, 9.4_

- [x] 9. Checkpoint - Ensure backend API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Implement teacher schedule management UI
  - [x] 10.1 Create TeacherScheduleManagement component
    - Create `frontend/src/pages/TeacherScheduleManagement.js`
    - Display list of schedules for class with date, time, room
    - Show calculated status (upcoming/active/expired) for each schedule
    - Show check-in count for each schedule
    - Add "Create Schedule" button to open creation form
    - Add delete button for future schedules only
    - _Requirements: 5.1, 5.2, 5.3, 6.1, 6.2, 6.5_
  
  - [x] 10.2 Create schedule creation form
    - Add form with date picker, start time, end time, room fields
    - Validate date is not in past
    - Validate end time is after start time
    - Call POST `/api/classes/:classId/schedules` on submit
    - Display success message or validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 8.5, 8.6_
  
  - [x] 10.3 Implement session detail view for teachers
    - Create modal or detail page to show attendance records for session
    - Display list of students who checked in with timestamps
    - Show student details (name, email, studentCode)
    - Display check-in count vs total enrolled students
    - _Requirements: 6.3, 6.4_
  
  - [ ]* 10.4 Write unit tests for teacher UI components
    - Test schedule list rendering with different statuses
    - Test form validation logic
    - Test delete functionality with permission checks
    - Test session detail view rendering

- [x] 11. Implement student attendance UI
  - [x] 11.1 Create StudentAttendanceView component
    - Create `frontend/src/pages/StudentAttendanceView.js`
    - Display list of schedules for enrolled classes
    - Show date, time slot, and current status for each schedule
    - Show "Điểm danh" button for active sessions
    - Show "Đã điểm danh" indicator if already checked in
    - Show "Đã quá hạn" for expired sessions
    - _Requirements: 3.1, 3.5, 4.2, 4.4, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 11.2 Implement one-click check-in functionality
    - Add click handler for "Điểm danh" button
    - Call POST `/api/classes/:classId/attendance/check-in`
    - Display success message "Điểm danh thành công"
    - Update UI to show check-in status immediately
    - Handle errors (duplicate, outside time window, not enrolled)
    - _Requirements: 3.2, 3.3, 3.4, 3.6, 4.1, 4.5_
  
  - [x] 11.3 Implement real-time status updates
    - Fetch attendance status on component mount
    - Call GET `/api/classes/:classId/attendance/status`
    - Update button state based on session status
    - Disable button for upcoming/expired sessions
    - Enable button only for active sessions
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [x] 11.4 Create student attendance history view
    - Display list of past attendance records for student
    - Call GET `/api/classes/:classId/attendance/my-attendance`
    - Show date, time, and check-in timestamp for each record
    - Support pagination for long history
    - _Requirements: 9.3, 9.4_
  
  - [ ]* 11.5 Write unit tests for student UI components
    - Test schedule list rendering with different statuses
    - Test check-in button state based on session status
    - Test check-in success and error handling
    - Test attendance history rendering

- [x] 12. Checkpoint - Ensure frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Create data migration script
  - [x] 13.1 Implement migration script for dayOfWeek to date conversion
    - Create `backend/scripts/migrateSchedulesToDateBased.js`
    - Fetch all schedules with `dayOfWeek` field
    - For each old schedule, generate specific dates within date range
    - Create new date-based schedules with auto-session creation
    - Mark old schedules with `isMigrated: true` flag
    - Log all migration operations for audit
    - _Requirements: 7.1, 7.4_
  
  - [x] 13.2 Add referential integrity checks to migration
    - Verify all AttendanceRecords still reference valid sessions
    - Verify all sessions reference valid schedules
    - Ensure no orphaned records after migration
    - _Requirements: 7.2, 7.3_
  
  - [ ]* 13.3 Write property tests for migration
    - **Property 28: Migration Data Transformation**
    - **Property 29: Migration Attendance Record Preservation**
    - **Property 30: Referential Integrity Maintenance**
    - **Validates: Requirements 7.1, 7.2, 7.3**
  
  - [x] 13.4 Create migration rollback script
    - Create `backend/scripts/rollbackScheduleMigration.js`
    - Restore old schedules by removing `isMigrated` flag
    - Delete newly created date-based schedules
    - Ensure data consistency during rollback

- [x] 14. Implement comprehensive property-based tests
  - [ ]* 14.1 Set up fast-check testing framework
    - Install `fast-check` package
    - Configure Jest to run property tests
    - Set minimum 100 iterations per property test
    - Create test utilities for generating test data
  
  - [ ]* 14.2 Write remaining property tests for session data
    - **Property 11: Session Data Completeness**
    - **Property 24: Session Check-In Count**
    - **Property 25: Session Records Retrieval**
    - **Validates: Requirements 2.4, 6.2, 6.3, 6.4**
  
  - [ ]* 14.3 Create property test documentation
    - Document each property test with its design property number
    - Link each test to specific requirements
    - Add examples of generated test cases
    - Document test configuration and iteration counts

- [x] 15. Final integration and testing
  - [x] 15.1 Wire all components together
    - Ensure all API routes are registered in main app
    - Verify authentication middleware is applied correctly
    - Test end-to-end flow: create schedule → auto-create session → student check-in
    - Verify error handling across all layers
    - _Requirements: All requirements_
  
  - [ ]* 15.2 Run full test suite
    - Execute all unit tests
    - Execute all property tests with extended iterations
    - Execute all integration tests
    - Verify test coverage meets 80% line coverage goal
  
  - [x] 15.3 Manual testing and validation
    - Test teacher schedule creation flow in browser
    - Test student check-in flow in browser
    - Test time-based status transitions
    - Test error scenarios (duplicate check-in, expired session)
    - Verify UI displays correct status messages

- [x] 16. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (35 total)
- Unit tests validate specific examples and edge cases
- Migration script preserves existing attendance data during transition
- All database operations use transactions to ensure atomicity
- Server time is authoritative for all time-based validations
