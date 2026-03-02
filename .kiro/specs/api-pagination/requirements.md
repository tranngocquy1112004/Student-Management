# Requirements Document

## Introduction

Tài liệu này mô tả các yêu cầu cho việc triển khai pagination đồng nhất cho tất cả API endpoints trong hệ thống quản lý học tập. Hiện tại, một số endpoints đã có pagination nhưng chưa đồng nhất, và nhiều endpoints quan trọng vẫn trả về toàn bộ dữ liệu không phân trang, gây ra vấn đề về hiệu năng khi dữ liệu lớn.

## Glossary

- **API_Endpoint**: Một URL path cụ thể trong REST API mà client có thể gọi để thực hiện các thao tác
- **Pagination**: Kỹ thuật chia nhỏ tập dữ liệu lớn thành các trang nhỏ hơn để cải thiện hiệu năng
- **Backend_Service**: Lớp service xử lý business logic trên server (Node.js/Express)
- **Frontend_Client**: Ứng dụng React chạy trên trình duyệt của người dùng
- **Query_Parameter**: Tham số được truyền trong URL sau dấu ? (ví dụ: ?page=1&limit=10)
- **Response_Payload**: Dữ liệu JSON được trả về từ API endpoint
- **MongoDB_Query**: Câu lệnh truy vấn cơ sở dữ liệu MongoDB
- **Backward_Compatible**: Khả năng hoạt động với code cũ mà không gây lỗi

## Requirements

### Requirement 1: Pagination cho Schedule Endpoints

**User Story:** Là một giáo viên hoặc sinh viên, tôi muốn xem lịch học được phân trang, để tôi có thể tải dữ liệu nhanh hơn khi có nhiều buổi học.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/schedules includes page and limit parameters, THE Backend_Service SHALL return schedules for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/schedules omits page and limit parameters, THE Backend_Service SHALL return all schedules without pagination for backward compatibility
3. WHEN a request to GET /schedules/my-schedule includes page and limit parameters, THE Backend_Service SHALL return the user's schedules for the specified page with pagination metadata
4. WHEN a request to GET /schedules/my-schedule omits page and limit parameters, THE Backend_Service SHALL return all user schedules without pagination for backward compatibility
5. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of schedules
6. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of schedules

### Requirement 2: Pagination cho Assignment Endpoints

**User Story:** Là một giáo viên hoặc sinh viên, tôi muốn xem danh sách bài tập được phân trang, để tôi có thể duyệt qua nhiều bài tập một cách hiệu quả.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/assignments includes page and limit parameters, THE Backend_Service SHALL return assignments for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/assignments omits page and limit parameters, THE Backend_Service SHALL return all assignments without pagination for backward compatibility
3. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of assignments
4. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of assignments

### Requirement 3: Pagination cho Student List Endpoints

**User Story:** Là một giáo viên, tôi muốn xem danh sách sinh viên trong lớp được phân trang, để tôi có thể quản lý lớp học lớn một cách dễ dàng.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/students includes page and limit parameters, THE Backend_Service SHALL return students for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/students omits page and limit parameters, THE Backend_Service SHALL return all students without pagination for backward compatibility
3. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of students
4. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of students in the class

### Requirement 4: Pagination cho Attendance Session Endpoints

**User Story:** Là một giáo viên, tôi muốn xem danh sách buổi điểm danh được phân trang, để tôi có thể quản lý lịch sử điểm danh hiệu quả.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/attendance/sessions includes page and limit parameters, THE Backend_Service SHALL return attendance sessions for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/attendance/sessions omits page and limit parameters, THE Backend_Service SHALL return all attendance sessions without pagination for backward compatibility
3. WHEN a request to GET /attendance/my-attendance/:classId includes page and limit parameters, THE Backend_Service SHALL return the user's attendance records for the specified page with pagination metadata
4. WHEN a request to GET /attendance/my-attendance/:classId omits page and limit parameters, THE Backend_Service SHALL return all user attendance records without pagination for backward compatibility
5. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of attendance sessions
6. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of attendance sessions

### Requirement 5: Pagination cho Gradebook Endpoints

