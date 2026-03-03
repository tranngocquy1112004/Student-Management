# Attendance Module Test Cases

## Tổng quan

Repository chứa toàn bộ test cases cho module Điểm danh (Attendance) của hệ thống Quản Lý Lớp Học.

## Cấu trúc Test

```
src/__tests__/
├── unit/
│   └── attendance.test.js          # Unit tests cho individual functions
├── integration/
│   └── attendance.integration.test.js # Integration tests cho API endpoints
├── property/
│   └── attendance.property.test.js   # Property-based tests với fast-check
└── README.md                       # File này
```

## Test Cases được implement

### TC-20: QR hợp lệ, đúng giờ (Valid QR, on time)
- **Mô tả**: Kiểm tra điểm danh thành công với mã QR hợp lệ và đúng thời gian
- **Input**: qrToken hợp lệ
- **Expected Output**: 200 status: present
- **Coverage**: Unit, Integration

### TC-21: QR đã hết hạn (QR expired)
- **Mô tả**: Kiểm tra xử lý khi mã QR đã hết hạn
- **Input**: qrToken expired
- **Expected Output**: 400 QR expired
- **Coverage**: Unit, Integration

### TC-22: Điểm danh muộn (Late attendance)
- **Mô tả**: Kiểm tra xử lý khi sinh viên điểm danh muộn
- **Input**: check-in sau 15 phút
- **Expected Output**: 200 status: late
- **Coverage**: Unit, Integration

### TC-23: SV đã điểm danh (Student already checked in)
- **Mô tả**: Kiểm tra xử lý khi sinh viên đã điểm danh
- **Input**: duplicate check-in
- **Expected Output**: 409 Already checked
- **Coverage**: Unit, Integration

### TC-24: SV không thuộc lớp (Student not in class)
- **Mô tả**: Kiểm tra xử lý khi sinh viên không thuộc lớp
- **Input**: not enrolled
- **Expected Output**: 403 Not enrolled
- **Coverage**: Unit, Integration

### TC-25: Vắng > 20% (Absence > 20%)
- **Mô tả**: Kiểm tra tự động tạo cảnh cáo khi tỷ lệ vắng > 20%
- **Input**: tỷ lệ vắng 21%
- **Expected Output**: Tạo Attendance Warning
- **Coverage**: Unit, Integration

## Cách chạy tests

### 1. Cài đặt dependencies
```bash
npm install
```

### 2. Setup test environment
```bash
# Copy test environment file
cp .env.test .env.local

# Start MongoDB (nếu chưa chạy)
mongod
```

### 3. Chạy tất cả tests
```bash
npm run test:attendance
```

### 4. Chạy theo loại test

#### Unit Tests
```bash
npm run test:attendance:unit
# hoặc
npm run test:unit
```

#### Integration Tests
```bash
npm run test:attendance:integration
# hoặc
npm run test:integration
```

#### Property-based Tests
```bash
npm run test:attendance:property
# hoặc
npm run test:property
```

### 5. Chạy với coverage
```bash
npm run test:coverage
```

### 6. Chạy trong watch mode
```bash
npm run test:watch
```

## Test Results

### Expected Results
Tất cả test cases nên pass với kết quả:

| Test Case | Status | Description |
|-----------|---------|-------------|
| TC-20 | ✅ Pass | Valid QR check-in |
| TC-21 | ✅ Pass | Expired QR handling |
| TC-22 | ✅ Pass | Late check-in |
| TC-23 | ✅ Pass | Duplicate prevention |
| TC-24 | ✅ Pass | Enrollment validation |
| TC-25 | ✅ Pass | Warning creation |

### Coverage Metrics
- **Unit Tests**: Test individual functions và logic
- **Integration Tests**: Test API endpoints và database interactions
- **Property Tests**: Test edge cases và random inputs

## Test Data

### Mock Data Structure
- **Admin User**: admin@test.com / password123
- **Teacher User**: teacher@test.com / password123
- **Student User**: student@test.com / password123
- **Test Class**: TC001 với 50 sinh viên tối đa

### Database Collections
- `users` - User authentication data
- `students` - Student profiles
- `teachers` - Teacher profiles
- `classes` - Class information
- `enrollments` - Student-class relationships
- `attendance_sessions` - Attendance sessions
- `attendance_records` - Individual attendance records
- `attendance_warnings` - Warning records

## Debugging Tests

### Common Issues
1. **MongoDB Connection**: Đảm bảo MongoDB đang chạy trên port 27017
2. **Environment Variables**: Kiểm tra file .env.test đã được cấu hình đúng
3. **Port Conflicts**: Tests sử dụng port 5001, đảm bảo không conflict
4. **Test Database**: Tests sử dụng database riêng `school_management_test`

### Debug Commands
```bash
# Chạy tests với verbose output
npm run test:attendance -- --verbose

# Chạy tests với coverage chi tiết
npm run test:coverage -- --collectCoverageFrom="src/controllers/attendanceController.js"

# Debug specific test
npm run test:attendance -- --testNamePattern="TC-20"
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Attendance Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test:attendance
      - run: npm run test:coverage
```

## Best Practices

### Test Writing
1. **AAA Pattern**: Arrange, Act, Assert
2. **Descriptive Names**: Test names mô tả rõ ràng functionality
3. **Independent Tests**: Mỗi test không phụ thuộc vào test khác
4. **Mock External Dependencies**: Database, APIs, services
5. **Edge Cases**: Test boundary conditions và error scenarios

### Test Data Management
1. **Cleanup**: Xóa data sau mỗi test
2. **Isolation**: Mỗi test có data riêng
3. **Realistic Data**: Sử dụng data tương tự production
4. **Performance**: Tránh tạo quá nhiều test data

### Error Handling Tests
1. **HTTP Status Codes**: Kiểm tra correct status codes
2. **Error Messages**: Verify meaningful error messages
3. **Edge Cases**: Invalid inputs, missing data
4. **Security**: Unauthorized access, injection attempts

## Future Enhancements

### Planned Test Additions
1. **Load Testing**: Test với nhiều concurrent users
2. **Performance Testing**: Response time benchmarks
3. **Security Testing**: Penetration test scenarios
4. **Cross-browser Testing**: Frontend compatibility

### Test Automation
1. **Scheduled Runs**: Daily automated tests
2. **Regression Testing**: Automated regression detection
3. **Coverage Reports**: Automated coverage tracking
4. **Test Reports**: Detailed test result analytics

## Liên hệ

Nếu có questions về test cases hoặc gặp issues khi chạy tests, vui lòng liên hệ:
- **Email**: test@school.vn
- **Documentation**: [System Documentation](../README.md)
- **Issues**: [GitHub Issues](https://github.com/project/issues)
