# Design Document: Academic Leave Management (Phase 1 MVP)

## Overview

Tài liệu này mô tả thiết kế chi tiết cho hệ thống Quản lý Bảo lưu (Academic Leave Management) Phase 1 MVP. Hệ thống cho phép sinh viên nộp đơn xin bảo lưu học tập, admin xem xét và phê duyệt/từ chối các đơn, đồng thời tự động cập nhật trạng thái sinh viên và enrollment khi đơn được duyệt.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                        │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Student Portal   │  │  Admin Portal    │                │
│  │ - Leave Form     │  │ - Requests List  │                │
│  │ - Status View    │  │ - Approve/Reject │                │
│  └────────┬─────────┘  └────────┬─────────┘                │
└───────────┼────────────────────┼──────────────────────────┘
            │                    │
            │  HTTP/REST API     │
            ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend (Express.js)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                       │  │
│  │  - leaveController (CRUD operations)                 │  │
│  │  - Validation & Authorization                        │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Services Layer                          │  │
│  │  - leaveService (Business Logic)                     │  │
│  │  - emailService (Notifications)                      │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 ▼                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Models Layer                            │  │
│  │  - User (with status field)                          │  │
│  │  - Enrollment (with status field)                    │  │
│  │  - AcademicLeave (new model)                         │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼───────────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                         │
│  - users collection (updated schema)                        │
│  - enrollments collection (updated schema)                  │
│  - academicleaves collection (new)                          │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Submit Leave Request Flow:**
```
Student → LeaveRequestForm → POST /students/leave/request
    → leaveController.submitRequest()
    → Validate input & check existing requests
    → Create AcademicLeave record (status: pending)
    → Return 201 Created
```

**Approve Leave Request Flow:**
```
Admin → LeaveRequestsList → PUT /admin/leave-requests/:id/approve
    → leaveController.approveRequest()
    → Validate request status (must be pending)
    → Update AcademicLeave.status = 'approved'
    → Update User.status = 'on_leave'
    → Update all Enrollment.status = 'on_leave'
    → Send approval email
    → Return 200 OK
```

## Data Models

### 1. User Model (Updated)

**File:** `backend/src/models/User.js`

**New Fields:**
```javascript
{
  // ... existing fields ...
  status: {
    type: String,
    enum: ['active', 'on_leave', 'dismissed', 'suspended'],
    default: 'active'
  }
}
```

**Migration Strategy:**
- Existing users without status field will default to 'active'
- Add index on status field for query performance
- Backward compatible with existing isLocked and isDeleted fields

### 2. Enrollment Model (Updated)

**File:** `backend/src/models/Enrollment.js`

**New Fields:**
```javascript
{
  // ... existing fields ...
  status: {
    type: String,
    enum: ['active', 'completed', 'dropped', 'on_leave'],
    default: 'active'
  }
}
```

**Migration Strategy:**
- Existing enrollments without status field will default to 'active'
- Preserve isCompleted field for backward compatibility
- When isCompleted = true, status should be 'completed'

### 3. AcademicLeave Model (New)

**File:** `backend/src/models/AcademicLeave.js`

**Schema:**
```javascript
const academicLeaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    enum: ['voluntary', 'medical', 'military', 'financial', 'personal'],
    required: true
  },
  reasonText: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 1000
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNote: {
    type: String,
    maxlength: 500
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes
academicLeaveSchema.index({ studentId: 1, status: 1 });
academicLeaveSchema.index({ status: 1, createdAt: 1 });

// Validation
academicLeaveSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('startDate must be before endDate'));
  }
  next();
});
```

## API Endpoints

### 1. Submit Leave Request

**Endpoint:** `POST /students/leave/request`

**Authentication:** Required (Student role only)

