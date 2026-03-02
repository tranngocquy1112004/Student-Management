# Design Document: API Pagination

## Overview

Tài liệu này mô tả thiết kế chi tiết cho việc triển khai pagination đồng nhất cho tất cả API endpoints trong hệ thống quản lý học tập. Hệ thống hiện tại có một số endpoints đã có pagination nhưng chưa đồng nhất, và nhiều endpoints quan trọng vẫn trả về toàn bộ dữ liệu không phân trang, gây ra vấn đề về hiệu năng khi dữ liệu lớn.

Giải pháp được thiết kế với các mục tiêu chính:
- Tạo một pagination utility function có thể tái sử dụng cho tất cả endpoints
- Đảm bảo backward compatibility với các API clients hiện tại
- Chuẩn hóa response format cho tất cả paginated endpoints
- Tối ưu hóa hiệu năng database queries
- Validate và sanitize query parameters để tránh lỗi

## Architecture

### High-Level Architecture

```
┌─────────────────┐
│  Frontend       │
│  React Client   │
└────────┬────────┘
         │ HTTP Request (page, limit)
         ▼
┌─────────────────────────────────────┐
│  Backend Express Server             │
│  ┌───────────────────────────────┐  │
│  │  Controller Layer             │  │
│  │  - Parse query params         │  │
│  │  - Call pagination helper     │  │
│  └───────────┬───────────────────┘  │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  Pagination Utility           │  │
│  │  - Validate params            │  │
│  │  - Build MongoDB query        │  │
│  │  - Execute parallel queries   │  │
│  │  - Format response            │  │
│  └───────────┬───────────────────┘  │
│              ▼                       │
│  ┌───────────────────────────────┐  │
│  │  MongoDB Database             │  │
│  │  - Execute skip/limit query   │  │
│  │  - Execute count query        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Component Interaction Flow

1. **Request Phase**: Frontend gửi request với query parameters `page` và `limit`
2. **Validation Phase**: Backend validate và sanitize parameters
3. **Query Phase**: Thực thi parallel queries (data + count) trên MongoDB
4. **Response Phase**: Format và trả về response với pagination metadata



## Components and Interfaces

### 1. Pagination Utility Function

**Location**: `backend/src/utils/pagination.js`

**Function Signature**:
```javascript
/**
 * Paginate a Mongoose query
 * @param {Object} query - Mongoose query object (before .find())
 * @param {Object} filter - MongoDB filter object
 * @param {Object} options - Pagination options
 * @param {number} options.page - Page number (from query params)
 * @param {number} options.limit - Items per page (from query params)
 * @param {Object} options.sort - Sort object (e.g., { createdAt: -1 })
 * @param {string|Object} options.populate - Populate options
 * @returns {Promise<Object>} Paginated result with data and metadata
 */
async function paginate(query, filter, options)
```

**Return Format**:
```javascript
{
  success: true,
  data: [...],           // Array of documents
  pagination: {
    page: 1,             // Current page number
    limit: 10,           // Items per page
    total: 100,          // Total number of documents
    totalPages: 10       // Total number of pages
  }
}
```

**Backward Compatibility Mode**:
Khi cả `page` và `limit` đều không được cung cấp, function trả về:
```javascript
{
  success: true,
  data: [...]            // All documents, no pagination object
}
```

**Parameter Validation Rules**:
- `page < 1` → default to `1`
- `limit < 1` → default to `10`
- `page` not a number → default to `1`
- `limit` not a number → default to `10`
- `limit > 100` → cap at `100`

### 2. Controller Modifications

Mỗi controller cần được cập nhật để sử dụng pagination utility:

**Pattern cũ**:
```javascript
export const getSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ 
      classId: req.params.classId, 
      isDeleted: false 
    });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

