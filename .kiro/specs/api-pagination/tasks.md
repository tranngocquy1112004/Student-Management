# Implementation Plan: API Pagination

## Overview

Triển khai pagination đồng nhất cho tất cả API endpoints trong hệ thống quản lý học tập. Implementation bao gồm việc tạo pagination utility function có thể tái sử dụng, cập nhật 8 endpoints khác nhau, cập nhật frontend API services, và viết comprehensive tests (unit tests + property-based tests).

## Tasks

- [x] 1. Tạo pagination utility function
  - [x] 1.1 Tạo file `backend/src/utils/pagination.js` với function `paginate()`
    - Implement parameter validation và sanitization logic
    - Implement backward compatibility mode (no pagination object khi không có params)
    - Implement parallel execution của data query và count query
    - Return standardized response format với pagination metadata
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 8.1, 8.2, 8.3, 8.4, 8.5, 10.2, 10.3, 10.4_
  
  - [ ]* 1.2 Viết unit tests cho pagination utility
    - Test parameter sanitization với các edge cases (0, -1, "abc", null, undefined)
    - Test backward compatibility mode
    - Test limit capping (>100)
    - Test empty result handling
    - Test totalPages calculation
    - _Requirements: 7.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 1.3 Viết property test cho pagination utility
    - **Property 1: Paginated Response Format Consistency**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
  
  - [ ]* 1.4 Viết property test cho parameter sanitization
    - **Property 5: Parameter Validation and Sanitization**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

- [x] 2. Cập nhật Schedule endpoints
  - [x] 2.1 Cập nhật `GET /classes/:classId/schedules` trong scheduleController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với Schedule model và filter
    - Maintain backward compatibility
    - _Requirements: 1.1, 1.2, 1.5, 1.6_
  
  - [x] 2.2 Cập nhật `GET /schedules/my-schedule` trong scheduleController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với user-specific filter
    - Maintain backward compatibility
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 2.3 Viết integration tests cho schedule endpoints
    - Test cả hai endpoints với pagination params
    - Test backward compatibility (no params)
    - Test response format
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 3. Cập nhật Assignment endpoints
  - [x] 3.1 Cập nhật `GET /classes/:classId/assignments` trong assignmentController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với Assignment model
    - Maintain backward compatibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  
  - [ ]* 3.2 Viết integration tests cho assignment endpoints
    - Test endpoint với pagination params
    - Test backward compatibility
    - Test response format
    - _Requirements: 2.1, 2.2_

- [x] 4. Cập nhật Student List endpoints
  - [x] 4.1 Cập nhật `GET /classes/:classId/students` trong classController hoặc studentController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với student enrollment query
    - Maintain backward compatibility
    - _Requirements: 3.1, 3.2, 3.3, 3.4_
  
  - [ ]* 4.2 Viết integration tests cho student list endpoints
    - Test endpoint với pagination params
    - Test backward compatibility
    - Test response format
    - _Requirements: 3.1, 3.2_

- [x] 5. Cập nhật Attendance endpoints
  - [x] 5.1 Cập nhật `GET /classes/:classId/attendance/sessions` trong attendanceController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với AttendanceSession model
    - Maintain backward compatibility
    - _Requirements: 4.1, 4.2, 4.5, 4.6_
  
  - [x] 5.2 Cập nhật `GET /attendance/my-attendance/:classId` trong attendanceController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với user-specific attendance filter
    - Maintain backward compatibility
    - _Requirements: 4.3, 4.4_
  
  - [ ]* 5.3 Viết integration tests cho attendance endpoints
    - Test cả hai endpoints với pagination params
    - Test backward compatibility
    - Test response format
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 6. Cập nhật Gradebook endpoints
  - [x] 6.1 Cập nhật `GET /classes/:classId/gradebook` trong gradebookController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với Gradebook model
    - Maintain backward compatibility
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [ ]* 6.2 Viết integration tests cho gradebook endpoints
    - Test endpoint với pagination params
    - Test backward compatibility
    - Test response format
    - _Requirements: 5.1, 5.2_