**Request Body:**
```javascript
{
  reason: 'medical',              // enum: voluntary, medical, military, financial, personal
  reasonText: 'string',           // min 20 chars, max 1000 chars
  startDate: '2024-03-01',        // ISO date string
  endDate: '2024-06-30'           // ISO date string
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  data: {
    _id: 'leave_id',
    studentId: 'student_id',
    reason: 'medical',
    reasonText: 'Detailed explanation...',
    startDate: '2024-03-01T00:00:00.000Z',
    endDate: '2024-06-30T00:00:00.000Z',
    status: 'pending',
    createdAt: '2024-02-15T10:00:00.000Z'
  },
  message: 'Đơn xin bảo lưu đã được gửi thành công'
}
```

**Error Responses:**
- 400: Validation errors (invalid dates, missing fields, duplicate pending request)
- 403: User already on leave or not a student
- 401: Not authenticated

### 2. Get Pending Leave Requests (Admin)

**Endpoint:** `GET /admin/leave-requests`

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200 OK):**
```javascript
{
  success: true,
  data: [
    {
      _id: 'leave_id',
      studentId: {
        _id: 'student_id',
        studentCode: 'SV001',
        name: 'Nguyen Van A',
        email: 'student@example.com'
      },
      reason: 'medical',
      reasonText: 'Detailed explanation...',
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      status: 'pending',
      createdAt: '2024-02-15T10:00:00.000Z'
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    totalPages: 1
  }
}
```

### 3. Approve Leave Request

**Endpoint:** `PUT /admin/leave-requests/:id/approve`

**Authentication:** Required (Admin role only)

**Request Body:**
```javascript
{
  reviewNote: 'string'  // optional, max 500 chars
}
```

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'leave_id',
    studentId: 'student_id',
    status: 'approved',
    reviewedBy: 'admin_id',
    reviewedAt: '2024-02-16T09:00:00.000Z',
    reviewNote: 'Approved due to medical reasons'
  },
  message: 'Đơn xin bảo lưu đã được phê duyệt'
}
```

**Error Responses:**
- 400: Request not in pending status
- 404: Leave request not found
- 403: Not authorized (not admin)

### 4. Reject Leave Request

**Endpoint:** `PUT /admin/leave-requests/:id/reject`

**Authentication:** Required (Admin role only)

**Request Body:**
```javascript
{
  reviewNote: 'string'  // required, max 500 chars
}
```

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'leave_id',
    studentId: 'student_id',
    status: 'rejected',
    reviewedBy: 'admin_id',
    reviewedAt: '2024-02-16T09:00:00.000Z',
    reviewNote: 'Insufficient documentation provided'
  },
  message: 'Đơn xin bảo lưu đã bị từ chối'
}
```

**Error Responses:**
- 400: Missing reviewNote or request not in pending status
- 404: Leave request not found
- 403: Not authorized (not admin)

### 5. Get My Leave Requests (Student)

**Endpoint:** `GET /students/leave/my-requests`

**Authentication:** Required (Student role only)

**Response (200 OK):**
```javascript
{
  success: true,
  data: [
    {
      _id: 'leave_id',
      reason: 'medical',
      reasonText: 'Detailed explanation...',
      startDate: '2024-03-01T00:00:00.000Z',
      endDate: '2024-06-30T00:00:00.000Z',
      status: 'approved',
      reviewedBy: {
        _id: 'admin_id',
        name: 'Admin Name',
        email: 'admin@example.com'
      },
      reviewedAt: '2024-02-16T09:00:00.000Z',
      reviewNote: 'Approved',
      createdAt: '2024-02-15T10:00:00.000Z'
    }
  ]
}
```

## Business Logic

### Leave Request Submission Logic

**File:** `backend/src/services/leaveService.js`

