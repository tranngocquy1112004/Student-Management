# Implementation Plan: Schedule-Based Attendance

## Overview

Implement schedule-based attendance validation system that restricts attendance operations to scheduled class times. The system validates day of week and time windows before allowing attendance, stores records in database, and provides statistics and charts for teachers.

## Tasks

- [x] 1. Implement ScheduleValidator service
  - [x] 1.1 Create ScheduleValidator class with time validation methods
    - Implement `getCurrentSchedule(classId)` to query Schedule by classId and current day
    - Implement `validateDayOfWeek(classId)` to check if today matches schedule
    - Implement `validateTimeWindow(schedule)` to check if current time is within startTime-endTime
    - Implement helper methods: `getCurrentDayOfWeek()`, `getCurrentTime()`, `compareTime(time1, time2)`
    - _Requirements: 1.1, 1.3, 2.1, 2.4, 10.1, 10.2, 10.3, 10.4, 10.5_
  
  - [ ]* 1.2 Write property test for time window validation
    - **Property 2: Time Window Validation**
    - **Validates: Requirements 1.3, 1.4, 2.2, 2.3, 2.4**
    - Generate random time strings and schedules, verify validation only passes when time is within window
  
  - [ ]* 1.3 Write unit tests for ScheduleValidator
    - Test `getCurrentSchedule()` returns correct schedule for current day
    - Test `getCurrentSchedule()` returns null when no schedule exists
    - Test `validateTimeWindow()` for times before, within, and after window
    - Test `compareTime()` correctly compares HH:mm format strings
    - _Requirements: 1.1, 1.3, 2.1, 2.4_

- [x] 2. Enhance AttendanceController with schedule validation
  - [x] 2.1 Add schedule validation to createSession endpoint
    - Import ScheduleValidator service
    - Call `validateDayOfWeek()` before creating session
    - Call `validateTimeWindow()` before creating session
    - Return appropriate error codes: SCHEDULE_NOT_FOUND, ATTENDANCE_TOO_EARLY, ATTENDANCE_TOO_LATE
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.2, 2.3, 2.4_
  
  - [x] 2.2 Add schedule validation to checkIn endpoint
    - Call `getCurrentSchedule()` to get schedule for class
    - Validate time window before allowing check-in
    - Return error messages in Vietnamese as specified in design
    - _Requirements: 1.1, 1.3, 1.4, 5.2, 5.3_
  
  - [ ]* 2.3 Write property test for schedule existence validation
    - **Property 1: Schedule Existence Validation**
    - **Validates: Requirements 1.1**
    - Generate random classIds and dates, verify system checks schedule existence before attendance
  
  - [ ]* 2.4 Write property test for duplicate attendance prevention
    - **Property 5: Duplicate Attendance Prevention**
    - **Validates: Requirements 3.3**
    - Attempt to create multiple records for same sessionId and studentId, verify unique constraint rejection

- [x] 3. Implement AttendanceService for statistics and rate calculation
  - [x] 3.1 Create AttendanceService class with statistics methods
    - Implement `calculateStatistics(classId)` to count total and attended students
    - Query Enrollment collection for total students count
    - Query AttendanceRecord collection for attended students count
    - Return data structure: `{className, totalStudents, studentsAttended}`
    - _Requirements: 4.3, 4.4, 4.5_
  
  - [x] 3.2 Implement attendance rate calculation
    - Implement `calculateAttendanceRate(classId)` using formula: (attended / (sessions × students)) × 100
    - Handle edge cases: zero sessions, zero students
    - Implement `getTeacherClassesAttendanceRate(teacherId)` for dashboard
    - _Requirements: 6.1, 6.2, 6.3_
  
  - [ ]* 3.3 Write property test for total students count accuracy
    - **Property 8: Total Students Count Accuracy**
    - **Validates: Requirements 4.3**
    - Generate random enrollment data, verify statistics match enrollment count
  
  - [ ]* 3.4 Write property test for students attended count accuracy
    - **Property 9: Students Attended Count Accuracy**
    - **Validates: Requirements 4.4**
    - Generate random attendance records, verify count matches distinct studentIds with status "present"
  
  - [ ]* 3.5 Write property test for attendance rate calculation formula
    - **Property 11: Attendance Rate Calculation Formula**
    - **Validates: Requirements 6.1, 6.2**
    - Generate random attendance data, verify rate calculation matches formula
  
  - [ ]* 3.6 Write unit tests for AttendanceService
    - Test `calculateStatistics()` with various enrollment and attendance scenarios
    - Test `calculateAttendanceRate()` handles zero sessions and zero students
    - Test rate calculation updates when new records are added
    - _Requirements: 4.3, 4.4, 6.1, 6.2, 6.3_