**Pattern mới**:
```javascript
import { paginate } from '../utils/pagination.js';

export const getSchedules = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const filter = { 
      classId: req.params.classId, 
      isDeleted: false 
    };
    
    const result = await paginate(
      Schedule,
      filter,
      {
        page,
        limit,
        sort: { createdAt: -1 }
      }
    );
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### 3. Affected Endpoints

Các endpoints sau cần được cập nhật:

**Schedule Endpoints**:
- `GET /classes/:classId/schedules`
- `GET /schedules/my-schedule`

**Assignment Endpoints**:
- `GET /classes/:classId/assignments`

**Student List Endpoints**:
- `GET /classes/:classId/students`

**Attendance Endpoints**:
- `GET /classes/:classId/attendance/sessions`
- `GET /attendance/my-attendance/:classId`

**Gradebook Endpoints**:
- `GET /classes/:classId/gradebook`

**Announcement Endpoints**:
- `GET /classes/:classId/announcements`

### 4. Frontend API Service Updates

**Location**: `frontend/src/services/api.js` (hoặc tương tự)

**API Call Pattern**:
```javascript
// Old pattern
const getSchedules = async (classId) => {
  const response = await axios.get(`/classes/${classId}/schedules`);
  return response.data;
};

// New pattern with pagination
const getSchedules = async (classId, page = 1, limit = 10) => {
  const response = await axios.get(`/classes/${classId}/schedules`, {
    params: { page, limit }
  });
  return response.data;
};

// Backward compatible - no params returns all data
const getAllSchedules = async (classId) => {
  const response = await axios.get(`/classes/${classId}/schedules`);
  return response.data;
};
```

**Response Handling**:
```javascript
const handlePaginatedResponse = (response) => {
  // Check if response has pagination metadata
  if (response.pagination) {
    return {
      items: response.data,
      currentPage: response.pagination.page,
      totalPages: response.pagination.totalPages,
      total: response.pagination.total
    };
  }
  
  // Backward compatibility - no pagination metadata
  return {
    items: response.data,
    currentPage: 1,
    totalPages: 1,
    total: response.data.length
  };
};
```



## Data Models

Không có thay đổi về data models. Pagination được implement ở application layer, không yêu cầu thay đổi database schema.

Tuy nhiên, để tối ưu hiệu năng, cần đảm bảo các indexes sau đã tồn tại:

**Schedule Model**:
```javascript
scheduleSchema.index({ classId: 1, isDeleted: 1, createdAt: -1 });
```

**Assignment Model**:
```javascript
assignmentSchema.index({ classId: 1, isDeleted: 1, deadline: -1 });
```

**Enrollment Model** (for students list):
```javascript
enrollmentSchema.index({ classId: 1 });
```

**AttendanceSession Model**:
```javascript
attendanceSessionSchema.index({ classId: 1, isDeleted: 1, date: -1 });
```

**Gradebook Model**:
```javascript
gradebookSchema.index({ classId: 1, isDeleted: 1 });
```

**Announcement Model**:
```javascript
announcementSchema.index({ classId: 1, isDeleted: 1, createdAt: -1 });
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Paginated Response Format Consistency

*For any* paginated endpoint that receives both page and limit parameters, the response SHALL include a success boolean, a data array, and a pagination object containing page, limit, total, and totalPages fields, where totalPages equals Math.ceil(total / limit).

**Validates: Requirements 7.1, 7.2, 7.3, 7.4**

### Property 2: Backward Compatibility

*For any* endpoint that supports pagination, when both page and limit parameters are omitted, the response SHALL return all data in the data array without a pagination object, maintaining compatibility with existing API clients.

**Validates: Requirements 1.2, 2.2, 3.2, 4.2, 5.2, 6.2, 7.7**

### Property 3: Pagination Data Subset Correctness

*For any* paginated endpoint with valid page and limit parameters, the returned data array SHALL contain exactly min(limit, remaining_items) items starting from offset (page - 1) * limit in the complete dataset.

**Validates: Requirements 1.1, 2.1, 3.1, 4.1, 5.1, 6.1**

### Property 4: MongoDB Query Implementation

*For any* paginated query, the implementation SHALL use MongoDB's skip((page - 1) * limit) and limit(limit) methods for data retrieval, and countDocuments with the same filter for total count calculation.

**Validates: Requirements 1.5, 1.6, 2.3, 2.4, 3.3, 3.4, 4.5, 4.6, 5.3, 5.4, 6.3, 6.4**

### Property 5: Parameter Validation and Sanitization

*For any* pagination request, invalid parameters SHALL be sanitized as follows: page < 1 defaults to 1, limit < 1 defaults to 10, non-numeric page defaults to 1, non-numeric limit defaults to 10, and limit > 100 is capped at 100.

**Validates: Requirements 8.1, 8.2, 8.3, 8.4, 8.5**

### Property 6: Empty Page Handling

