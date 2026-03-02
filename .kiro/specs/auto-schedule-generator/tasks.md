# Implementation Plan: Auto Schedule Generator

## Overview

Implement the automatic schedule generation feature that allows teachers to create an entire semester's schedule at once. The implementation follows a backend-first approach, building the data layer and API endpoints before the frontend UI components. Testing tasks are integrated as optional sub-tasks to validate correctness properties early.

## Tasks

- [x] 1. Update Class model with schedule tracking fields
  - Add totalLessons field (Number, optional for backward compatibility)
  - Add scheduledLessons field (Number, default 0)
  - Add validation to ensure scheduledLessons <= totalLessons
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 1.1 Write property test for Class model validation
  - **Property 8: Scheduled Lessons Never Exceeds Total Lessons**
  - **Validates: Requirements 6.4**

- [ ]* 1.2 Write property test for new class initialization
  - **Property 9: New Class Initialization**
  - **Validates: Requirements 6.3**

- [x] 2. Update Schedule model with exam indicator
  - Add isExam field (Boolean, default false)
  - _Requirements: 3.7_

- [ ] 3. Implement schedule generation algorithm
  - [x] 3.1 Create scheduleService.js with generateSchedules function
    - Implement date iteration logic based on day group
    - Map session to time ranges (morning: 07:30-11:30, afternoon: 13:30-17:30)
    - Mark last schedule as exam (isExam: true)
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6, 3.7_

  - [ ]* 3.2 Write property test for exact schedule count
    - **Property 2: Schedule Generation Produces Exact Count**
    - **Validates: Requirements 3.4, 4.2**

  - [ ]* 3.3 Write property test for schedule parameter matching
    - **Property 3: Generated Schedules Match Input Parameters**
    - **Validates: Requirements 3.3, 3.5, 3.6**

  - [ ]* 3.4 Write property test for chronological dates
    - **Property 4: Schedule Dates Are Chronological and After Start Date**
    - **Validates: Requirements 3.2**

  - [ ]* 3.5 Write property test for exam marking
    - **Property 5: Last Schedule Is Marked As Exam**
    - **Validates: Requirements 3.7**

- [ ] 4. Implement remaining lessons calculation
  - [x] 4.1 Create calculateRemainingLessons function in scheduleService.js
    - Query class document for totalLessons and scheduledLessons
    - Return difference (totalLessons - scheduledLessons)
    - _Requirements: 1.1, 1.5_

  - [ ]* 4.2 Write property test for remaining lessons calculation
    - **Property 1: Remaining Lessons Calculation**
    - **Validates: Requirements 1.1**

- [ ] 5. Implement validation logic
  - [x] 5.1 Create validateBulkSchedules function in scheduleService.js
    - Validate schedules count does not exceed remaining lessons
    - Validate required fields in schedule data
    - Validate start date is not in the past
    - Validate room name contains valid characters
    - _Requirements: 5.1, 5.2, 5.3, 5.5, 5.6_

  - [ ]* 5.2 Write property test for excessive schedules rejection
    - **Property 10: Validation Rejects Excessive Schedules**
    - **Validates: Requirements 5.3, 7.4**

  - [ ]* 5.3 Write property test for past date rejection
    - **Property 11: Validation Rejects Past Start Dates**
    - **Validates: Requirements 5.1**

  - [ ]* 5.4 Write property test for required field validation
    - **Property 12: Required Field Validation**
    - **Validates: Requirements 5.2, 2.8**

- [ ] 6. Checkpoint - Ensure all backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement bulk insert with transaction
  - [x] 7.1 Create bulkInsertWithTransaction function in scheduleService.js
    - Start MongoDB session and transaction
    - Insert all schedules using insertMany
    - Update class.scheduledLessons using $inc operator
    - Commit transaction on success, rollback on failure
    - _Requirements: 4.1, 4.3, 7.5, 7.6_

  - [ ]* 7.2 Write property test for atomic update
    - **Property 6: Bulk Insert Updates Scheduled Lessons Atomically**
    - **Validates: Requirements 4.3, 7.5**

  - [ ]* 7.3 Write property test for transaction rollback
    - **Property 7: Transaction Rollback On Failure**
    - **Validates: Requirements 7.6**

- [ ] 8. Create API endpoint for remaining lessons
  - [x] 8.1 Add GET /classes/:id/remaining-lessons route in scheduleRoutes.js
    - Create scheduleRoutes.js if it doesn't exist
    - Add authentication middleware
    - _Requirements: 7.1_

  - [x] 8.2 Implement getRemainingLessons controller in scheduleController.js
    - Validate class exists and is not deleted
    - Call calculateRemainingLessons service
    - Return totalLessons, scheduledLessons, remainingLessons
    - Handle errors (404 for class not found, 500 for server errors)
    - _Requirements: 1.1, 1.2, 1.5_

  - [ ]* 8.3 Write unit tests for getRemainingLessons endpoint
    - Test successful response with valid class
    - Test 404 error for non-existent class
    - Test error when totalLessons is not set

- [ ] 9. Create API endpoint for bulk schedule creation
  - [x] 9.1 Add POST /classes/:id/schedules/bulk route in scheduleRoutes.js
    - Add authentication middleware
    - Add authorization check (teacher must own the class)
    - _Requirements: 7.2, 7.3_

  - [x] 9.2 Implement bulkCreateSchedules controller in scheduleController.js
    - Validate class exists and totalLessons is set
    - Call validateBulkSchedules service
    - Call bulkInsertWithTransaction service
    - Return created schedules and updated class
    - Handle validation errors (400), authorization errors (403), server errors (500)
    - _Requirements: 4.1, 4.4, 4.6, 7.4, 7.5, 7.6, 7.7_

  - [ ]* 9.3 Write unit tests for bulkCreateSchedules endpoint
    - Test successful bulk insert
    - Test validation error when exceeding remaining lessons
    - Test authorization check for non-owner teacher
    - Test transaction rollback on database error

  - [ ]* 9.4 Write property test for API response completeness
    - **Property 15: API Response Contains Created Schedules**
    - **Validates: Requirements 7.7**