- [x] 4. Create new API endpoints for attendance operations
  - [x] 4.1 Add validateSchedule endpoint
    - Create GET `/attendance/validate-schedule/:classId` route
    - Return schedule info and validation status
    - Include dayOfWeek, startTime, endTime, room in response
    - _Requirements: 1.1, 1.3, 8.1_
  
  - [x] 4.2 Add statistics endpoint
    - Create GET `/attendance/statistics/:classId` route
    - Call AttendanceService.calculateStatistics()
    - Return statistics data for teacher dashboard
    - _Requirements: 4.1, 4.2, 8.2_
  
  - [x] 4.3 Add attendance rate endpoint
    - Create GET `/attendance/rate/:classId` route
    - Call AttendanceService.calculateAttendanceRate()
    - Return rate data for dashboard charts
    - _Requirements: 6.4, 7.2, 8.3_
  
  - [ ]* 4.4 Write property test for API authentication requirement
    - **Property 13: API Authentication Requirement**
    - **Validates: Requirements 8.5**
    - Test all endpoints reject requests without valid authentication (401) and without authorization (403)
  
  - [ ]* 4.5 Write integration tests for API endpoints
    - Test full flow: validate schedule → create session → check in
    - Test error responses for invalid schedule, time window violations
    - Test statistics and rate endpoints return correct data
    - _Requirements: 8.1, 8.2, 8.3, 8.5_

- [x] 5. Checkpoint - Ensure backend tests pass
  - Run all backend tests and verify they pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement useAttendanceValidator hook
  - [x] 6.1 Create custom React hook for schedule validation
    - Implement `useAttendanceValidator(classId)` hook
    - Call `/attendance/validate-schedule/:classId` API
    - Return state: `{isValidSchedule, scheduleInfo, errorMessage, loading, validateSchedule}`
    - Handle loading and error states
    - _Requirements: 5.1, 5.3_
  
  - [ ]* 6.2 Write unit tests for useAttendanceValidator hook
    - Test hook calls API and updates state correctly
    - Test loading state transitions
    - Test error handling
    - Mock API responses for various scenarios
    - _Requirements: 5.1, 5.3_

- [x] 7. Implement AttendanceStatistics component
  - [x] 7.1 Create AttendanceStatistics table component
    - Create component with props: `{classId, refreshTrigger}`
    - Call `/attendance/statistics/:classId` API
    - Render table with columns: Class name, Total students, Students attended
    - Implement auto-refresh when refreshTrigger changes
    - Handle loading and error states
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 7.2 Write unit tests for AttendanceStatistics component
    - Test component renders table with correct data
    - Test loading state display
    - Test error message display
    - Test refresh behavior when refreshTrigger changes
    - _Requirements: 4.1, 4.2_

- [x] 8. Implement AttendanceRateChart component
  - [x] 8.1 Create attendance rate chart component
    - Create component with props: `{teacherId}`
    - Call `/attendance/rate/:classId` API for all teacher's classes
    - Render bar chart or pie chart using Chart.js or Recharts
    - Display tooltips with detailed numbers
    - Implement responsive design
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 8.2 Write unit tests for AttendanceRateChart component
    - Test chart renders with correct data
    - Test loading state
    - Test empty data handling
    - Test tooltip display
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 9. Enhance CheckIn component with schedule validation
  - [x] 9.1 Add schedule validation to CheckIn page
    - Import and use `useAttendanceValidator` hook
    - Call `validateSchedule()` before showing check-in form
    - Display "Hôm nay không có lịch học" when no schedule exists
    - Display "Chưa đến giờ học" or "Đã hết giờ học" when outside time window
    - Show schedule info (time, room) when valid
    - _Requirements: 1.2, 1.4, 5.1, 5.3, 5.4_
  
  - [ ]* 9.2 Write property test for schedule-based UI display
    - **Property 10: Schedule-Based UI Display**
    - **Validates: Requirements 5.1**
    - Generate random dates and schedules, verify UI only displays for valid schedule days
  
  - [ ]* 9.3 Write unit tests for enhanced CheckIn component
    - Test component validates schedule before showing form
    - Test error messages display correctly
    - Test schedule info displays when valid
    - Test check-in submission with valid schedule
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 10. Enhance AttendanceQR component with schedule validation
  - [x] 10.1 Add schedule validation to AttendanceQR page
    - Import and use `useAttendanceValidator` hook
    - Validate schedule before allowing QR code generation
    - Display schedule info (day, time, room)
    - Disable "Tạo mã điểm danh" button when outside time window
    - Show countdown timer until class starts or ends
    - _Requirements: 1.1, 1.3, 1.4_
  
  - [ ]* 10.2 Write unit tests for enhanced AttendanceQR component
    - Test schedule validation before code generation
    - Test button disabled state when outside time window
    - Test schedule info display
    - Test countdown timer functionality
    - _Requirements: 1.1, 1.3, 1.4_