```javascript
async function submitLeaveRequest(studentId, requestData) {
  // 1. Validate dates
  const startDate = new Date(requestData.startDate);
  const endDate = new Date(requestData.endDate);
  const now = new Date();
  
  if (startDate < now) {
    throw new Error('Ngày bắt đầu không thể là quá khứ');
  }
  
  if (startDate >= endDate) {
    throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
  }
  
  // 2. Check user status
  const user = await User.findById(studentId);
  if (user.status === 'on_leave') {
    throw new Error('Bạn đang trong thời gian bảo lưu');
  }
  
  // 3. Check for existing pending request
  const existingRequest = await AcademicLeave.findOne({
    studentId,
    status: 'pending'
  });
  
  if (existingRequest) {
    throw new Error('Bạn đã có đơn xin bảo lưu đang chờ duyệt');
  }
  
  // 4. Create leave request
  const leaveRequest = await AcademicLeave.create({
    studentId,
    ...requestData,
    status: 'pending'
  });
  
  return leaveRequest;
}
```

### Approve Leave Request Logic

```javascript
async function approveLeaveRequest(leaveId, adminId, reviewNote) {
  // 1. Find and validate leave request
  const leaveRequest = await AcademicLeave.findById(leaveId);
  
  if (!leaveRequest) {
    throw new Error('Không tìm thấy đơn xin bảo lưu');
  }
  
  if (leaveRequest.status !== 'pending') {
    throw new Error('Đơn này đã được xử lý');
  }
  
  // 2. Update leave request
  leaveRequest.status = 'approved';
  leaveRequest.reviewedBy = adminId;
  leaveRequest.reviewedAt = new Date();
  if (reviewNote) {
    leaveRequest.reviewNote = reviewNote;
  }
  await leaveRequest.save();
  
  // 3. Update user status
  await User.findByIdAndUpdate(leaveRequest.studentId, {
    status: 'on_leave'
  });
  
  // 4. Update all active enrollments
  await Enrollment.updateMany(
    {
      studentId: leaveRequest.studentId,
      status: 'active'
    },
    {
      status: 'on_leave'
    }
  );
  
  // 5. Send approval email (async, don't wait)
  sendApprovalEmail(leaveRequest).catch(err => {
    console.error('Email sending failed:', err);
  });
  
  return leaveRequest;
}
```

### Reject Leave Request Logic

```javascript
async function rejectLeaveRequest(leaveId, adminId, reviewNote) {
  // 1. Validate reviewNote is provided
  if (!reviewNote || reviewNote.trim().length === 0) {
    throw new Error('Vui lòng nhập lý do từ chối');
  }
  
  // 2. Find and validate leave request
  const leaveRequest = await AcademicLeave.findById(leaveId);
  
  if (!leaveRequest) {
    throw new Error('Không tìm thấy đơn xin bảo lưu');
  }
  
  if (leaveRequest.status !== 'pending') {
    throw new Error('Đơn này đã được xử lý');
  }
  
  // 3. Update leave request (NO status changes for user/enrollments)
  leaveRequest.status = 'rejected';
  leaveRequest.reviewedBy = adminId;
  leaveRequest.reviewedAt = new Date();
  leaveRequest.reviewNote = reviewNote;
  await leaveRequest.save();
  
  // 4. Send rejection email (async, don't wait)
  sendRejectionEmail(leaveRequest).catch(err => {
    console.error('Email sending failed:', err);
  });
  
  return leaveRequest;
}
```

## Access Control Middleware

### Check Student On Leave Status

**File:** `backend/src/middleware/checkLeaveStatus.js`

```javascript
export const checkStudentNotOnLeave = async (req, res, next) => {
  try {
    // Only check for students
    if (req.user.role !== 'student') {
      return next();
    }
    
    // Check user status
    if (req.user.status === 'on_leave') {
      return res.status(403).json({
        success: false,
        message: 'Bạn đang trong thời gian bảo lưu và không thể truy cập lớp học'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Usage in Routes:**
```javascript
// Apply to class-related endpoints
router.get('/classes/:id', auth, checkStudentNotOnLeave, getClassById);
router.post('/assignments/:id/submit', auth, checkStudentNotOnLeave, submitAssignment);
router.post('/attendance/checkin', auth, checkStudentNotOnLeave, checkIn);
```

## Email Notification Templates

### Approval Email Template

**Subject:** `Đơn xin bảo lưu đã được phê duyệt`

**Body:**
```
Xin chào [Student Name],

