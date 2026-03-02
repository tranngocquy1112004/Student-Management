# Implementation Plan: Academic Leave Management (Phase 1 MVP)

## Overview

Implement a complete academic leave management system that allows students to submit leave requests, admins to approve/reject them, and automatically updates user and enrollment statuses. The system includes access control to prevent on-leave students from accessing classes, email notifications, and comprehensive UI components for both students and admins.

## Tasks

- [x] 1. Update database models with status fields
  - [x] 1.1 Add status field to User model
    - Add status enum field ['active', 'on_leave', 'dismissed', 'suspended'] with default 'active'
    - Add index on status field for query performance
    - Add compound index on (role, status) for common queries
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.2 Add status field to Enrollment model
    - Add status enum field ['active', 'completed', 'dropped', 'on_leave'] with default 'active'
    - Add index on (studentId, status) for query performance
    - Preserve existing isCompleted field for backward compatibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 1.3 Create AcademicLeave model
    - Create new model with all required fields (studentId, reason, reasonText, startDate, endDate, status, reviewedBy, reviewedAt, reviewNote)
    - Add enum validation for reason and status fields
    - Add pre-save validation to ensure startDate < endDate
    - Add indexes on (studentId, status) and (status, createdAt)
    - Add timestamps for createdAt and updatedAt
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 2. Implement leave service business logic
  - [x] 2.1 Create leaveService with submitLeaveRequest function
    - Validate startDate is not in the past
    - Validate startDate is before endDate
    - Check user status is not 'on_leave'
    - Check for existing pending leave request
    - Create new AcademicLeave record with status 'pending'
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_
  
  - [x] 2.2 Implement approveLeaveRequest function
    - Validate leave request exists and status is 'pending'
    - Update leave request status to 'approved'
    - Update user status to 'on_leave'
    - Update all active enrollments to status 'on_leave'
    - Store reviewedBy, reviewedAt, and optional reviewNote
    - Call email service to send approval notification (async, non-blocking)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_
  
  - [x] 2.3 Implement rejectLeaveRequest function
    - Validate reviewNote is provided and not empty
    - Validate leave request exists and status is 'pending'
    - Update leave request status to 'rejected'
    - Store reviewedBy, reviewedAt, and reviewNote
    - Do NOT modify user status or enrollment status
    - Call email service to send rejection notification (async, non-blocking)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9_
  
  - [ ]* 2.4 Write unit tests for leaveService
    - Test submitLeaveRequest with valid data
    - Test submitLeaveRequest validation errors (past date, invalid date range, duplicate pending request, user already on leave)
    - Test approveLeaveRequest updates all related records correctly
    - Test rejectLeaveRequest doesn't modify user/enrollment status
    - Mock email service calls
    - _Requirements: 4.1-4.7, 6.1-6.9, 7.1-7.9_

- [x] 3. Create leave management API endpoints
  - [x] 3.1 Create leaveController with submitRequest handler
    - Extract studentId from authenticated user
    - Validate request body (reason, reasonText, startDate, endDate)
    - Call leaveService.submitLeaveRequest
    - Return 201 with leave request data on success
    - Handle validation errors and return appropriate error messages
    - _Requirements: 4.1-4.7, 11.2_
  
  - [x] 3.2 Create getPendingRequests handler for admin
    - Extract pagination parameters (page, limit) with defaults
    - Query AcademicLeave with status 'pending'
    - Populate student information (studentCode, name, email)
    - Sort by createdAt ascending (oldest first)
    - Return paginated results with metadata
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.4_
  
  - [x] 3.3 Create approveRequest handler for admin
    - Extract leaveId from params and reviewNote from body
    - Extract adminId from authenticated user
    - Call leaveService.approveLeaveRequest
    - Return 200 with updated leave request
    - Handle errors (not found, already processed)
    - _Requirements: 6.1-6.9, 11.5_
  
  - [x] 3.4 Create rejectRequest handler for admin
    - Extract leaveId from params and reviewNote from body
    - Validate reviewNote is provided
    - Extract adminId from authenticated user
    - Call leaveService.rejectLeaveRequest
    - Return 200 with updated leave request
    - Handle errors (not found, already processed, missing reviewNote)
    - _Requirements: 7.1-7.9, 11.6_
  
  - [x] 3.5 Create getMyRequests handler for student
    - Extract studentId from authenticated user
    - Query all AcademicLeave records for the student
    - Populate reviewedBy admin information (name, email)
    - Sort by createdAt descending (newest first)
    - Return array of leave requests
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.3_
  
  - [ ]* 3.6 Write integration tests for leave API endpoints
    - Test POST /students/leave/request with valid and invalid data
    - Test GET /admin/leave-requests with pagination
    - Test PUT /admin/leave-requests/:id/approve
    - Test PUT /admin/leave-requests/:id/reject
    - Test GET /students/leave/my-requests
    - Test authorization (student vs admin access)
    - _Requirements: 11.1-11.7_

