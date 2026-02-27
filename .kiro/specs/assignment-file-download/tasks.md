# Implementation Plan: Assignment File Download

## Overview

This implementation plan creates a secure file download endpoint for assignment attachments. The endpoint will handle authentication, authorization, file path validation, and proper HTTP response headers. The implementation follows the existing Express.js patterns in the codebase and reuses existing authentication middleware and permission checking utilities.

## Tasks

- [x] 1. Add download route to assignment routes
  - Add GET route `/assignments/download/:filename` in `backend/src/routes/assignmentRoutes.js`
  - Route should use existing `protect` middleware for authentication
  - Map route to `assignmentController.downloadAttachment` controller function
  - _Requirements: 1.1, 2.1_

- [x] 2. Implement core download controller function
  - [x] 2.1 Create downloadAttachment controller function in assignmentController.js
    - Extract filename from `req.params.filename`
    - Validate filename doesn't contain directory traversal patterns (`../`, `..\`)
    - Return 400 Bad Request if traversal patterns detected
    - _Requirements: 4.4, 2.1_
  
  - [ ]* 2.2 Write property test for directory traversal rejection
    - **Property 13: Directory Traversal Rejection**
    - **Validates: Requirements 4.4**
  
  - [x] 2.3 Implement assignment lookup by filename
    - Query Assignment model where `attachments.name` matches the requested filename
    - Handle case where no assignment is found (return 404)
    - Extract classId from the found assignment
    - _Requirements: 2.2, 7.1, 7.2_
  
  - [ ]* 2.4 Write property test for assignment lookup
    - **Property 6: Assignment Lookup**
    - **Validates: Requirements 2.2, 7.1**

- [x] 3. Implement permission checking
  - [x] 3.1 Add permission validation using canAccessClass helper
    - Call existing `canAccessClass(req.user, classId)` function
    - Return 403 Forbidden if user lacks access
    - Return JSON error response with appropriate message
    - _Requirements: 2.3, 2.5_
  
  - [ ]* 3.2 Write property test for authorization rules
    - **Property 7: Authorization Rules**
    - **Validates: Requirements 2.3**
  
  - [ ]* 3.3 Write property test for unauthorized access rejection
    - **Property 8: Unauthorized Access Rejection**
    - **Validates: Requirements 2.5**

- [ ] 4. Checkpoint - Ensure authentication and authorization work correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement file path resolution and validation
  - [x] 5.1 Create helper function to extract filename from attachment URL
    - Handle URLs with `/uploads/files/` prefix (extract filename only)
    - Handle plain filenames (use as-is)
    - Add to assignmentController.js as internal helper
    - _Requirements: 4.1, 4.2_
  
  - [ ]* 5.2 Write property tests for path resolution
    - **Property 10: Path Resolution with Prefix**
    - **Property 11: Path Resolution without Prefix**
    - **Validates: Requirements 4.1, 4.2**
  
  - [x] 5.3 Implement file path normalization and validation
    - Use `path.join()` to combine upload directory with filename
    - Use `path.normalize()` to normalize the path
    - Verify normalized path stays within upload directory
    - Return 400 Bad Request if path escapes upload directory
    - _Requirements: 4.3_
  
  - [ ]* 5.4 Write property test for path normalization
    - **Property 12: Path Normalization**
    - **Validates: Requirements 4.3**

- [x] 6. Implement file existence check and MIME type detection
  - [x] 6.1 Check if file exists on disk
    - Use `fs.existsSync()` to verify file exists
    - Return 404 Not Found with JSON error if file doesn't exist
    - _Requirements: 3.1_
  
  - [x] 6.2 Determine MIME type from file extension
    - Use `mime-types` package to get MIME type from filename
    - Default to `application/octet-stream` if MIME type cannot be determined
    - _Requirements: 1.3, 5.3, 5.4_
  
  - [ ]* 6.3 Write property tests for file handling
    - **Property 1: File Location**
    - **Property 3: Content-Type Header**
    - **Validates: Requirements 1.1, 1.3, 5.3**

- [x] 7. Implement file response with proper headers
  - [x] 7.1 Set response headers and stream file
    - Get original filename from assignment attachments array
    - Set Content-Disposition header to `attachment; filename="[original_filename]"`
    - Set Content-Type header to determined MIME type
    - Use `res.sendFile()` to stream file with headers
    - Handle streaming errors appropriately
    - _Requirements: 1.2, 5.1, 5.2, 5.3_
  
  - [ ]* 7.2 Write property tests for response headers
    - **Property 2: Content-Disposition Header**
    - **Property 14: Content-Length Header**
    - **Validates: Requirements 1.2, 5.1, 5.2**
  
  - [ ]* 7.3 Write property test for special characters in filenames
    - **Property 4: Special Characters in Filenames**
    - **Validates: Requirements 1.4**

- [x] 8. Implement comprehensive error handling
  - [x] 8.1 Add error handling for all error scenarios
    - Handle authentication errors (401) - already handled by protect middleware
    - Handle authorization errors (403) with JSON response
    - Handle not found errors (404) with JSON response
    - Handle bad request errors (400) with JSON response
    - Handle server errors (500) with JSON response
    - Ensure all errors return JSON with `error` field
    - Log errors for debugging while sanitizing user-facing messages
    - _Requirements: 2.4, 2.5, 3.3, 6.1, 6.2, 6.3_
  
  - [ ]* 8.2 Write property tests for error responses
    - **Property 5: Authentication Requirement**
    - **Property 9: File Not Found Responses**
    - **Property 15: Error Response Format**
    - **Validates: Requirements 2.4, 3.1, 3.2, 3.3, 6.1, 6.2**

- [ ] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Integration testing and edge cases
  - [ ]* 10.1 Write unit tests for specific scenarios
    - Test downloading file when user is enrolled in class
    - Test downloading file when user is teacher of class
    - Test downloading file when user is admin
    - Test behavior when multiple assignments have same filename (verify first match is used)
    - Test files with no extension (verify default MIME type)
    - Test very long filenames
    - Test with deleted assignments
    - _Requirements: 2.3, 7.3_
  
  - [ ]* 10.2 Write integration tests for end-to-end flows
    - Test complete flow from authentication to file download
    - Test with real file system operations
    - Test with real database queries
    - Test with actual JWT tokens
    - _Requirements: All_

- [ ] 11. Final checkpoint - Verify implementation completeness
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation reuses existing `protect` middleware and `canAccessClass` helper
- Security is prioritized through path validation and permission checking
- Property tests ensure universal correctness across all inputs
- Unit tests validate specific examples and edge cases