Đơn xin bảo lưu của bạn đã được phê duyệt.

Thông tin bảo lưu:
- Lý do: [Reason]
- Thời gian: [Start Date] đến [End Date]
- Ghi chú: [Review Note]

Trong thời gian bảo lưu, bạn sẽ không thể truy cập các lớp học. Vui lòng liên hệ phòng đào tạo nếu có thắc mắc.

Trân trọng,
[Admin Name]
[Admin Email]
```

### Rejection Email Template

**Subject:** `Đơn xin bảo lưu đã bị từ chối`

**Body:**
```
Xin chào [Student Name],

Đơn xin bảo lưu của bạn đã bị từ chối.

Lý do từ chối:
[Review Note]

Nếu bạn có thắc mắc hoặc muốn nộp đơn mới, vui lòng liên hệ phòng đào tạo.

Trân trọng,
[Admin Name]
[Admin Email]
```

## Frontend Components

### 1. LeaveRequestForm Component

**File:** `frontend/src/components/LeaveRequestForm.js`

**Props:** None (uses auth context for student info)

**State:**
```javascript
{
  reason: '',
  reasonText: '',
  startDate: '',
  endDate: '',
  errors: {},
  loading: false
}
```

**Validation Rules:**
- reason: required, must be one of enum values
- reasonText: required, min 20 chars, max 1000 chars
- startDate: required, must be future date
- endDate: required, must be after startDate

**UI Structure:**
```
<form>
  <select name="reason">
    <option value="voluntary">Tự nguyện</option>
    <option value="medical">Y tế</option>
    <option value="military">Nghĩa vụ quân sự</option>
    <option value="financial">Tài chính</option>
    <option value="personal">Cá nhân</option>
  </select>
  
  <textarea name="reasonText" minLength={20} maxLength={1000} />
  
  <input type="date" name="startDate" min={today} />
  <input type="date" name="endDate" min={startDate} />
  
  <button type="submit">Gửi đơn</button>