- [x] 4. Set up API routes and middleware
  - [x] 4.1 Create checkLeaveStatus middleware
    - Check if user role is 'student'
    - Check if user status is 'on_leave'
    - Return 403 error if student is on leave
    - Allow non-students to pass through
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_
  
  - [x] 4.2 Create leave management routes
    - Add POST /students/leave/request (auth, student role only)
    - Add GET /students/leave/my-requests (auth, student role only)
    - Add GET /admin/leave-requests (auth, admin role only)
    - Add PUT /admin/leave-requests/:id/approve (auth, admin role only)
    - Add PUT /admin/leave-requests/:id/reject (auth, admin role only)
    - _Requirements: 11.1-11.7_
  
  - [x] 4.3 Apply checkLeaveStatus middleware to protected routes
    - Apply to class detail endpoints (GET /classes/:id)
    - Apply to assignment submission endpoints (POST /assignments/:id/submit)
    - Apply to attendance endpoints (POST /attendance/checkin)
    - Apply to any other student class-related endpoints
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

- [x] 5. Extend email service for leave notifications
  - [x] 5.1 Add sendLeaveApprovalEmail function
    - Create email template with subject "Đơn xin bảo lưu đã được phê duyệt"
    - Include student name, reason, startDate, endDate, reviewNote
    - Include admin name and email for contact
    - Use existing email transporter configuration
    - Log errors but don't throw (non-blocking)
    - _Requirements: 10.1, 10.3, 10.5, 10.6, 10.7_
  
  - [x] 5.2 Add sendLeaveRejectionEmail function
    - Create email template with subject "Đơn xin bảo lưu đã bị từ chối"
    - Include student name, reviewNote (rejection reason)
    - Include admin name and email for contact
    - Use existing email transporter configuration
    - Log errors but don't throw (non-blocking)
    - _Requirements: 10.2, 10.4, 10.5, 10.6, 10.7_
  
  - [ ]* 5.3 Write unit tests for email functions
    - Test sendLeaveApprovalEmail with valid data
    - Test sendLeaveRejectionEmail with valid data
    - Test error handling when email service fails
    - Mock nodemailer transporter
    - _Requirements: 10.1-10.7_

- [ ] 6. Checkpoint - Ensure backend tests pass
  - Run all backend unit and integration tests
  - Verify database models are created correctly
  - Test API endpoints with Postman or similar tool
  - Ensure all tests pass, ask the user if questions arise

- [x] 7. Create student leave request form UI
  - [x] 7.1 Create LeaveRequestForm component
    - Create form with reason dropdown (voluntary, medical, military, financial, personal)
    - Add textarea for reasonText with min 20 chars, max 1000 chars validation
    - Add date picker for startDate with min date = today
    - Add date picker for endDate with min date = startDate
    - Implement client-side validation (dates, text length)
    - Display validation error messages below each field
    - Show success message and clear form on successful submission
    - Show API error messages on submission failure
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9_
  
  - [x] 7.2 Create API service functions for leave requests
    - Create submitLeaveRequest function (POST /students/leave/request)
    - Create getMyLeaveRequests function (GET /students/leave/my-requests)
    - Handle authentication headers
    - Handle error responses
    - _Requirements: 4.1-4.7, 8.1-8.5_
  
  - [ ]* 7.3 Write frontend tests for LeaveRequestForm
    - Test form validation (required fields, date validation, text length)
    - Test successful submission flow
    - Test error handling and display
    - Mock API calls
    - _Requirements: 12.1-12.9_

