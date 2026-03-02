# Implementation Plan: Teacher Reset Student Password

## Overview

Implement tính năng cho phép giáo viên và admin đặt lại mật khẩu cho sinh viên. Tính năng bao gồm backend API endpoint với authorization checks, email notification service, và frontend modal component tích hợp vào trang ClassDetail.

## Tasks

- [x] 1. Implement backend email service function
  - Create `sendPasswordResetEmail` function in `backend/src/services/emailService.js`
  - Function accepts email, name, and newPassword parameters
  - Generate HTML email template with new password
  - Handle email configuration errors gracefully
  - Return success/failure status without throwing errors
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 1.1 Write property test for email service
  - **Property 9: Email Notification Sent**
  - **Validates: Requirements 5.1, 5.2**
  - Test that email is sent for successful password resets
  - _Requirements: 5.1, 5.2_

- [ ]* 1.2 Write property test for email failure handling
  - **Property 10: Email Failure Does Not Block Reset**
  - **Validates: Requirements 5.3**
  - Test that password reset completes even when email fails
  - _Requirements: 5.3_

- [x] 2. Implement backend API endpoint and controller
  - [x] 2.1 Add POST route to `backend/src/routes/userRoutes.js`
    - Add route: `POST /:id/reset-password`
    - Apply `protect` and `authorize('teacher', 'admin')` middleware
    - Wire to `resetStudentPassword` controller function
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 7.1_

  - [x] 2.2 Implement `resetStudentPassword` controller in `backend/src/controllers/userController.js`
    - Extract studentId from params and newPassword from body
    - Validate password length (minimum 6 characters)
    - Find student by ID and verify role is 'student' and not deleted
    - For teachers: verify student is enrolled in a class taught by the teacher
    - For admins: skip class membership check
    - Update student password (will be hashed by pre-save hook)
    - Call email service to send notification
    - Log audit trail with teacher/admin ID, student ID, and timestamp
    - Return appropriate HTTP status codes and error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 5.1, 5.3, 7.2, 7.3, 7.4, 7.5, 7.6, 8.1, 8.2, 8.3_

  - [ ]* 2.3 Write property test for role-based authorization
    - **Property 1: Role-based Authorization**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Test that only teachers and admins can reset passwords
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 2.4 Write property test for JWT authentication
    - **Property 2: JWT Authentication Required**
    - **Validates: Requirements 1.4**
    - Test that valid JWT token is required for all requests
    - _Requirements: 1.4_

  - [ ]* 2.5 Write property test for teacher class membership
    - **Property 3: Teacher Class Membership Verification**
    - **Validates: Requirements 2.1, 2.2**
    - Test that teachers can only reset passwords for students in their classes
    - _Requirements: 2.1, 2.2_

  - [ ]* 2.6 Write property test for admin bypass
    - **Property 4: Admin Bypass of Class Membership**
    - **Validates: Requirements 2.3**
    - Test that admins can reset any student password without class checks
    - _Requirements: 2.3_

  - [ ]* 2.7 Write property test for password validation
    - **Property 5: Password Length Validation**
    - **Validates: Requirements 3.1, 3.2**
    - Test that passwords must be at least 6 characters
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.8 Write property test for password character acceptance
    - **Property 6: Password Character Acceptance**
    - **Validates: Requirements 3.3**
    - Test that any combination of characters is accepted if length is valid
    - _Requirements: 3.3_

  - [ ]* 2.9 Write property test for password hashing
    - **Property 7: Password Hashing with Bcrypt**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test that passwords are hashed with bcrypt before storage
    - _Requirements: 4.1, 4.2, 4.3_

  - [ ]* 2.10 Write unit tests for controller error handling
    - Test HTTP 400 for validation failures
    - Test HTTP 403 for authorization failures
    - Test HTTP 404 for non-existent students
    - Test HTTP 500 for database errors
    - _Requirements: 7.4, 7.5, 7.6_

- [ ] 3. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement frontend ResetPasswordModal component
  - [x] 4.1 Create `frontend/src/components/ResetPasswordModal.js`
    - Accept props: student, onClose, onSuccess
    - Create state for newPassword and loading
    - Implement form with password input field
    - Display student name and email
    - Show password requirement hint (minimum 6 characters)
    - Validate password length on submit
    - Make API call to POST `/users/:id/reset-password`
    - Display success toast and call onSuccess callback
    - Display error toast for failures
    - Implement modal overlay with click-outside-to-close
    - Add Submit and Cancel buttons
    - _Requirements: 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 4.2 Write unit tests for ResetPasswordModal
    - Test modal renders with student information
    - Test form validation for short passwords
    - Test API call on form submission
    - Test success message display
    - Test error message display
    - Test modal close on cancel
    - _Requirements: 6.2, 6.3, 6.4, 6.6, 6.7_

- [x] 5. Update ClassDetail component to integrate password reset
  - [x] 5.1 Update `frontend/src/pages/ClassDetail.js`
    - Import ResetPasswordModal component
    - Add state: `resetPasswordStudent` (initially null)
    - Add "Đặt lại MK" button in student table for teachers and admins
    - Wire button click to set resetPasswordStudent state
    - Render ResetPasswordModal when resetPasswordStudent is not null
    - Pass student, onClose, and onSuccess props to modal
    - Implement onClose to clear resetPasswordStudent state
    - Implement onSuccess to optionally refresh student list
    - _Requirements: 6.1, 6.2, 6.5_

  - [ ]* 5.2 Write integration tests for ClassDetail password reset flow
    - Test "Đặt lại MK" button appears for teachers and admins
    - Test button click opens modal
    - Test successful password reset flow end-to-end
    - _Requirements: 6.1, 6.2, 6.5, 6.6_

- [ ] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Backend uses existing bcrypt pre-save hook in User model for password hashing
- Email service uses existing Nodemailer configuration from environment variables
- Frontend uses existing axios instance with JWT token handling
- Property tests should use fast-check library with minimum 100 iterations
- All audit logs use console.log with [AUDIT] prefix for easy filtering