- [ ] 10. Checkpoint - Ensure all backend API tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Create ScheduleGeneratorModal component
  - [x] 11.1 Create ScheduleGeneratorModal.js component file
    - Set up component structure with props (isOpen, onClose, classData, onSchedulesCreated)
    - Initialize state for form inputs (startDate, dayGroup, session, room)
    - Initialize state for preview (previewSchedules, isPreviewMode)
    - Initialize state for UI (isSubmitting, error)
    - _Requirements: 2.1_

  - [x] 11.2 Implement modal UI with class information display
    - Display class name, subject name
    - Display total lessons, scheduled lessons, remaining lessons
    - _Requirements: 2.2_

  - [x] 11.3 Implement form input fields
    - Add date picker for start date
    - Add radio buttons for day group (2-4-6, 3-5-7)
    - Add radio buttons for session (morning, afternoon)
    - Add text input for room name
    - _Requirements: 2.3, 2.4, 2.5, 2.6_

  - [x] 11.4 Implement form validation logic
    - Validate all required fields are filled
    - Validate start date is not in the past
    - Disable preview/confirm buttons when validation fails
    - _Requirements: 2.8, 5.1, 5.2_

  - [x] 11.5 Implement preview generation logic
    - Create calculateScheduleDates function
    - Call generateSchedules algorithm (client-side version)
    - Update previewSchedules state
    - Switch to preview mode
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 11.6 Write unit tests for ScheduleGeneratorModal
    - Test modal renders with class data
    - Test form input handling
    - Test button disable logic
    - Test preview generation
    - Test error display

  - [ ]* 11.7 Write property test for modal display
    - **Property 17: Modal Display Contains Class Information**
    - **Validates: Requirements 2.2**

- [ ] 12. Create SchedulePreviewList component
  - [ ] 12.1 Create SchedulePreviewList.js component file
    - Set up component with props (schedules, onEdit, onConfirm)
    - Render list of schedules with lesson number, date, day of week, time, room
    - Display exam indicator for last lesson
    - Display summary with regular lesson count and exam lesson count
    - Add Edit and Confirm buttons
    - _Requirements: 3.8, 3.9_

  - [ ]* 12.2 Write unit tests for SchedulePreviewList
    - Test schedule list rendering
    - Test exam indicator display
    - Test summary counts
    - Test button click handlers

  - [ ]* 12.3 Write property test for preview display
    - **Property 16: Preview Display Contains Required Information**
    - **Validates: Requirements 3.8**

  - [ ]* 12.4 Write property test for summary accuracy
    - **Property 18: Summary Counts Are Accurate**
    - **Validates: Requirements 3.9**

- [x] 13. Implement API integration in ScheduleGeneratorModal
  - [x] 13.1 Create API service functions
    - Add getRemainingLessons function in scheduleApi.js
    - Add bulkCreateSchedules function in scheduleApi.js
    - _Requirements: 7.1, 7.2_

  - [x] 13.2 Implement confirm handler
    - Call bulkCreateSchedules API with preview schedules
    - Handle loading state (isSubmitting)
    - Handle success: show success message, call onSchedulesCreated, close modal
    - Handle errors: display error message, keep modal open
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [ ]* 13.3 Write integration tests for API calls
    - Test successful schedule creation flow
    - Test error handling for API failures
    - Test loading state management

- [x] 14. Update ClassDetail component
  - [x] 14.1 Add "Tạo lịch tự động" button to ClassDetail page
    - Position button near schedule section
    - Disable button when scheduledLessons equals totalLessons
    - Show "Đã lên lịch đầy đủ" message when disabled
    - _Requirements: 1.3, 1.4_

  - [x] 14.2 Integrate ScheduleGeneratorModal
    - Add state for modal open/close
    - Pass classData props to modal
    - Implement onSchedulesCreated callback to refresh schedule list
    - _Requirements: 2.1, 4.5_

  - [ ]* 14.3 Write unit tests for ClassDetail integration
    - Test button rendering and disable logic
    - Test modal open/close
    - Test schedule list refresh after creation

- [ ] 15. Checkpoint - Ensure all frontend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 16. Verify student visibility and attendance integration
  - [ ]* 16.1 Write integration test for schedule visibility
    - **Property 13: Auto-Created Schedules Are Immediately Visible**
    - **Validates: Requirements 4.7, 8.1**

  - [ ]* 16.2 Write integration test for attendance functionality
    - **Property 14: Auto-Created Schedules Support Attendance**
    - **Validates: Requirements 8.2, 8.4**

- [ ] 17. Final integration and end-to-end testing
  - [ ]* 17.1 Write end-to-end test for complete flow
    - Test: Open modal → Fill form → Preview → Confirm → Verify database
    - Test: Verify schedules appear in student timetable
    - Test: Verify attendance marking works on auto-created schedules
    - Test: Verify exam indicator displays correctly
    - _Requirements: All requirements_

  - [ ]* 17.2 Test edge cases
    - Test with totalLessons = 0
    - Test with scheduledLessons = totalLessons
    - Test with start date on weekend
    - Test with large remaining lessons count (100)
    - Test with day group 3-5-7 starting on Monday
    - Test concurrent bulk inserts

- [ ] 18. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend tasks (1-10) should be completed before frontend tasks (11-15)
- Property-based tests use fast-check library with minimum 100 iterations
- Integration tests (16-17) verify cross-component functionality
- Checkpoints ensure incremental validation at key milestones