*For any* paginated request where the page number exceeds the total number of available pages, the response SHALL return an empty data array with correct pagination metadata showing the actual total and totalPages.

**Validates: Requirements 10.4**

### Property 7: Query Filter Consistency

*For any* paginated endpoint, the filter used in the countDocuments query SHALL be identical to the filter used in the data retrieval query to ensure accurate total counts.

**Validates: Requirements 10.2**

### Property 8: Parallel Query Execution

*For any* paginated request, the data retrieval query and count query SHALL be executed in parallel using Promise.all to minimize response time.

**Validates: Requirements 10.3**

### Property 9: Frontend URL Parameter Construction

*For any* frontend API call to a paginated endpoint, when page and limit values are provided, they SHALL be included as query parameters in the request URL.

**Validates: Requirements 9.1**

### Property 10: Frontend Response Parsing

*For any* frontend component receiving a paginated response, it SHALL correctly extract pagination metadata when present, and handle responses without pagination metadata for backward compatibility.

**Validates: Requirements 9.2, 9.5**

### Property 11: Performance Improvement

*For any* paginated endpoint, when the total number of records exceeds 50 items, the response time with pagination SHALL be less than the response time of returning all data without pagination.

**Validates: Requirements 10.5**



## Error Handling

### Query Parameter Validation Errors

Pagination utility sẽ KHÔNG throw errors cho invalid parameters, thay vào đó sẽ sanitize chúng về giá trị mặc định hợp lệ. Điều này đảm bảo API luôn trả về response thành công thay vì lỗi 400.

**Sanitization Logic**:
```javascript
const sanitizePageParams = (page, limit) => {
  let sanitizedPage = parseInt(page);
  let sanitizedLimit = parseInt(limit);
  
  // Handle invalid page
  if (isNaN(sanitizedPage) || sanitizedPage < 1) {
    sanitizedPage = 1;
  }
  
  // Handle invalid limit
  if (isNaN(sanitizedLimit) || sanitizedLimit < 1) {
    sanitizedLimit = 10;
  }
  
  // Cap limit at 100
  if (sanitizedLimit > 100) {
    sanitizedLimit = 100;
  }
  
  return { page: sanitizedPage, limit: sanitizedLimit };
};
```

### Database Query Errors

Nếu MongoDB query fails, error sẽ được propagate lên controller layer và trả về standard error response:

```javascript
{
  success: false,
  message: "Error message"
}
```

### Empty Result Handling

Khi page number vượt quá số trang có sẵn, API vẫn trả về success response với empty data array:

```javascript
{
  success: true,
  data: [],
  pagination: {
    page: 999,
    limit: 10,
    total: 50,
    totalPages: 5
  }
}
```

### Backward Compatibility Error Handling

Khi cả page và limit đều không được cung cấp, nếu có lỗi trong query, error response sẽ giống như hiện tại (không có pagination object):

```javascript
{
  success: false,
  message: "Error message"
}
```



## Testing Strategy

### Dual Testing Approach

Chúng ta sẽ sử dụng cả unit tests và property-based tests để đảm bảo tính đúng đắn toàn diện:

**Unit Tests**: Tập trung vào các trường hợp cụ thể, edge cases, và integration points
**Property Tests**: Verify các universal properties across nhiều inputs ngẫu nhiên

### Unit Testing

**Test Framework**: Jest + Supertest (cho API testing)

**Test Categories**:

1. **Pagination Utility Tests** (`backend/src/utils/pagination.test.js`):
   - Test parameter sanitization với các giá trị cụ thể (0, -1, "abc", null, undefined)
   - Test backward compatibility mode (no params)
   - Test limit capping (101, 200, 1000)
   - Test empty result handling
   - Test với mock MongoDB queries

2. **Controller Integration Tests**:
   - Test mỗi endpoint với pagination params
   - Test mỗi endpoint không có pagination params (backward compatibility)
   - Test response format consistency
   - Test với real database (test database)

3. **Frontend Service Tests** (`frontend/src/services/api.test.js`):
   - Test URL construction với page/limit params
   - Test response parsing với pagination metadata
   - Test response parsing không có pagination metadata
   - Test error handling