- [x] 11. Implement attendance record creation with validation
  - [x] 11.1 Ensure attendance record creation includes all required fields
    - Verify AttendanceRecord includes: studentId, sessionId, status, checkedAt, checkInMethod
    - Set default status to "present" for check-in operations
    - Set checkedAt to current timestamp
    - _Requirements: 3.2, 3.4, 3.5_
  
  - [ ]* 11.2 Write property test for attendance record creation
    - **Property 3: Attendance Record Creation**
    - **Validates: Requirements 3.1**
    - Generate random valid check-ins, verify exactly one record created in database
  
  - [ ]* 11.3 Write property test for attendance record structure
    - **Property 4: Attendance Record Structure**
    - **Validates: Requirements 3.2**
    - Generate random attendance records, verify all required fields present
  
  - [ ]* 11.4 Write property test for default status value
    - **Property 6: Default Status Value**
    - **Validates: Requirements 3.4**
    - Generate random check-ins, verify status always set to "present"
  
  - [ ]* 11.5 Write property test for timestamp accuracy
    - **Property 7: Timestamp Accuracy**
    - **Validates: Requirements 3.5**
    - Generate random check-ins, verify checkedAt within reasonable delta of current time

- [x] 12. Implement referential integrity validation
  - [x] 12.1 Add validation for foreign key references
    - Validate studentId references valid User with role "student"
    - Validate classId references valid Class document
    - Validate sessionId references valid AttendanceSession document
    - Return appropriate errors for invalid references
    - _Requirements: 9.2, 9.3, 9.4_
  
  - [ ]* 12.2 Write property test for referential integrity - student
    - **Property 14: Referential Integrity - Student**
    - **Validates: Requirements 9.2**
    - Attempt to create records with invalid studentId, verify rejection
  
  - [ ]* 12.3 Write property test for referential integrity - class
    - **Property 15: Referential Integrity - Class**
    - **Validates: Requirements 9.3**
    - Attempt to create sessions with invalid classId, verify rejection
  
  - [ ]* 12.4 Write property test for referential integrity - session
    - **Property 16: Referential Integrity - Session**
    - **Validates: Requirements 9.4**
    - Attempt to create records with invalid sessionId, verify rejection

- [x] 13. Implement timezone consistency
  - [x] 13.1 Ensure all time comparisons use server timezone
    - Configure server timezone in environment variables
    - Use server timezone for all time validation operations
    - Document timezone handling in code comments
    - _Requirements: 10.5_
  
  - [ ]* 13.2 Write property test for timezone consistency
    - **Property 17: Timezone Consistency**
    - **Validates: Requirements 10.5**
    - Generate random times, verify all comparisons use consistent timezone

- [x] 14. Integrate components and wire everything together
  - [x] 14.1 Wire backend services to controllers
    - Connect ScheduleValidator to AttendanceController
    - Connect AttendanceService to statistics and rate endpoints
    - Ensure error handling flows through all layers
    - _Requirements: All backend requirements_
  
  - [x] 14.2 Wire frontend components to pages
    - Add AttendanceStatistics component to teacher dashboard
    - Add AttendanceRateChart component to teacher dashboard
    - Integrate useAttendanceValidator hook into CheckIn and AttendanceQR pages
    - Ensure error messages display correctly in UI
    - _Requirements: All frontend requirements_
  
  - [ ]* 14.3 Write end-to-end integration tests
    - Test complete flow: teacher creates session with schedule validation
    - Test complete flow: student checks in with schedule validation
    - Test complete flow: teacher views statistics and charts
    - Test error scenarios: no schedule, outside time window, duplicate attendance
    - _Requirements: All requirements_

- [x] 15. Final checkpoint - Ensure all tests pass
  - Run all backend and frontend tests
  - Verify property-based tests pass with 100+ iterations
  - Check code coverage meets 80% threshold
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties from design document
- Unit tests validate specific examples and edge cases
- Backend uses JavaScript/Node.js with Express and MongoDB
- Frontend uses React with hooks and Chart.js/Recharts for visualization
- All error messages should be in Vietnamese as specified in design
- Timezone handling is critical for accurate time window validation