**User Story:** Là một giáo viên, tôi muốn xem bảng điểm được phân trang, để tôi có thể xem điểm của nhiều sinh viên một cách có tổ chức.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/gradebook includes page and limit parameters, THE Backend_Service SHALL return gradebook entries for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/gradebook omits page and limit parameters, THE Backend_Service SHALL return all gradebook entries without pagination for backward compatibility
3. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of gradebook entries
4. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of gradebook entries

### Requirement 6: Pagination cho Announcement Endpoints

**User Story:** Là một giáo viên hoặc sinh viên, tôi muốn xem danh sách thông báo được phân trang, để tôi có thể duyệt qua lịch sử thông báo dễ dàng.

#### Acceptance Criteria

1. WHEN a request to GET /classes/:classId/announcements includes page and limit parameters, THE Backend_Service SHALL return announcements for the specified page with pagination metadata
2. WHEN a request to GET /classes/:classId/announcements omits page and limit parameters, THE Backend_Service SHALL return all announcements without pagination for backward compatibility
3. THE Backend_Service SHALL use MongoDB skip and limit methods to retrieve only the requested page of announcements
4. THE Backend_Service SHALL use MongoDB countDocuments to calculate the total number of announcements

### Requirement 7: Standardized Pagination Format

**User Story:** Là một frontend developer, tôi muốn tất cả API endpoints sử dụng cùng một format pagination, để tôi có thể tái sử dụng code xử lý pagination.

#### Acceptance Criteria

1. WHEN any paginated endpoint returns data, THE Response_Payload SHALL include a success boolean field
2. WHEN any paginated endpoint returns data, THE Response_Payload SHALL include a data array field containing the requested items
3. WHEN any paginated endpoint returns data, THE Response_Payload SHALL include a pagination object with page, limit, total, and totalPages fields
4. THE Backend_Service SHALL calculate totalPages as Math.ceil(total / limit)
5. WHEN page parameter is not provided, THE Backend_Service SHALL default to page 1
6. WHEN limit parameter is not provided, THE Backend_Service SHALL default to limit 10
7. WHEN both page and limit parameters are not provided, THE Backend_Service SHALL return all data without pagination object for backward compatibility

### Requirement 8: Query Parameter Validation

**User Story:** Là một backend developer, tôi muốn validate các query parameters, để tránh lỗi khi người dùng truyền giá trị không hợp lệ.

#### Acceptance Criteria

1. WHEN page parameter is less than 1, THE Backend_Service SHALL treat it as page 1
2. WHEN limit parameter is less than 1, THE Backend_Service SHALL treat it as limit 10
3. WHEN page parameter is not a valid number, THE Backend_Service SHALL treat it as page 1
4. WHEN limit parameter is not a valid number, THE Backend_Service SHALL treat it as limit 10
5. WHEN limit parameter exceeds 100, THE Backend_Service SHALL cap it at 100 to prevent excessive data retrieval

### Requirement 9: Frontend Integration

**User Story:** Là một frontend developer, tôi muốn cập nhật các API calls để hỗ trợ pagination, để người dùng có thể điều hướng qua các trang dữ liệu.

#### Acceptance Criteria

1. WHEN Frontend_Client calls a paginated endpoint, THE Frontend_Client SHALL include page and limit as query parameters in the request URL
2. WHEN Frontend_Client receives a paginated response, THE Frontend_Client SHALL extract pagination metadata from the response
3. THE Frontend_Client SHALL reuse existing pagination UI components to display page navigation controls
4. WHEN a user navigates to a different page, THE Frontend_Client SHALL update the page parameter and make a new API request
5. THE Frontend_Client SHALL maintain backward compatibility by handling responses both with and without pagination metadata

### Requirement 10: Performance Optimization

**User Story:** Là một system administrator, tôi muốn pagination cải thiện hiệu năng API, để hệ thống có thể xử lý nhiều người dùng đồng thời.

#### Acceptance Criteria

1. WHEN retrieving paginated data, THE MongoDB_Query SHALL use indexed fields for sorting to optimize query performance
2. WHEN counting total documents, THE MongoDB_Query SHALL use countDocuments with the same filter as the data query for accuracy
3. THE Backend_Service SHALL execute count and data queries in parallel where possible to reduce response time
4. WHEN page number exceeds available pages, THE Backend_Service SHALL return an empty data array with correct pagination metadata
5. FOR ALL paginated endpoints, the response time SHALL be less than the response time of returning all data when total records exceed 50 items
