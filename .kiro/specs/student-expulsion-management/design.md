# Design Document: Student Expulsion Management

## Overview

Hệ thống Quản lý Đuổi học (Student Expulsion Management) là một tính năng quan trọng cho phép Admin chấm dứt tư cách học tập vĩnh viễn của sinh viên khi vi phạm quy định hoặc không đạt yêu cầu học tập. Khác với bảo lưu (tạm thời), đuổi học là quyết định vĩnh viễn và chỉ Admin mới có quyền thực hiện.

Hệ thống cung cấp các chức năng chính:
- Tạo và quản lý quyết định đuổi học với đầy đủ thông tin và tài liệu đính kèm
- Tự động cảnh báo học tập (GPA thấp) và cảnh báo vắng học (absence rate cao)
- Tự động xử lý hậu quả: đăng xuất sinh viên, hủy lịch học tương lai, khóa bài tập chưa nộp, đánh dấu bảng điểm
- Cơ chế khiếu nại cho phép sinh viên bị đuổi gửi đơn và Admin xem xét phục hồi
- Báo cáo vi phạm từ giáo viên để Admin xem xét
- Thống kê và audit trail đầy đủ

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                             │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │   Admin Portal       │  │  Student Portal      │                │
│  │ - Expulsion Mgmt     │  │ - View Expulsion     │                │
│  │ - Warning Dashboard  │  │ - Submit Appeal      │                │
│  │ - Appeal Processing  │  │ - View Warnings      │                │
│  │ - Statistics         │  └──────────────────────┘                │
│  └──────────────────────┘                                           │
│  ┌──────────────────────┐                                           │
│  │   Teacher Portal     │                                           │
│  │ - Report Violation   │                                           │
│  │ - View Warnings      │                                           │
│  └──────────────────────┘                                           │
└───────────────┬─────────────────────────────────────────────────────┘
                │  HTTP/REST API
                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (Express.js)                            │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Controllers Layer                          │ │
│  │  - expulsionController (CRUD, appeal processing)              │ │
│  │  - warningController (view warnings)                          │ │
│  │  - violationController (teacher reports)                      │ │
│  │  - statisticsController (expulsion stats)                     │ │
│  └────────────────────┬──────────────────────────────────────────┘ │
│                       ▼                                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Services Layer                             │ │
│  │  - expulsionService (business logic)                          │ │
│  │  - warningService (auto warning generation)                   │ │
│  │  - appealService (appeal processing)                          │ │
│  │  - emailService (notifications)                               │ │
│  │  - sessionService (terminate sessions)                        │ │
│  └────────────────────┬──────────────────────────────────────────┘ │
│                       ▼                                             │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                    Models Layer                               │ │
│  │  - ExpulsionRecord                                            │ │
│  │  - AcademicWarning                                            │ │
│  │  - AttendanceWarning                                          │ │
│  │  - ViolationReport                                            │ │
│  │  - User (updated with dismissed status)                      │ │
│  │  - Enrollment, Assignment, Gradebook (updated)                │ │
│  └────────────────────┬──────────────────────────────────────────┘ │
└────────────────────────┼────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       MongoDB Database                              │
│  - expulsionrecords collection                                      │
│  - academicwarnings collection                                      │
│  - attendancewarnings collection                                    │
│  - violationreports collection                                      │
│  - users collection (status: dismissed)                             │
│  - enrollments, assignments, gradebooks (updated)                   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flows

**Create Expulsion Flow:**
```
Admin → ExpulsionForm → POST /admin/expulsions
    → expulsionController.createExpulsion()
    → expulsionService.createExpulsion()
    → Create ExpulsionRecord (status: active)
    → Update User.status = 'dismissed'
    → Terminate all active sessions
    → Cancel future schedules
    → Lock pending assignments
    → Mark gradebook entries
    → Send email notification
    → Return 201 Created
```

**Automatic Warning Flow:**
```
System Event (GPA calculated / Attendance updated)
    → warningService.checkAcademicWarning() / checkAttendanceWarning()
    → Calculate GPA / Absence Rate
    → Check thresholds
    → Create AcademicWarning / AttendanceWarning
    → Send notifications to Student, Teacher, Admin
    → Return warning record
```

**Submit Appeal Flow:**
```
Expelled Student → AppealModal → PUT /students/expulsions/:id/appeal
    → expulsionController.submitAppeal()
    → Validate appealStatus is 'none'
    → Update ExpulsionRecord.appealStatus = 'pending'
    → Store appeal reason and evidence
    → Notify Admin
    → Return 200 OK
```

**Approve Appeal Flow:**
```
Admin → AppealProcessingModal → PUT /admin/expulsions/:id/approve-appeal
    → appealService.approveAppeal()
    → Update ExpulsionRecord.status = 'revoked'
    → Update ExpulsionRecord.appealStatus = 'approved'
    → Update User.status = 'active'
    → Restore student access
    → Unlock assignments
    → Restore class rosters
    → Remove DISMISSED markers
    → Send notification
    → Return 200 OK
```

## Data Models

### 1. ExpulsionRecord Model

**File:** `backend/src/models/ExpulsionRecord.js`

**Schema:**
```javascript
const expulsionRecordSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  reasonType: {
    type: String,
    enum: ['low_gpa', 'discipline_violation', 'excessive_absence', 'expired_leave'],
    required: true,
    index: true
  },
  effectiveDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value >= new Date();
      },
      message: 'effectiveDate cannot be in the past'
    }
  },
  attachments: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'appealed', 'revoked'],
    default: 'active',
    index: true
  },
  appealStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none',
    index: true
  },
  appealReason: {
    type: String,
    maxlength: 2000
  },
  appealEvidence: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  appealSubmittedAt: Date,
  appealReviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  appealReviewedAt: Date,
  appealReviewNote: {
    type: String,
    maxlength: 1000
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailSentAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Compound indexes for common queries
expulsionRecordSchema.index({ studentId: 1, status: 1 });
expulsionRecordSchema.index({ status: 1, createdAt: -1 });
expulsionRecordSchema.index({ reasonType: 1, effectiveDate: 1 });
expulsionRecordSchema.index({ appealStatus: 1, appealSubmittedAt: -1 });
```

**Validation Rules:**
- studentId: required, must reference existing User with role 'student'
- reason: required, 20-2000 characters
- reasonType: required, one of enum values
- effectiveDate: required, cannot be in the past
- status: default 'active', one of enum values
- appealStatus: default 'none', one of enum values
- createdBy: required, must reference existing User with role 'admin'

### 2. AcademicWarning Model

**File:** `backend/src/models/AcademicWarning.js`

**Schema:**
```javascript
const academicWarningSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  warningType: {
    type: String,
    enum: ['low_gpa', 'probation'],
    required: true
  },
  warningLevel: {
    type: Number,
    enum: [1, 2, 3],
    required: true,
    index: true
  },
  gpa: {
    type: Number,
    required: true,
    min: 0.0,
    max: 10.0
  },
  threshold: {
    type: Number,
    required: true,
    min: 0.0,
    max: 10.0
  },
  semester: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Validation: gpa must be less than threshold
academicWarningSchema.pre('save', function(next) {
  if (this.gpa >= this.threshold) {
    return next(new Error('GPA must be less than threshold'));
  }
  next();
});

// Compound indexes
academicWarningSchema.index({ studentId: 1, semester: 1 });
academicWarningSchema.index({ warningLevel: 1, createdAt: -1 });
academicWarningSchema.index({ studentId: 1, warningLevel: 1, semester: 1 });
```

**Validation Rules:**
- studentId: required, must reference existing User with role 'student'
- warningType: required, one of ['low_gpa', 'probation']
- warningLevel: required, one of [1, 2, 3]
- gpa: required, 0.0-10.0, must be less than threshold
- threshold: required, 0.0-10.0
- semester: required