- [x] 8. Create student leave status display UI
  - [x] 8.1 Create StudentLeaveStatus component
    - Display list of all leave requests for logged-in student
    - Show status badges with colors: pending (yellow), approved (green), rejected (red)
    - Display reason, reasonText, startDate, endDate for each request
    - Display reviewedBy admin name and reviewedAt date for processed requests
    - Display reviewNote for rejected requests
    - Sort requests by createdAt descending (newest first)
    - Show "You have no leave requests" message when empty
    - Add button to submit new request if no pending request exists
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_
  
  - [ ]* 8.2 Write frontend tests for StudentLeaveStatus
    - Test rendering of leave requests with different statuses
    - Test empty state display
    - Test navigation to submit new request
    - Mock API calls
    - _Requirements: 14.1-14.8_

- [x] 9. Create admin leave requests management UI
  - [x] 9.1 Create AdminLeaveRequestsList component
    - Display table with columns: Student Code, Student Name, Reason, Start Date, End Date, Submitted Date, Actions
    - Show Approve and Reject buttons for each pending request
    - Implement approve confirmation dialog with optional note field
    - Implement reject dialog with required note field
    - Show loading indicator during API calls
    - Auto-refresh list after successful approve/reject
    - Implement pagination controls (20 records per page)
    - Show "No pending leave requests" message when empty
    - _Requirements: 5.1-5.5, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9_
  
  - [x] 9.2 Create API service functions for admin operations
    - Create getPendingLeaveRequests function (GET /admin/leave-requests)
    - Create approveLeaveRequest function (PUT /admin/leave-requests/:id/approve)
    - Create rejectLeaveRequest function (PUT /admin/leave-requests/:id/reject)
    - Handle authentication headers
    - Handle pagination parameters
    - Handle error responses
    - _Requirements: 5.1-5.5, 6.1-6.9, 7.1-7.9_
  
  - [ ]* 9.3 Write frontend tests for AdminLeaveRequestsList
    - Test table rendering with leave requests
    - Test approve and reject dialogs
    - Test pagination
    - Test empty state display
    - Mock API calls
    - _Requirements: 13.1-13.9_

- [x] 10. Integrate leave management into navigation and routing
  - [x] 10.1 Add leave management routes to frontend router
    - Add /leave/request route for LeaveRequestForm (student only)
    - Add /leave/status route for StudentLeaveStatus (student only)
    - Add /admin/leave-requests route for AdminLeaveRequestsList (admin only)
    - Add route guards based on user role
    - _Requirements: 11.1-11.7_
  
  - [x] 10.2 Add navigation menu items
    - Add "Bảo lưu" menu item for students linking to leave status page
    - Add "Quản lý bảo lưu" menu item for admins linking to leave requests list
    - Show menu items based on user role
    - _Requirements: 12.1-12.9, 13.1-13.9, 14.1-14.8_

- [ ] 11. Final checkpoint - End-to-end testing
  - Test complete student flow: submit request → view status
  - Test complete admin flow: view requests → approve/reject → verify email sent
  - Test access control: verify on-leave students cannot access classes
  - Test edge cases: duplicate requests, invalid dates, unauthorized access
  - Verify all UI components display correctly
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements from requirements.md for traceability
- The implementation follows the existing codebase patterns (Express.js, MongoDB, React)
- Email notifications are non-blocking to prevent transaction rollbacks
- Access control middleware is applied to existing class-related endpoints
- Database indexes are added for query performance optimization
- The system preserves backward compatibility with existing User and Enrollment fields