</form>
```

### 2. AdminLeaveRequestsList Component

**File:** `frontend/src/pages/AdminLeaveRequests.js`

**State:**
```javascript
{
  requests: [],
  loading: false,
  selectedRequest: null,
  showApproveModal: false,
  showRejectModal: false,
  reviewNote: '',
  page: 1,
  totalPages: 1
}
```

**UI Structure:**
```
<table>
  <thead>
    <tr>
      <th>Mã SV</th>
      <th>Họ tên</th>
      <th>Lý do</th>
      <th>Ngày bắt đầu</th>
      <th>Ngày kết thúc</th>
      <th>Ngày nộp</th>
      <th>Thao tác</th>
    </tr>
  </thead>
  <tbody>
    {requests.map(request => (
      <tr key={request._id}>
        <td>{request.studentId.studentCode}</td>
        <td>{request.studentId.name}</td>
        <td>{translateReason(request.reason)}</td>
        <td>{formatDate(request.startDate)}</td>
        <td>{formatDate(request.endDate)}</td>
        <td>{formatDate(request.createdAt)}</td>
        <td>
          <button onClick={() => handleApprove(request)}>Duyệt</button>
          <button onClick={() => handleReject(request)}>Từ chối</button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

<Pagination page={page} totalPages={totalPages} onChange={setPage} />
```

### 3. StudentLeaveStatus Component

**File:** `frontend/src/components/StudentLeaveStatus.js`

**State:**
```javascript
{
  requests: [],
  loading: false
}
```

**UI Structure:**
```
<div>
  {requests.length === 0 ? (
    <p>Bạn chưa có đơn xin bảo lưu nào</p>
  ) : (
    requests.map(request => (
      <div key={request._id} className="leave-request-card">
        <span className={`status-badge ${request.status}`}>
          {translateStatus(request.status)}
        </span>
        <p>Lý do: {translateReason(request.reason)}</p>
        <p>Chi tiết: {request.reasonText}</p>
        <p>Thời gian: {formatDate(request.startDate)} - {formatDate(request.endDate)}</p>
        
        {request.status !== 'pending' && (
          <>
            <p>Người xét duyệt: {request.reviewedBy?.name}</p>
            <p>Ngày xét duyệt: {formatDate(request.reviewedAt)}</p>
            {request.reviewNote && <p>Ghi chú: {request.reviewNote}</p>}
          </>
        )}
      </div>
    ))
  )}
  
  {!hasPendingRequest && (
    <button onClick={() => navigate('/leave/request')}>
      Nộp đơn xin bảo lưu
    </button>
  )}
</div>
```

## Error Handling

### Validation Errors

**Format:**
```javascript
{
  success: false,
  message: 'Validation failed',
  errors: {
    startDate: 'Ngày bắt đầu không thể là quá khứ',
    endDate: 'Ngày kết thúc phải sau ngày bắt đầu'
  }
}
```

### Business Logic Errors

**Format:**
```javascript
{
  success: false,
  message: 'Bạn đã có đơn xin bảo lưu đang chờ duyệt'
}
```

### Authorization Errors

**Format:**
```javascript
{
  success: false,
  message: 'Bạn không có quyền truy cập'
}
```

## Testing Strategy

### Unit Tests

1. **Model Tests:**
   - User status field validation
   - Enrollment status field validation
   - AcademicLeave schema validation
   - Date validation (startDate < endDate)

2. **Service Tests:**
   - submitLeaveRequest with valid/invalid data
   - approveLeaveRequest updates all related records
   - rejectLeaveRequest doesn't modify user/enrollment status
   - Email sending (mock)

3. **Controller Tests:**
   - Authorization checks
   - Input validation
   - Error handling

### Integration Tests

1. **API Endpoint Tests:**
   - POST /students/leave/request (success & error cases)
   - GET /admin/leave-requests (pagination)
   - PUT /admin/leave-requests/:id/approve (status updates)
   - PUT /admin/leave-requests/:id/reject (with reviewNote)
   - GET /students/leave/my-requests

2. **Access Control Tests:**
   - Student on leave cannot access classes
   - Student on leave can view leave status
   - Only admin can approve/reject requests

### Frontend Tests

1. **Component Tests:**
   - LeaveRequestForm validation
   - AdminLeaveRequestsList rendering
   - StudentLeaveStatus status badges

2. **Integration Tests:**
   - Submit leave request flow
   - Approve/reject flow
   - View status flow

## Performance Considerations

### Database Indexes

```javascript
// User model
userSchema.index({ status: 1 });
userSchema.index({ role: 1, status: 1 });

// Enrollment model
enrollmentSchema.index({ studentId: 1, status: 1 });
enrollmentSchema.index({ classId: 1, status: 1 });

// AcademicLeave model
academicLeaveSchema.index({ studentId: 1, status: 1 });
academicLeaveSchema.index({ status: 1, createdAt: 1 });
```

### Query Optimization

- Use `.lean()` for read-only queries
- Populate only necessary fields
- Implement pagination for list endpoints
- Cache frequently accessed data (user status)

## Security Considerations

1. **Authentication:** All endpoints require valid JWT token
2. **Authorization:** Role-based access control (student vs admin)
3. **Input Validation:** Sanitize all user inputs
4. **SQL Injection:** Use Mongoose parameterized queries
5. **XSS Prevention:** Escape HTML in reasonText and reviewNote
6. **Rate Limiting:** Limit leave request submissions (1 per day)

## Deployment Checklist

- [ ] Run database migrations to add status fields
- [ ] Update existing User records with default status
- [ ] Update existing Enrollment records with default status
- [ ] Deploy backend API endpoints
- [ ] Deploy frontend components
- [ ] Test email service configuration
- [ ] Update API documentation
- [ ] Train admin users on approval workflow
- [ ] Communicate feature to students