### 3. AttendanceWarning Model

**File:** `backend/src/models/AttendanceWarning.js`

**Schema:**
```javascript
const attendanceWarningSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  classId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: true,
    index: true
  },
  absenceRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1
  },
  absentSessions: {
    type: Number,
    required: true,
    min: 0
  },
  warningLevel: {
    type: String,
    enum: ['warning', 'critical'],
    required: true,
    index: true
  },
  notifiedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: false });

// Validation: absentSessions <= totalSessions
attendanceWarningSchema.pre('save', function(next) {
  if (this.absentSessions > this.totalSessions) {
    return next(new Error('absentSessions cannot exceed totalSessions'));
  }
  
  // Validate absenceRate calculation
  const calculatedRate = (this.absentSessions / this.totalSessions) * 100;
  if (Math.abs(calculatedRate - this.absenceRate) > 0.01) {
    return next(new Error('absenceRate must equal (absentSessions / totalSessions) * 100'));
  }
  
  next();
});

// Compound indexes
attendanceWarningSchema.index({ studentId: 1, classId: 1 });
attendanceWarningSchema.index({ warningLevel: 1, createdAt: -1 });
attendanceWarningSchema.index({ classId: 1, warningLevel: 1 });
```

**Validation Rules:**
- studentId: required, must reference existing User with role 'student'
- classId: required, must reference existing Class
- absenceRate: required, 0-100
- totalSessions: required, >= 1
- absentSessions: required, >= 0, <= totalSessions
- absenceRate must equal (absentSessions / totalSessions) * 100 (invariant)
- warningLevel: required, one of ['warning', 'critical']

### 4. ViolationReport Model

**File:** `backend/src/models/ViolationReport.js`

**Schema:**
```javascript
const violationReportSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: true,
    minlength: 20,
    maxlength: 2000
  },
  evidence: [{
    filename: String,
    path: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'converted_to_expulsion', 'dismissed'],
    default: 'pending',
    index: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNote: {
    type: String,
    maxlength: 1000
  },
  expulsionRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExpulsionRecord'
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

// Compound indexes
violationReportSchema.index({ studentId: 1, status: 1 });
violationReportSchema.index({ reportedBy: 1, createdAt: -1 });
violationReportSchema.index({ status: 1, createdAt: -1 });
```

**Validation Rules:**
- studentId: required, must reference existing User with role 'student'
- reportedBy: required, must reference existing User with role 'teacher'
- description: required, 20-2000 characters
- status: default 'pending', one of enum values

### 5. User Model (Updated)

**File:** `backend/src/models/User.js`

**Updated Schema:**
```javascript
// Existing schema already has:
status: {
  type: String,
  enum: ['active', 'on_leave', 'dismissed', 'suspended'],
  default: 'active'
}

// No changes needed - 'dismissed' status already exists
```

**Note:** User model đã có trường `status` với giá trị 'dismissed', không cần thay đổi.

### 6. Enrollment Model (Updated)

**File:** `backend/src/models/Enrollment.js`

**New Fields:**
```javascript
{
  // ... existing fields ...
  cancelledAt: Date,
  cancelReason: String
}
```

**Note:** Khi sinh viên bị đuổi, các enrollment tương lai sẽ được đánh dấu với cancelledAt và cancelReason.

### 7. Assignment Model (Updated)

**File:** `backend/src/models/Assignment.js`

**New Fields:**
```javascript
{
  // ... existing fields ...
  lockedStudents: [{
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lockedAt: Date,
    reason: String
  }]
}
```

**Note:** Khi sinh viên bị đuổi, studentId sẽ được thêm vào mảng lockedStudents để ngăn nộp bài.

### 8. Gradebook Model (Updated)

**File:** `backend/src/models/Gradebook.js`

**New Fields:**
```javascript
{
  // ... existing fields ...
  dismissedMarker: {
    isDismissed: { type: Boolean, default: false },
    dismissedAt: Date,
    expulsionRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpulsionRecord'
    }
  }
}
```

**Note:** Đánh dấu sinh viên bị đuổi trong bảng điểm để giáo viên biết.

## Components and Interfaces

### Backend Services

#### 1. ExpulsionService

**File:** `backend/src/services/expulsionService.js`

**Methods:**

```javascript
// Create expulsion record and trigger all side effects
async createExpulsion(adminId, expulsionData)

// Get expulsion list with filters and pagination
async getExpulsionList(filters, pagination)

// Get expulsion details by ID
async getExpulsionById(expulsionId)

// Get expulsion by student ID
async getExpulsionByStudentId(studentId)

// Terminate all active sessions for expelled student
async terminateStudentSessions(studentId)

// Cancel future schedules for expelled student
async cancelFutureSchedules(studentId, effectiveDate)

// Lock pending assignments for expelled student
async lockPendingAssignments(studentId, effectiveDate)

// Mark gradebook entries for expelled student
async markGradebook(studentId, expulsionRecordId)
```

#### 2. WarningService

**File:** `backend/src/services/warningService.js`

**Methods:**

```javascript
// Check and create academic warning if needed
async checkAcademicWarning(studentId, semester)

// Check and create attendance warning if needed
async checkAttendanceWarning(studentId, classId)

// Calculate student GPA for a semester
async calculateGPA(studentId, semester)

// Calculate absence rate for a student in a class
async calculateAbsenceRate(studentId, classId)

// Get warning list with filters
async getWarningList(filters, pagination)

// Get warnings for a specific student
async getStudentWarnings(studentId)
```

#### 3. AppealService

**File:** `backend/src/services/appealService.js`

**Methods:**

```javascript
// Submit appeal for expulsion
async submitAppeal(studentId, expulsionId, appealData)

// Approve appeal and restore student access
async approveAppeal(adminId, expulsionId, reviewNote)

// Reject appeal
async rejectAppeal(adminId, expulsionId, reviewNote)

// Restore student access after appeal approval
async restoreStudentAccess(studentId, expulsionRecordId)

// Unlock assignments for restored student
async unlockAssignments(studentId)

// Restore student to class rosters
async restoreClassRosters(studentId)

// Remove dismissed markers from gradebook
async removeDismissedMarkers(studentId)
```

#### 4. EmailService (Extended)

**File:** `backend/src/services/emailService.js`

**New Methods:**

```javascript
// Send expulsion notification email
async sendExpulsionNotification(expulsionRecord)

// Send academic warning email
async sendAcademicWarningEmail(warning)

// Send attendance warning email
async sendAttendanceWarningEmail(warning)

// Send appeal submitted notification to admin
async sendAppealSubmittedNotification(expulsionRecord)

// Send appeal approved notification to student
async sendAppealApprovedNotification(expulsionRecord)

// Send appeal rejected notification to student
async sendAppealRejectedNotification(expulsionRecord)

// Send violation report notification to admin
async sendViolationReportNotification(violationReport)
```

### Backend Controllers

#### 1. ExpulsionController

**File:** `backend/src/controllers/expulsionController.js`

**Endpoints:**

```javascript
// POST /admin/expulsions - Create expulsion record
async createExpulsion(req, res)

// GET /admin/expulsions - Get expulsion list (admin only)
async getExpulsionList(req, res)

// GET /admin/expulsions/:id - Get expulsion details
async getExpulsionById(req, res)

// GET /students/expulsions/me - Get my expulsion (student)
async getMyExpulsion(req, res)

// PUT /students/expulsions/:id/appeal - Submit appeal
async submitAppeal(req, res)

// PUT /admin/expulsions/:id/approve-appeal - Approve appeal
async approveAppeal(req, res)

// PUT /admin/expulsions/:id/reject-appeal - Reject appeal
async rejectAppeal(req, res)
```