**Example Unit Test**:
```javascript
describe('Pagination Utility', () => {
  describe('Parameter Sanitization', () => {
    it('should default page to 1 when page is 0', async () => {
      const result = await paginate(Model, {}, { page: 0, limit: 10 });
      expect(result.pagination.page).toBe(1);
    });
    
    it('should default page to 1 when page is negative', async () => {
      const result = await paginate(Model, {}, { page: -5, limit: 10 });
      expect(result.pagination.page).toBe(1);
    });
    
    it('should cap limit at 100 when limit exceeds 100', async () => {
      const result = await paginate(Model, {}, { page: 1, limit: 200 });
      expect(result.pagination.limit).toBe(100);
    });
  });
  
  describe('Backward Compatibility', () => {
    it('should return all data without pagination object when no params', async () => {
      const result = await paginate(Model, {}, {});
      expect(result.data).toBeDefined();
      expect(result.pagination).toBeUndefined();
    });
  });
});
```

### Property-Based Testing

**Test Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Test Implementation**:

Mỗi correctness property sẽ được implement bằng một property-based test với tag reference về design document.

**Example Property Test**:
```javascript
const fc = require('fast-check');

describe('Pagination Properties', () => {
  /**
   * Feature: api-pagination, Property 1: Paginated Response Format Consistency
   * For any paginated endpoint that receives both page and limit parameters,
   * the response SHALL include success, data, and pagination with correct fields
   */
  it('Property 1: Response format consistency', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // page
        fc.integer({ min: 1, max: 100 }), // limit
        async (page, limit) => {
          const result = await paginate(TestModel, {}, { page, limit });
          
          // Check response structure
          expect(result).toHaveProperty('success', true);
          expect(result).toHaveProperty('data');
          expect(Array.isArray(result.data)).toBe(true);
          expect(result).toHaveProperty('pagination');
          
          // Check pagination object
          const { pagination } = result;
          expect(pagination).toHaveProperty('page');
          expect(pagination).toHaveProperty('limit');
          expect(pagination).toHaveProperty('total');
          expect(pagination).toHaveProperty('totalPages');
          
          // Verify totalPages calculation
          const expectedTotalPages = Math.ceil(pagination.total / pagination.limit);
          expect(pagination.totalPages).toBe(expectedTotalPages);
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: api-pagination, Property 3: Pagination Data Subset Correctness
   * For any paginated request, returned data should be correct subset
   */
  it('Property 3: Data subset correctness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }), // page
        fc.integer({ min: 1, max: 20 }), // limit
        async (page, limit) => {
          // Get all data
          const allData = await TestModel.find({}).sort({ createdAt: -1 });
          
          // Get paginated data
          const result = await paginate(TestModel, {}, { 
            page, 
            limit,
            sort: { createdAt: -1 }
          });
          
          // Calculate expected subset
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const expectedData = allData.slice(startIndex, endIndex);
          
          // Verify data matches
          expect(result.data.length).toBe(
            Math.min(limit, Math.max(0, allData.length - startIndex))
          );
          
          // Verify IDs match (order matters)
          result.data.forEach((item, index) => {
            if (expectedData[index]) {
              expect(item._id.toString()).toBe(
                expectedData[index]._id.toString()
              );
            }
          });
        }
      ),
      { numRuns: 100 }
    );
  });
  
  /**
   * Feature: api-pagination, Property 5: Parameter Validation and Sanitization
   * For any invalid parameters, they should be sanitized correctly
   */
  it('Property 5: Parameter sanitization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.constant('invalid'),
          fc.constant(null),
          fc.constant(undefined)
        ), // invalid page
        fc.oneof(
          fc.integer({ max: 0 }),
          fc.integer({ min: 101, max: 1000 }),
          fc.constant('invalid'),
          fc.constant(null),
          fc.constant(undefined)
        ), // invalid limit
        async (invalidPage, invalidLimit) => {
          const result = await paginate(TestModel, {}, { 
            page: invalidPage, 
            limit: invalidLimit 
          });
          
          // Page should be sanitized to 1
          expect(result.pagination.page).toBeGreaterThanOrEqual(1);
          
          // Limit should be between 1 and 100
          expect(result.pagination.limit).toBeGreaterThanOrEqual(1);
          expect(result.pagination.limit).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

**Test Coverage Goals**:
- Unit test coverage: ≥ 90% for pagination utility
- Property test coverage: All 11 correctness properties implemented
- Integration test coverage: All 8 affected endpoints tested