- [x] 7. Cập nhật Announcement endpoints
  - [x] 7.1 Cập nhật `GET /classes/:classId/announcements` trong announcementController
    - Import pagination utility
    - Extract page và limit từ req.query
    - Sử dụng paginate() với Announcement model
    - Maintain backward compatibility
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 7.2 Viết integration tests cho announcement endpoints
    - Test endpoint với pagination params
    - Test backward compatibility
    - Test response format
    - _Requirements: 6.1, 6.2_

- [x] 8. Checkpoint - Backend implementation complete
  - Ensure all backend tests pass, ask the user if questions arise.

- [x] 9. Cập nhật Frontend API services
  - [x] 9.1 Cập nhật schedule API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - Maintain backward compatibility với responses không có pagination
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 9.2 Cập nhật assignment API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 9.3 Cập nhật student list API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 9.4 Cập nhật attendance API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 9.5 Cập nhật gradebook API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - _Requirements: 9.1, 9.2, 9.5_
  
  - [x] 9.6 Cập nhật announcement API calls trong frontend
    - Thêm page và limit parameters vào API calls
    - Update response handling để extract pagination metadata
    - _Requirements: 9.1, 9.2, 9.5_

- [ ] 10. Viết comprehensive property-based tests
  - [ ]* 10.1 Setup fast-check testing framework
    - Install fast-check package
    - Configure test environment
    - Create test utilities và helpers
  
  - [ ]* 10.2 Viết property test cho backward compatibility
    - **Property 2: Backward Compatibility**
    - **Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.7**
  
  - [ ]* 10.3 Viết property test cho data subset correctness
    - **Property 3: Pagination Data Subset Correctness**
    - **Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1**
  
  - [ ]* 10.4 Viết property test cho MongoDB query implementation
    - **Property 4: MongoDB Query Implementation**
    - **Validates: Requirements 1.5, 1.6, 2.3, 2.4, 3.3, 3.4, 4.5, 4.6, 5.3, 5.4, 6.3, 6.4**
  
  - [ ]* 10.5 Viết property test cho empty page handling
    - **Property 6: Empty Page Handling**
    - **Validates: Requirements 10.4**
  
  - [ ]* 10.6 Viết property test cho query filter consistency
    - **Property 7: Query Filter Consistency**
    - **Validates: Requirements 10.2**
  
  - [ ]* 10.7 Viết property test cho parallel query execution
    - **Property 8: Parallel Query Execution**
    - **Validates: Requirements 10.3**
  
  - [ ]* 10.8 Viết property test cho frontend URL parameter construction
    - **Property 9: Frontend URL Parameter Construction**
    - **Validates: Requirements 9.1**
  
  - [ ]* 10.9 Viết property test cho frontend response parsing
    - **Property 10: Frontend Response Parsing**
    - **Validates: Requirements 9.2, 9.5**

- [x] 11. Performance optimization và validation
  - [x] 11.1 Verify database indexes tồn tại cho tất cả models
    - Check và add indexes cho Schedule, Assignment, Enrollment, AttendanceSession, Gradebook, Announcement
    - Ensure indexes cover classId, isDeleted, và sort fields
    - _Requirements: 10.1_
  
  - [ ]* 11.2 Viết performance tests
    - **Property 11: Performance Improvement**
    - **Validates: Requirements 10.5**
    - Test response time với pagination vs without pagination cho datasets > 50 items

- [x] 12. Final checkpoint - All tests pass
  - Ensure all tests pass (unit tests, integration tests, property tests)
  - Verify backward compatibility với existing API clients
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional và có thể skip để faster MVP
- Mỗi task references specific requirements để ensure traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties across nhiều inputs
- Unit tests validate specific examples và edge cases
- Backend implementation phải complete trước khi bắt đầu frontend updates
- Backward compatibility là critical - không được break existing API clients