#### 2. WarningController

**File:** `backend/src/controllers/warningController.js`

**Endpoints:**

```javascript
// GET /admin/warnings - Get all warnings (admin only)
async getWarningList(req, res)

// GET /students/warnings/me - Get my warnings (student)
async getMyWarnings(req, res)

// GET /teachers/warnings/class/:classId - Get class warnings (teacher)
async getClassWarnings(req, res)
```

#### 3. ViolationController

**File:** `backend/src/controllers/violationController.js`

**Endpoints:**

```javascript
// POST /teachers/violations - Report violation (teacher only)
async reportViolation(req, res)

// GET /admin/violations - Get violation reports (admin only)
async getViolationList(req, res)

// PUT /admin/violations/:id/convert - Convert to expulsion
async convertToExpulsion(req, res)

// PUT /admin/violations/:id/dismiss - Dismiss violation
async dismissViolation(req, res)
```

#### 4. StatisticsController

**File:** `backend/src/controllers/statisticsController.js`

**Endpoints:**

```javascript
// GET /admin/statistics/expulsions - Get expulsion statistics
async getExpulsionStatistics(req, res)
```

### Frontend Components

#### 1. AdminExpulsionManagement

**File:** `frontend/src/pages/AdminExpulsionManagement.js`

**Features:**
- Display expulsion list with filters (status, reasonType, date range)
- Pagination support
- View expulsion details
- Process appeals (approve/reject)
- View statistics

**State:**
```javascript
{
  expulsions: [],
  filters: { status: '', reasonType: '', startDate: '', endDate: '' },
  page: 1,
  totalPages: 1,
  loading: false,
  selectedExpulsion: null,
  showDetailsModal: false
}
```

#### 2. ExpulsionForm

**File:** `frontend/src/components/ExpulsionForm.js`

**Features:**
- Select student (autocomplete)
- Select reason type
- Enter detailed reason (textarea)
- Set effective date
- Upload attachments
- Add notes

**State:**
```javascript
{
  studentId: '',
  reason: '',
  reasonType: '',
  effectiveDate: '',
  attachments: [],
  notes: '',
  errors: {},
  loading: false
}
```

#### 3. WarningsList

**File:** `frontend/src/components/WarningsList.js`

**Features:**
- Display academic warnings and attendance warnings
- Filter by warning level
- Highlight critical warnings
- Show student information

**State:**
```javascript
{
  warnings: [],
  filterLevel: '',
  loading: false
}
```

#### 4. AppealModal

**File:** `frontend/src/components/AppealModal.js`

**Features:**
- View expulsion details
- Enter appeal reason
- Upload evidence documents
- Submit appeal

**State:**
```javascript
{
  appealReason: '',
  evidence: [],
  errors: {},
  loading: false
}
```

#### 5. ViolationReportForm

**File:** `frontend/src/components/ViolationReportForm.js`

**Features:**
- Select student
- Enter violation description
- Upload evidence
- Submit report

**State:**
```javascript
{
  studentId: '',
  description: '',
  evidence: [],
  errors: {},
  loading: false
}
```

#### 6. ExpulsionStatistics

**File:** `frontend/src/components/ExpulsionStatistics.js`

**Features:**
- Display count by reason type (pie chart)
- Display count by semester (bar chart)
- Show appeal success rate
- Show warning-to-expulsion conversion rate

**State:**
```javascript
{
  statistics: null,
  dateRange: { start: '', end: '' },
  loading: false
}
```


## API Endpoints

### 1. Create Expulsion Record

**Endpoint:** `POST /admin/expulsions`

**Authentication:** Required (Admin role only)

**Request Body:**
```javascript
{
  studentId: 'string',
  reason: 'string',              // 20-2000 chars
  reasonType: 'string',          // enum: low_gpa, discipline_violation, excessive_absence, expired_leave
  effectiveDate: 'string',       // ISO date, must be future
  attachments: [File],           // optional
  notes: 'string'                // optional, max 1000 chars
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    studentId: 'student_id',
    reason: 'Detailed reason...',
    reasonType: 'low_gpa',
    effectiveDate: '2024-03-01T00:00:00.000Z',
    attachments: [...],
    notes: 'Additional notes',
    status: 'active',
    appealStatus: 'none',
    createdBy: 'admin_id',
    emailSentAt: '2024-02-15T10:00:00.000Z',
    createdAt: '2024-02-15T10:00:00.000Z'
  },
  message: 'Quyết định đuổi học đã được tạo thành công'
}
```

**Error Responses:**
- 400: Validation errors (invalid dates, missing fields, invalid reasonType)
- 403: Not authorized (not admin)
- 404: Student not found
- 401: Not authenticated

### 2. Get Expulsion List

**Endpoint:** `GET /admin/expulsions`

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `status` (optional): Filter by status (pending, active, appealed, revoked)
- `reasonType` (optional): Filter by reason type
- `startDate` (optional): Filter by effectiveDate >= startDate
- `endDate` (optional): Filter by effectiveDate <= endDate
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20
- `sortBy` (optional): Sort field (effectiveDate, createdAt), default createdAt
- `sortOrder` (optional): Sort order (asc, desc), default desc

**Response (200 OK):**
```javascript
{
  success: true,
  data: [
    {
      _id: 'expulsion_id',
      studentId: {
        _id: 'student_id',
        studentCode: 'SV001',
        name: 'Nguyen Van A',
        email: 'student@example.com'
      },
      reason: 'Detailed reason...',
      reasonType: 'low_gpa',
      effectiveDate: '2024-03-01T00:00:00.000Z',
      status: 'active',
      appealStatus: 'none',
      createdBy: {
        _id: 'admin_id',
        name: 'Admin Name'
      },
      createdAt: '2024-02-15T10:00:00.000Z'
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 50,
    totalPages: 3
  }
}
```

### 3. Get Expulsion Details

**Endpoint:** `GET /admin/expulsions/:id`

**Authentication:** Required (Admin role only)

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    studentId: { ... },
    reason: 'Detailed reason...',
    reasonType: 'low_gpa',
    effectiveDate: '2024-03-01T00:00:00.000Z',
    attachments: [...],
    notes: 'Additional notes',
    status: 'active',
    appealStatus: 'pending',
    appealReason: 'Appeal reason...',
    appealEvidence: [...],
    appealSubmittedAt: '2024-02-20T10:00:00.000Z',
    createdBy: { ... },
    emailSentAt: '2024-02-15T10:00:00.000Z',
    createdAt: '2024-02-15T10:00:00.000Z'
  }
}
```

### 4. Get My Expulsion (Student)

**Endpoint:** `GET /students/expulsions/me`

**Authentication:** Required (Student role only)

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    reason: 'Detailed reason...',
    reasonType: 'low_gpa',
    effectiveDate: '2024-03-01T00:00:00.000Z',
    attachments: [...],
    status: 'active',
    appealStatus: 'none',
    createdBy: {
      _id: 'admin_id',
      name: 'Admin Name',
      email: 'admin@example.com'
    },
    createdAt: '2024-02-15T10:00:00.000Z'
  }
}
```

**Response (404 Not Found):**
```javascript
{
  success: false,
  message: 'Không tìm thấy quyết định đuổi học'
}
```

### 5. Submit Appeal

**Endpoint:** `PUT /students/expulsions/:id/appeal`

**Authentication:** Required (Student role only, must be the expelled student)

**Request Body:**
```javascript
{
  appealReason: 'string',        // required, 20-2000 chars
  evidence: [File]               // optional
}
```

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    appealStatus: 'pending',
    appealReason: 'Appeal reason...',
    appealEvidence: [...],
    appealSubmittedAt: '2024-02-20T10:00:00.000Z'
  },
  message: 'Đơn khiếu nại đã được gửi thành công'
}
```

**Error Responses:**
- 400: Appeal already submitted or validation errors
- 403: Not the expelled student
- 404: Expulsion record not found

### 6. Approve Appeal

**Endpoint:** `PUT /admin/expulsions/:id/approve-appeal`

**Authentication:** Required (Admin role only)

**Request Body:**
```javascript
{
  reviewNote: 'string'           // optional, max 1000 chars
}
```

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    status: 'revoked',
    appealStatus: 'approved',
    appealReviewedBy: 'admin_id',
    appealReviewedAt: '2024-02-25T10:00:00.000Z',
    appealReviewNote: 'Review note...'
  },
  message: 'Đơn khiếu nại đã được chấp nhận'
}
```

**Error Responses:**
- 400: Appeal not in pending status
- 403: Not authorized
- 404: Expulsion record not found

### 7. Reject Appeal

**Endpoint:** `PUT /admin/expulsions/:id/reject-appeal`

**Authentication:** Required (Admin role only)

**Request Body:**
```javascript
{
  reviewNote: 'string'           // required, max 1000 chars
}
```

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    _id: 'expulsion_id',
    appealStatus: 'rejected',
    appealReviewedBy: 'admin_id',
    appealReviewedAt: '2024-02-25T10:00:00.000Z',
    appealReviewNote: 'Review note...'
  },
  message: 'Đơn khiếu nại đã bị từ chối'
}
```

### 8. Get Warning List

**Endpoint:** `GET /admin/warnings`

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `type` (optional): Filter by type (academic, attendance)
- `level` (optional): Filter by level (1, 2, 3 for academic; warning, critical for attendance)
- `studentId` (optional): Filter by student
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    academicWarnings: [...],
    attendanceWarnings: [...]
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 30,
    totalPages: 2
  }
}
```

### 9. Get My Warnings (Student)

**Endpoint:** `GET /students/warnings/me`

**Authentication:** Required (Student role only)

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    academicWarnings: [
      {
        _id: 'warning_id',
        warningType: 'low_gpa',
        warningLevel: 2,
        gpa: 3.5,
        threshold: 4.0,
        semester: '2023-2024-1',
        createdAt: '2024-01-15T10:00:00.000Z'
      }
    ],
    attendanceWarnings: [
      {
        _id: 'warning_id',
        classId: {
          _id: 'class_id',
          name: 'Class Name'
        },
        absenceRate: 25,
        totalSessions: 20,
        absentSessions: 5,
        warningLevel: 'warning',
        createdAt: '2024-02-01T10:00:00.000Z'
      }
    ]
  }
}
```

### 10. Report Violation (Teacher)

**Endpoint:** `POST /teachers/violations`

**Authentication:** Required (Teacher role only)

**Request Body:**
```javascript
{
  studentId: 'string',
  description: 'string',         // 20-2000 chars
  evidence: [File]               // optional
}
```

**Response (201 Created):**
```javascript
{
  success: true,
  data: {
    _id: 'violation_id',
    studentId: 'student_id',
    reportedBy: 'teacher_id',
    description: 'Violation description...',
    evidence: [...],
    status: 'pending',
    createdAt: '2024-02-15T10:00:00.000Z'
  },
  message: 'Báo cáo vi phạm đã được gửi thành công'
}
```

### 11. Get Violation List (Admin)

**Endpoint:** `GET /admin/violations`

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `status` (optional): Filter by status
- `studentId` (optional): Filter by student
- `page` (optional): Page number, default 1
- `limit` (optional): Items per page, default 20

**Response (200 OK):**
```javascript
{
  success: true,
  data: [
    {
      _id: 'violation_id',
      studentId: { ... },
      reportedBy: { ... },
      description: 'Violation description...',
      evidence: [...],
      status: 'pending',
      createdAt: '2024-02-15T10:00:00.000Z'
    }
  ],
  pagination: { ... }
}
```

### 12. Get Expulsion Statistics

**Endpoint:** `GET /admin/statistics/expulsions`

**Authentication:** Required (Admin role only)

**Query Parameters:**
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date

**Response (200 OK):**
```javascript
{
  success: true,
  data: {
    countByReasonType: {
      low_gpa: 15,
      discipline_violation: 8,
      excessive_absence: 12,
      expired_leave: 5
    },
    countBySemester: {
      '2023-2024-1': 20,
      '2023-2024-2': 20
    },
    appealSuccessRate: 0.25,      // 25%
    warningToExpulsionRate: 0.15  // 15%
  }
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

**Consolidation 1: Enum Validation Properties**
- Properties 1.2, 1.4, 1.5, 2.2, 2.3, 3.5 all test enum validation
- These can be combined into comprehensive enum validation properties per model

**Consolidation 2: Range Validation Properties**
- Properties 2.4, 2.5, 3.2, 3.3 all test numeric range validation
- These can be combined into range validation properties per model

**Consolidation 3: Expulsion Side Effects**
- Properties 5.1, 7.2, 8.2, 9.1 all test side effects of creating expulsion
- These can be combined into a comprehensive "expulsion creates all side effects" property

**Consolidation 4: Appeal Approval Restoration**
- Properties 15.1, 15.2, 15.3, 15.4 all test restoration after appeal approval
- These can be combined into a comprehensive "appeal approval restores access" property

**Consolidation 5: Authorization Properties**
- Properties 19.1, 19.2, 19.3, 20.1, 20.2, 20.3 all test access control
- These can be grouped into role-based authorization properties

**Consolidation 6: Notification Properties**
- Properties 6.1, 10.4, 11.3, 11.4, 12.3, 13.3, 14.5, 18.2 all test notifications
- These can be grouped by event type

**Consolidation 7: Data Preservation Properties**
- Properties 7.3, 8.4, 9.2, 15.5 all test that historical data is preserved
- These can be combined into a comprehensive "expulsion preserves historical data" property

After consolidation, the following unique properties remain:

### Property 1: Expulsion Record Serialization Round Trip

*For any* valid ExpulsionRecord object, serializing to JSON then deserializing SHALL produce an equivalent object with all fields preserved.

**Validates: Requirements 1.6**

### Property 2: ExpulsionRecord Enum Validation

*For any* ExpulsionRecord creation attempt, the system SHALL accept only valid enum values for reasonType (low_gpa, discipline_violation, excessive_absence, expired_leave), status (pending, active, appealed, revoked), and appealStatus (none, pending, approved, rejected), and SHALL reject all other values.

**Validates: Requirements 1.2, 1.4, 1.5**

### Property 3: ExpulsionRecord Date Validation

*For any* ExpulsionRecord creation attempt with effectiveDate in the past, the system SHALL reject the creation and return a validation error.

**Validates: Requirements 1.3**

### Property 4: AcademicWarning Field Validation

*For any* AcademicWarning creation attempt, the system SHALL validate that warningType is one of [low_gpa, probation], warningLevel is one of [1, 2, 3], gpa is between 0.0 and 10.0, threshold is between 0.0 and 10.0, and gpa < threshold.

**Validates: Requirements 2.2, 2.3, 2.4, 2.5, 2.6**

### Property 5: AttendanceWarning Field Validation

*For any* AttendanceWarning creation attempt, the system SHALL validate that absenceRate is between 0 and 100, totalSessions > 0, absentSessions <= totalSessions, and warningLevel is one of [warning, critical].

**Validates: Requirements 3.2, 3.3, 3.4, 3.5**

### Property 6: AttendanceWarning Absence Rate Invariant

*For any* AttendanceWarning object, the absenceRate field SHALL always equal (absentSessions / totalSessions) * 100, maintaining this invariant throughout the object's lifecycle.

**Validates: Requirements 3.6**

### Property 7: Expulsion Creation Updates Student Status

*For any* valid expulsion creation by an admin, the system SHALL create an ExpulsionRecord with status "active" AND update the student's status to "dismissed" atomically.

**Validates: Requirements 4.1, 4.2**

### Property 8: Expulsion Creation Validation

*For any* expulsion creation attempt missing required fields (studentId, reason, reasonType, effectiveDate, createdBy), the system SHALL return a validation error and SHALL NOT create any record.

**Validates: Requirements 4.3**

### Property 9: Expulsion Attachment Storage

*For any* expulsion creation with attachments provided, the system SHALL store all file references in the ExpulsionRecord.attachments array with filename, path, and uploadedAt fields.

**Validates: Requirements 4.5**

### Property 10: Expulsion Creator Recording

*For any* expulsion creation, the system SHALL record the admin's userId in the createdBy field.

**Validates: Requirements 4.6**

### Property 11: Expulsion Triggers All Side Effects

*For any* ExpulsionRecord created with status "active", the system SHALL atomically: (1) invalidate all active sessions, (2) cancel all future schedules, (3) lock all pending assignments, (4) add DISMISSED marker to gradebook entries, and (5) send email notification.

**Validates: Requirements 5.1, 6.1, 7.2, 8.2, 9.1**

### Property 12: Expelled Student Login Prevention

*For any* student with status "dismissed", login attempts SHALL return error "Account has been dismissed".

**Validates: Requirements 5.2**

### Property 13: Expulsion Email Content

*For any* expulsion notification email sent, the email SHALL contain the reason, effectiveDate, and appeal instructions.

**Validates: Requirements 6.2**

### Property 14: Email Timestamp Recording

*For any* expulsion with email successfully sent, the system SHALL record the timestamp in the emailSentAt field.

**Validates: Requirements 6.4**

### Property 15: Future Schedule Identification

*For any* expulsion with effectiveDate D, the system SHALL identify all schedules with startDate >= D as future schedules.

**Validates: Requirements 7.1**

### Property 16: Expulsion Preserves Historical Data

*For any* expulsion creation, the system SHALL preserve all historical attendance records, existing assignment submissions made before effectiveDate, and existing grade data without modification.

**Validates: Requirements 7.3, 8.4, 9.2**

### Property 17: Expelled Student Removed From Future Rosters

*For any* expulsion, the system SHALL remove the student from class rosters for all sessions with date >= effectiveDate.

**Validates: Requirements 7.4**

### Property 18: Pending Assignment Identification

*For any* expulsion with effectiveDate D, the system SHALL identify all assignments with deadline > D as pending assignments.

**Validates: Requirements 8.1**

### Property 19: Locked Assignment Submission Prevention

*For any* assignment locked due to expulsion, submission attempts by the expelled student SHALL return error "Submission not allowed".

**Validates: Requirements 8.3**

### Property 20: Gradebook Dismissed Marker Display

*For any* expelled student, when a teacher views the gradebook, the system SHALL display "DISMISSED" status for that student.

**Validates: Requirements 9.3**

### Property 21: Grade Modification Prevention After Expulsion

*For any* expelled student, grade modification attempts after effectiveDate SHALL be rejected.

**Validates: Requirements 9.4**

### Property 22: Academic Warning Level 1 Creation

*For any* student with GPA < 4.0 in a semester (first occurrence), the system SHALL create an AcademicWarning with warningLevel 1.

**Validates: Requirements 10.1**

### Property 23: Academic Warning Level 2 Creation

*For any* student with GPA < 4.0 for 2 consecutive semesters, the system SHALL create an AcademicWarning with warningLevel 2.

**Validates: Requirements 10.2**

### Property 24: Academic Warning Level 3 Creation

*For any* student with GPA < 4.0 for 3 consecutive semesters, the system SHALL create an AcademicWarning with warningLevel 3.

**Validates: Requirements 10.3**

### Property 25: Academic Warning Notifications

*For any* AcademicWarning created, the system SHALL send notifications to Student, Teacher, and Admin.

**Validates: Requirements 10.4**

### Property 26: GPA Calculation

*For any* student in a semester, the system SHALL calculate GPA based on all completed courses in that semester.

**Validates: Requirements 10.5**

### Property 27: Attendance Warning Creation at 20%

*For any* student with absenceRate > 20% in a class, the system SHALL create an AttendanceWarning with warningLevel "warning".

**Validates: Requirements 11.1**

### Property 28: Attendance Warning Creation at 30%

*For any* student with absenceRate > 30% in a class, the system SHALL create an AttendanceWarning with warningLevel "critical".

**Validates: Requirements 11.2**

### Property 29: Attendance Warning Notifications

*For any* AttendanceWarning with warningLevel "warning", the system SHALL notify Student and Teacher. *For any* AttendanceWarning with warningLevel "critical", the system SHALL notify Student, Teacher, and Admin.

**Validates: Requirements 11.3, 11.4**

### Property 30: Absence Rate Recalculation

*For any* attendance record update, the system SHALL recalculate the absence rate for the affected student and class.

**Validates: Requirements 11.5**

### Property 31: Appeal Submission Updates Status

*For any* expelled student submitting an appeal with valid reason and evidence, the system SHALL update the ExpulsionRecord.appealStatus to "pending" and store the appeal data.

**Validates: Requirements 12.1, 12.2**

### Property 32: Appeal Submission Notification

*For any* appeal submitted, the system SHALL notify the Admin.

**Validates: Requirements 12.3**

### Property 33: Duplicate Appeal Prevention

*For any* ExpulsionRecord with appealStatus "pending", subsequent appeal submission attempts SHALL return error "Appeal already submitted".

**Validates: Requirements 12.4**

### Property 34: Appeal Evidence Storage

*For any* appeal submission with evidence attachments, the system SHALL store all file references in the appealEvidence array.

**Validates: Requirements 12.5**

### Property 35: Appeal Rejection Updates Status

*For any* appeal rejection by admin with justification, the system SHALL update appealStatus to "rejected", keep student status as "dismissed", send notification with rejection reason, and record rejection timestamp and admin userId.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4**

### Property 36: Appeal Approval Updates All Statuses

*For any* appeal approval by admin, the system SHALL update appealStatus to "approved", update ExpulsionRecord.status to "revoked", update student status to "active", and record approval timestamp and admin userId.

**Validates: Requirements 14.1, 14.2, 14.3, 14.6**

### Property 37: Appeal Approval Restores Full Access

*For any* approved appeal, the system SHALL restore student login access, unlock previously locked assignments, restore student to class rosters, remove DISMISSED markers from gradebook, and send notification to student.

**Validates: Requirements 14.4, 14.5, 15.1, 15.2, 15.3, 15.4**

### Property 38: Appeal Approval Does Not Restore Past Attendance

*For any* approved appeal, the system SHALL NOT restore cancelled attendance records for past sessions.

**Validates: Requirements 15.5**

### Property 39: Expulsion List Returns All Records

*For any* admin request for expulsion list, the system SHALL return all ExpulsionRecord entries with populated student information (name, studentId, email).

**Validates: Requirements 16.1, 16.4**

### Property 40: Expulsion List Filtering

*For any* expulsion list request with filters (status, reasonType, date range), the system SHALL return only records matching all specified filters.

**Validates: Requirements 16.2**

### Property 41: Expulsion List Sorting

*For any* expulsion list request with sort parameters (effectiveDate or createdAt), the system SHALL return records sorted by the specified field.

**Validates: Requirements 16.3**

### Property 42: Expulsion List Pagination

*For any* expulsion list request with pagination parameters (page, limit), the system SHALL return the correct page of results with accurate pagination metadata.

**Validates: Requirements 16.5**

### Property 43: Warning List Returns All Warnings

*For any* admin request for warning list, the system SHALL return all AcademicWarning and AttendanceWarning entries with populated student information.

**Validates: Requirements 17.1, 17.4**

### Property 44: Warning List Filtering

*For any* warning list request with filters (warningType, warningLevel, date range), the system SHALL return only warnings matching all specified filters.

**Validates: Requirements 17.2**

### Property 45: Warning List Sorting

*For any* warning list request with sort parameters (createdAt, gpa, absenceRate), the system SHALL return warnings sorted by the specified field.

**Validates: Requirements 17.3**

### Property 46: Violation Report Creation

*For any* teacher submitting a violation report with studentId and description, the system SHALL create a ViolationReport record, notify admin, store evidence if provided, and record the teacher's userId as reporter.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4**

### Property 47: Violation Report Conversion

*For any* violation report, the system SHALL allow admin to convert it to an ExpulsionRecord.

**Validates: Requirements 18.5**

### Property 48: Expulsion Creation Authorization

*For any* non-admin user attempting to create an ExpulsionRecord, the system SHALL return error "Unauthorized".

**Validates: Requirements 19.1**

### Property 49: Appeal Processing Authorization

*For any* non-admin user attempting to approve or reject an appeal, the system SHALL return error "Unauthorized".

**Validates: Requirements 19.2**

### Property 50: Expulsion List View Authorization

*For any* teacher attempting to view the expulsion list, the system SHALL return error "Unauthorized".

**Validates: Requirements 19.3**

### Property 51: Admin Full Access

*For any* admin user, the system SHALL allow all expulsion-related actions (create, view, approve appeal, reject appeal).

**Validates: Requirements 19.4**

### Property 52: Expulsion Action Audit Logging

*For any* expulsion-related action, the system SHALL log the action with userId and timestamp.

**Validates: Requirements 19.5**

### Property 53: Expelled Student Resource Access Prevention

*For any* expelled student attempting to access protected resources (classes, assignments, materials), the system SHALL return appropriate error messages ("Account dismissed", "Submission not allowed", "Access denied").

**Validates: Requirements 20.1, 20.2, 20.3**

### Property 54: Expelled Student Limited Access

*For any* expelled student, the system SHALL allow access to view expulsion details, submit appeal, and download academic records.

**Validates: Requirements 20.4, 20.5**

### Property 55: Expulsion Statistics Calculation

*For any* admin request for expulsion statistics with optional date range, the system SHALL return count by reasonType, count by semester, appeal success rate, and warning-to-expulsion conversion rate.

**Validates: Requirements 21.1, 21.2, 21.3, 21.4, 21.5**

### Property 56: Expulsion Audit Trail Logging

*For any* ExpulsionRecord creation or modification, appeal status change, or student status change, the system SHALL log the action with timestamp, userId, and reference to ExpulsionRecord.

**Validates: Requirements 22.1, 22.2, 22.3**

### Property 57: Audit Trail Immutability

*For any* ExpulsionRecord, the system SHALL preserve all historical data and prevent deletion.

**Validates: Requirements 22.4**

### Property 58: Audit Trail Accessibility

*For any* ExpulsionRecord, the system SHALL allow admin to view the complete audit trail.

**Validates: Requirements 22.5**

### Property 59: Validation Error Messages

*For any* invalid data submission, the system SHALL return descriptive error messages indicating the specific validation failures.

**Validates: Requirements 23.1**

### Property 60: Date Format Validation

*For any* date field submission, the system SHALL validate that the date is in ISO 8601 format.

**Validates: Requirements 23.4**

### Property 61: Input Sanitization

*For any* text input submission, the system SHALL sanitize the input to prevent injection attacks.

**Validates: Requirements 23.5**

### Property 62: Concurrent Operation Safety

*For any* concurrent expulsion operations on different students, the system SHALL handle them without data corruption.

**Validates: Requirements 24.4**


## Error Handling

### Validation Errors

**Format:**
```javascript
{
  success: false,
  message: 'Validation failed',
  errors: {
    effectiveDate: 'effectiveDate cannot be in the past',
    reasonType: 'reasonType must be one of: low_gpa, discipline_violation, excessive_absence, expired_leave'
  }
}
```

**Common Validation Errors:**
- Missing required fields (studentId, reason, reasonType, effectiveDate, createdBy)
- Invalid enum values (reasonType, status, appealStatus, warningType, warningLevel)
- Invalid date formats (not ISO 8601)
- Past dates for effectiveDate
- Invalid numeric ranges (gpa, threshold, absenceRate, totalSessions, absentSessions)
- Text length violations (reason: 20-2000 chars, notes: max 1000 chars)
- Relationship violations (gpa >= threshold, absentSessions > totalSessions)

### Business Logic Errors

**Format:**
```javascript
{
  success: false,
  message: 'Business rule violation message'
}
```

**Common Business Logic Errors:**
- Student not found
- Student already dismissed
- Appeal already submitted
- Appeal not in pending status
- Expulsion record not found
- Violation report not found
- Duplicate warning for same semester/class

### Authorization Errors

**Format:**
```javascript
{
  success: false,
  message: 'Unauthorized'
}
```

**Authorization Scenarios:**
- Non-admin attempting to create expulsion
- Non-admin attempting to process appeal
- Teacher attempting to view expulsion list
- Non-teacher attempting to report violation
- Student attempting to access another student's expulsion
- Expelled student attempting to access protected resources

### System Errors

**Format:**
```javascript
{
  success: false,
  message: 'Internal server error',
  error: 'Detailed error message for logging'
}
```

**Error Handling Strategies:**

1. **Database Transaction Rollback:**
   - If any step in expulsion creation fails, rollback all changes
   - Use MongoDB transactions for atomic operations
   - Ensure student status, enrollments, assignments, and gradebook are updated atomically

2. **Email Service Failures:**
   - Log email failures but continue processing
   - Queue failed emails for retry
   - Don't block expulsion creation if email fails
   - Record email attempt in database

3. **File Upload Failures:**
   - Validate file types and sizes before upload
   - Clean up partial uploads on failure
   - Return descriptive error messages
   - Support retry mechanism

4. **Concurrent Operation Handling:**
   - Use optimistic locking for concurrent updates
   - Detect and handle race conditions
   - Return appropriate error messages for conflicts

5. **External Service Failures:**
   - Implement circuit breaker pattern
   - Provide fallback mechanisms
   - Log all external service errors
   - Return user-friendly error messages

## Testing Strategy

### Unit Tests

**Model Tests:**
1. ExpulsionRecord schema validation
   - Test enum validation for reasonType, status, appealStatus
   - Test date validation (effectiveDate not in past)
   - Test required field validation
   - Test text length validation
   - Test serialization/deserialization

2. AcademicWarning schema validation
   - Test enum validation for warningType, warningLevel
   - Test numeric range validation (gpa, threshold)
   - Test relationship validation (gpa < threshold)
   - Test required field validation

3. AttendanceWarning schema validation
   - Test enum validation for warningLevel
   - Test numeric range validation (absenceRate, totalSessions, absentSessions)
   - Test relationship validation (absentSessions <= totalSessions)
   - Test absence rate calculation invariant

4. ViolationReport schema validation
   - Test enum validation for status
   - Test required field validation
   - Test text length validation

**Service Tests:**
1. ExpulsionService
   - createExpulsion with valid data
   - createExpulsion with invalid data (should throw)
   - createExpulsion updates student status
   - terminateStudentSessions removes all sessions
   - cancelFutureSchedules only cancels future schedules
   - lockPendingAssignments only locks future assignments
   - markGradebook adds DISMISSED marker

2. WarningService
   - checkAcademicWarning creates warning when GPA < 4.0
   - checkAcademicWarning escalates warning level correctly
   - checkAttendanceWarning creates warning at 20% threshold
   - checkAttendanceWarning creates critical warning at 30% threshold
   - calculateGPA returns correct value
   - calculateAbsenceRate returns correct percentage

3. AppealService
   - submitAppeal updates appealStatus to pending
   - submitAppeal prevents duplicate appeals
   - approveAppeal updates all statuses correctly
   - approveAppeal restores student access
   - rejectAppeal keeps student dismissed
   - restoreStudentAccess unlocks assignments
   - restoreStudentAccess restores class rosters
   - restoreStudentAccess removes DISMISSED markers

4. EmailService
   - sendExpulsionNotification includes required fields
   - sendAcademicWarningEmail sends to correct recipients
   - sendAttendanceWarningEmail sends to correct recipients
   - sendAppealApprovedNotification sends to student
   - sendAppealRejectedNotification includes reason
   - Email failures are logged and don't throw

**Controller Tests:**
1. ExpulsionController
   - POST /admin/expulsions with valid data returns 201
   - POST /admin/expulsions with invalid data returns 400
   - POST /admin/expulsions by non-admin returns 403
   - GET /admin/expulsions returns paginated list
   - GET /admin/expulsions with filters returns filtered results
   - PUT /students/expulsions/:id/appeal updates status
   - PUT /admin/expulsions/:id/approve-appeal restores access
   - PUT /admin/expulsions/:id/reject-appeal keeps dismissed

2. WarningController
   - GET /admin/warnings returns all warnings
   - GET /students/warnings/me returns only my warnings
   - GET /teachers/warnings/class/:classId returns class warnings

3. ViolationController
   - POST /teachers/violations creates report
   - POST /teachers/violations by non-teacher returns 403
   - GET /admin/violations returns all reports
   - PUT /admin/violations/:id/convert creates expulsion

4. StatisticsController
   - GET /admin/statistics/expulsions returns correct counts
   - GET /admin/statistics/expulsions with date range filters correctly

### Property-Based Tests

**Configuration:**
- Use fast-check library for JavaScript/Node.js
- Minimum 100 iterations per property test
- Tag each test with feature name and property number

**Property Test Examples:**

```javascript
// Property 1: Expulsion Record Serialization Round Trip
// Feature: student-expulsion-management, Property 1
test('ExpulsionRecord serialization round trip', () => {
  fc.assert(
    fc.property(
      expulsionRecordArbitrary(),
      (record) => {
        const json = JSON.stringify(record);
        const deserialized = JSON.parse(json);
        expect(deserialized).toEqual(record);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 2: ExpulsionRecord Enum Validation
// Feature: student-expulsion-management, Property 2
test('ExpulsionRecord rejects invalid enum values', () => {
  fc.assert(
    fc.property(
      fc.string(),
      fc.string(),
      fc.string(),
      (reasonType, status, appealStatus) => {
        fc.pre(!validReasonTypes.includes(reasonType) || 
               !validStatuses.includes(status) || 
               !validAppealStatuses.includes(appealStatus));
        
        expect(() => {
          new ExpulsionRecord({ reasonType, status, appealStatus });
        }).toThrow();
      }
    ),
    { numRuns: 100 }
  );
});

// Property 6: AttendanceWarning Absence Rate Invariant
// Feature: student-expulsion-management, Property 6
test('AttendanceWarning maintains absence rate invariant', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 100 }),
      fc.integer({ min: 0, max: 100 }),
      (totalSessions, absentSessions) => {
        fc.pre(absentSessions <= totalSessions);
        
        const absenceRate = (absentSessions / totalSessions) * 100;
        const warning = new AttendanceWarning({
          totalSessions,
          absentSessions,
          absenceRate
        });
        
        const calculatedRate = (warning.absentSessions / warning.totalSessions) * 100;
        expect(Math.abs(warning.absenceRate - calculatedRate)).toBeLessThan(0.01);
      }
    ),
    { numRuns: 100 }
  );
});

// Property 11: Expulsion Triggers All Side Effects
// Feature: student-expulsion-management, Property 11
test('Expulsion triggers all side effects atomically', async () => {
  fc.assert(
    fc.asyncProperty(
      validExpulsionDataArbitrary(),
      async (expulsionData) => {
        const result = await expulsionService.createExpulsion(adminId, expulsionData);
        
        // Check all side effects occurred
        const student = await User.findById(expulsionData.studentId);
        expect(student.status).toBe('dismissed');
        
        const sessions = await Session.find({ userId: expulsionData.studentId, active: true });
        expect(sessions).toHaveLength(0);
        
        const futureSchedules = await Schedule.find({
          studentId: expulsionData.studentId,
          startDate: { $gte: expulsionData.effectiveDate }
        });
        expect(futureSchedules.every(s => s.cancelled)).toBe(true);
        
        const pendingAssignments = await Assignment.find({
          'lockedStudents.studentId': expulsionData.studentId
        });
        expect(pendingAssignments.length).toBeGreaterThan(0);
        
        const gradebooks = await Gradebook.find({
          studentId: expulsionData.studentId,
          'dismissedMarker.isDismissed': true
        });
        expect(gradebooks.length).toBeGreaterThan(0);
        
        expect(result.emailSentAt).toBeDefined();
      }
    ),
    { numRuns: 100 }
  );
});

// Property 33: Duplicate Appeal Prevention
// Feature: student-expulsion-management, Property 33
test('System prevents duplicate appeal submissions', async () => {
  fc.assert(
    fc.asyncProperty(
      validAppealDataArbitrary(),
      async (appealData) => {
        const expulsion = await createExpulsionWithPendingAppeal();
        
        await expect(
          appealService.submitAppeal(studentId, expulsion._id, appealData)
        ).rejects.toThrow('Appeal already submitted');
      }
    ),
    { numRuns: 100 }
  );
});

// Property 62: Concurrent Operation Safety
// Feature: student-expulsion-management, Property 62
test('System handles concurrent expulsions safely', async () => {
  fc.assert(
    fc.asyncProperty(
      fc.array(validExpulsionDataArbitrary(), { minLength: 2, maxLength: 10 }),
      async (expulsionDataArray) => {
        // Ensure different students
        const uniqueStudents = new Set(expulsionDataArray.map(d => d.studentId));
        fc.pre(uniqueStudents.size === expulsionDataArray.length);
        
        // Create expulsions concurrently
        const promises = expulsionDataArray.map(data =>
          expulsionService.createExpulsion(adminId, data)
        );
        
        const results = await Promise.all(promises);
        
        // Verify all succeeded and data is consistent
        expect(results).toHaveLength(expulsionDataArray.length);
        results.forEach((result, index) => {
          expect(result.studentId).toBe(expulsionDataArray[index].studentId);
          expect(result.status).toBe('active');
        });
      }
    ),
    { numRuns: 100 }
  );
});
```

**Arbitrary Generators:**

```javascript
// Generator for valid ExpulsionRecord data
const expulsionRecordArbitrary = () => fc.record({
  studentId: fc.string(),
  reason: fc.string({ minLength: 20, maxLength: 2000 }),
  reasonType: fc.constantFrom('low_gpa', 'discipline_violation', 'excessive_absence', 'expired_leave'),
  effectiveDate: fc.date({ min: new Date() }),
  status: fc.constantFrom('pending', 'active', 'appealed', 'revoked'),
  appealStatus: fc.constantFrom('none', 'pending', 'approved', 'rejected'),
  createdBy: fc.string()
});

// Generator for valid AcademicWarning data
const academicWarningArbitrary = () => fc.record({
  studentId: fc.string(),
  warningType: fc.constantFrom('low_gpa', 'probation'),
  warningLevel: fc.constantFrom(1, 2, 3),
  gpa: fc.float({ min: 0.0, max: 3.9 }),
  threshold: fc.constant(4.0),
  semester: fc.string()
});

// Generator for valid AttendanceWarning data
const attendanceWarningArbitrary = () => fc.tuple(
  fc.integer({ min: 1, max: 100 }),
  fc.integer({ min: 0, max: 100 })
).chain(([total, absent]) => {
  const validAbsent = Math.min(absent, total);
  return fc.record({
    studentId: fc.string(),
    classId: fc.string(),
    totalSessions: fc.constant(total),
    absentSessions: fc.constant(validAbsent),
    absenceRate: fc.constant((validAbsent / total) * 100),
    warningLevel: fc.constantFrom('warning', 'critical')
  });
});
```

### Integration Tests

1. **Complete Expulsion Flow:**
   - Admin creates expulsion
   - Verify student status updated
   - Verify sessions terminated
   - Verify schedules cancelled
   - Verify assignments locked
   - Verify gradebook marked
   - Verify email sent

2. **Complete Appeal Flow:**
   - Student submits appeal
   - Verify appeal status updated
   - Verify admin notified
   - Admin approves appeal
   - Verify student status restored
   - Verify access restored
   - Verify assignments unlocked
   - Verify gradebook unmarked

3. **Warning to Expulsion Flow:**
   - Create academic warnings (level 1, 2, 3)
   - Admin creates expulsion based on warnings
   - Verify statistics updated

4. **Violation Report Flow:**
   - Teacher reports violation
   - Admin views violation
   - Admin converts to expulsion
   - Verify expulsion created with reference

### Frontend Tests

1. **Component Tests:**
   - ExpulsionForm validation
   - ExpulsionForm submission
   - WarningsList rendering
   - AppealModal submission
   - ViolationReportForm validation

2. **Integration Tests:**
   - Admin creates expulsion flow
   - Student views expulsion and submits appeal
   - Admin processes appeal
   - Teacher reports violation

3. **E2E Tests:**
   - Complete expulsion lifecycle
   - Complete appeal lifecycle
   - Warning generation and display

## Security Considerations

### Authentication
- All endpoints require valid JWT token
- Token expiration: 24 hours
- Refresh token mechanism for long sessions

### Authorization
- Role-based access control (RBAC)
- Admin: full access to all expulsion operations
- Teacher: can report violations, view class warnings
- Student: can view own expulsion, submit appeal, view own warnings
- Expelled students: limited access (view expulsion, submit appeal, download records)

### Input Validation
- Sanitize all text inputs to prevent XSS
- Validate file uploads (type, size, content)
- Validate date formats (ISO 8601)
- Validate enum values
- Validate numeric ranges

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Sanitize error messages (don't expose internal details)
- Log security events (failed auth, unauthorized access)

### File Upload Security
- Validate file types (whitelist: pdf, doc, docx, jpg, png)
- Limit file size (max 10MB per file)
- Scan files for malware
- Store files outside web root
- Generate unique filenames to prevent overwriting

### Rate Limiting
- Limit expulsion creation: 10 per hour per admin
- Limit appeal submission: 1 per expulsion
- Limit violation reports: 20 per hour per teacher
- Limit API requests: 100 per minute per user

### Audit Trail
- Log all expulsion operations with userId and timestamp
- Log all appeal operations
- Log all status changes
- Preserve all historical data (no deletion)
- Implement audit log viewing for admins

## Performance Considerations

### Database Indexes

```javascript
// ExpulsionRecord indexes
expulsionRecordSchema.index({ studentId: 1, status: 1 });
expulsionRecordSchema.index({ status: 1, createdAt: -1 });
expulsionRecordSchema.index({ reasonType: 1, effectiveDate: 1 });
expulsionRecordSchema.index({ appealStatus: 1, appealSubmittedAt: -1 });

// AcademicWarning indexes
academicWarningSchema.index({ studentId: 1, semester: 1 });
academicWarningSchema.index({ warningLevel: 1, createdAt: -1 });
academicWarningSchema.index({ studentId: 1, warningLevel: 1, semester: 1 });

// AttendanceWarning indexes
attendanceWarningSchema.index({ studentId: 1, classId: 1 });
attendanceWarningSchema.index({ warningLevel: 1, createdAt: -1 });
attendanceWarningSchema.index({ classId: 1, warningLevel: 1 });

// ViolationReport indexes
violationReportSchema.index({ studentId: 1, status: 1 });
violationReportSchema.index({ reportedBy: 1, createdAt: -1 });
violationReportSchema.index({ status: 1, createdAt: -1 });

// User indexes (already exist)
userSchema.index({ status: 1 });
userSchema.index({ role: 1, status: 1 });
```

### Query Optimization

1. **Use .lean() for read-only queries:**
   ```javascript
   const expulsions = await ExpulsionRecord.find().lean();
   ```

2. **Populate only necessary fields:**
   ```javascript
   const expulsions = await ExpulsionRecord.find()
     .populate('studentId', 'name email studentCode')
     .populate('createdBy', 'name email');
   ```

3. **Implement pagination:**
   ```javascript
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 20;
   const skip = (page - 1) * limit;
   
   const expulsions = await ExpulsionRecord.find()
     .skip(skip)
     .limit(limit);
   ```

4. **Use aggregation for statistics:**
   ```javascript
   const stats = await ExpulsionRecord.aggregate([
     { $match: { effectiveDate: { $gte: startDate, $lte: endDate } } },
     { $group: { _id: '$reasonType', count: { $sum: 1 } } }
   ]);
   ```

### Caching Strategy

1. **Cache frequently accessed data:**
   - User status (Redis, TTL: 5 minutes)
   - Warning thresholds (Redis, TTL: 1 hour)
   - Statistics (Redis, TTL: 15 minutes)

2. **Invalidate cache on updates:**
   - Clear user status cache when status changes
   - Clear statistics cache when expulsion created

### Background Jobs

1. **Email Queue:**
   - Use Bull queue for email sending
   - Retry failed emails (max 3 attempts)
   - Process emails asynchronously

2. **Warning Generation:**
   - Run daily job to check GPA and absence rates
   - Generate warnings for students exceeding thresholds
   - Send notifications in batches

3. **Session Cleanup:**
   - Run hourly job to terminate expired sessions
   - Clean up sessions for dismissed students

### Performance Targets

- Expulsion creation: < 5 seconds (including all side effects)
- Expulsion list retrieval: < 2 seconds (with pagination)
- Warning generation: < 3 seconds per student
- Appeal processing: < 3 seconds
- Statistics calculation: < 5 seconds
- Support 100 concurrent users without degradation

## Deployment Checklist

- [ ] Create database indexes for all models
- [ ] Set up file upload directory with proper permissions
- [ ] Configure email service (SMTP credentials)
- [ ] Set up Redis for caching
- [ ] Set up Bull queue for background jobs
- [ ] Configure rate limiting middleware
- [ ] Set up monitoring and alerting
- [ ] Deploy backend API endpoints
- [ ] Deploy frontend components
- [ ] Run database migrations if needed
- [ ] Test email notifications in production
- [ ] Test file uploads in production
- [ ] Update API documentation
- [ ] Train admin users on expulsion workflow
- [ ] Train teachers on violation reporting
- [ ] Communicate feature to students
- [ ] Set up audit log viewing interface
- [ ] Configure backup and disaster recovery
- [ ] Perform load testing
- [ ] Perform security audit
- [ ] Document troubleshooting procedures

