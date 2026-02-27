# Design Document: Schedule-Based Attendance

## Overview

Hệ thống điểm danh tự động theo lịch học (Schedule-Based Attendance) mở rộng chức năng điểm danh hiện có bằng cách tích hợp validation dựa trên lịch học (Schedule). Thay vì cho phép giáo viên tạo attendance session bất kỳ lúc nào, hệ thống sẽ tự động kiểm tra:

1. Ngày hiện tại có khớp với dayOfWeek trong Schedule không
2. Thời gian hiện tại có nằm trong khoảng startTime-endTime của Schedule không
3. Chỉ cho phép điểm danh khi cả hai điều kiện trên được thỏa mãn

Hệ thống hiện tại đã có:
- AttendanceSession model để lưu các buổi điểm danh
- AttendanceRecord model để lưu bản ghi điểm danh của từng sinh viên
- QR code check-in mechanism
- Manual check-in by teacher

Những gì cần bổ sung:
- Schedule validation logic trước khi cho phép tạo session hoặc check-in
- API endpoints mới để validate schedule và time window
- UI components hiển thị thông báo khi không trong khung giờ học
- Dashboard statistics và charts cho teacher
- Attendance rate calculation algorithm

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Teacher Dashboard    │  Student Check-in  │  Class Detail   │
│  - Statistics Table   │  - Schedule Check  │  - Attendance   │
│  - Attendance Chart   │  - Time Validation │    Report       │
└──────────────┬──────────────────┬──────────────┬────────────┘
               │                  │              │
               ▼                  ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  /attendance/validate-schedule/:classId                      │
│  /attendance/sessions (enhanced with schedule validation)    │
│  /attendance/check-in (enhanced with schedule validation)    │
│  /attendance/statistics/:classId                             │
│  /attendance/rate/:classId                                   │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│  ScheduleValidator    │  AttendanceService                   │
│  - validateDayOfWeek  │  - createSession (with validation)   │
│  - validateTimeWindow │  - checkIn (with validation)         │
│  - getCurrentSchedule │  - calculateStatistics               │
│                       │  - calculateAttendanceRate           │
└──────────────┬──────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Schedule  │  AttendanceSession  │  AttendanceRecord         │
│  Class     │  Enrollment         │  Student                  │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Teacher creates attendance session:**
```
Teacher → Frontend → POST /attendance/sessions
                  ↓
            ScheduleValidator.validateDayOfWeek()
                  ↓
            ScheduleValidator.validateTimeWindow()
                  ↓
            AttendanceService.createSession()
                  ↓
            Save to AttendanceSession collection
```

**Student checks in:**
```
Student → Frontend → POST /attendance/check-in
                  ↓
            ScheduleValidator.getCurrentSchedule()
                  ↓
            ScheduleValidator.validateTimeWindow()
                  ↓
            AttendanceService.checkIn()
                  ↓
            Save to AttendanceRecord collection
```

**Teacher views statistics:**
```
Teacher → Frontend → GET /attendance/statistics/:classId
                  ↓
            AttendanceService.calculateStatistics()
                  ↓
            Query AttendanceSession + AttendanceRecord + Enrollment
                  ↓
            Return aggregated data
```

## Components and Interfaces

### Backend Components

#### 1. ScheduleValidator Service

**Purpose:** Validate schedule existence and time windows for attendance operations

**Location:** `backend/src/services/scheduleValidator.js`

**Methods:**

```javascript
class ScheduleValidator {
  /**
   * Get current schedule for a class on current day and time
   * @param {ObjectId} classId - Class ID
   * @returns {Promise<Schedule|null>} - Schedule if found and valid, null otherwise
   */
  async getCurrentSchedule(classId)

  /**
   * Validate if current day matches schedule
   * @param {ObjectId} classId - Class ID
   * @returns {Promise<{valid: boolean, schedule: Schedule|null, message: string}>}
   */
  async validateDayOfWeek(classId)

  /**
   * Validate if current time is within schedule window
   * @param {Schedule} schedule - Schedule object
   * @returns {boolean} - true if within window, false otherwise
   */
  validateTimeWindow(schedule)

  /**
   * Get day of week as number (0=Sunday, 1=Monday, ..., 6=Saturday)
   * @returns {number}
   */
  getCurrentDayOfWeek()

  /**
   * Get current time as HH:mm string
   * @returns {string}
   */
  getCurrentTime()

  /**
   * Compare two time strings (HH:mm format)
   * @param {string} time1
   * @param {string} time2
   * @returns {number} - negative if time1 < time2, 0 if equal, positive if time1 > time2
   */
  compareTime(time1, time2)
}
```

#### 2. Enhanced AttendanceController

**Purpose:** Add schedule validation to existing attendance operations

**Location:** `backend/src/controllers/attendanceController.js`

**New/Modified Methods:**

```javascript
/**
 * Validate schedule before creating session
 * Enhanced version of existing createSession
 */
export const createSession = async (req, res)

/**
 * Validate schedule before check-in
 * Enhanced version of existing checkIn
 */
export const checkIn = async (req, res)

/**
 * Get attendance statistics for a class
 * NEW endpoint
 */
export const getStatistics = async (req, res)

/**
 * Get attendance rate for dashboard chart
 * NEW endpoint
 */
export const getAttendanceRate = async (req, res)

/**
 * Validate current schedule for a class
 * NEW endpoint - returns schedule info and validation status
 */
export const validateSchedule = async (req, res)
```

#### 3. AttendanceService

**Purpose:** Business logic for attendance calculations

**Location:** `backend/src/services/attendanceService.js`

**Methods:**

```javascript
class AttendanceService {
  /**
   * Calculate attendance statistics for a class
   * @param {ObjectId} classId
   * @returns {Promise<{className: string, totalStudents: number, studentsAttended: number}[]>}
   */
  async calculateStatistics(classId)

  /**
   * Calculate attendance rate for a class
   * @param {ObjectId} classId
   * @returns {Promise<{classId: ObjectId, className: string, rate: number, attended: number, total: number}>}
   */
  async calculateAttendanceRate(classId)

  /**
   * Get attendance rate for all classes of a teacher
   * @param {ObjectId} teacherId
   * @returns {Promise<Array>}
   */
  async getTeacherClassesAttendanceRate(teacherId)
}
```

### Frontend Components

#### 1. AttendanceValidator Hook

**Purpose:** Client-side schedule validation before UI actions

**Location:** `frontend/src/hooks/useAttendanceValidator.js`

**Interface:**

```javascript
const useAttendanceValidator = (classId) => {
  return {
    isValidSchedule: boolean,
    scheduleInfo: {
      dayOfWeek: number,
      startTime: string,
      endTime: string,
      room: string
    } | null,
    errorMessage: string,
    loading: boolean,
    validateSchedule: () => Promise<void>
  }
}
```

#### 2. AttendanceStatistics Component

**Purpose:** Display attendance statistics table for teacher

**Location:** `frontend/src/components/AttendanceStatistics.js`

**Props:**

```javascript
{
  classId: string,
  refreshTrigger?: number
}
```

**Display:**
- Table with columns: Class name, Total students, Students attended
- Auto-refresh when new attendance records are created
- Loading state
- Error handling

#### 3. AttendanceRateChart Component

**Purpose:** Display attendance rate chart in teacher dashboard

**Location:** `frontend/src/components/AttendanceRateChart.js`

**Props:**

```javascript
{
  teacherId: string
}
```

**Display:**
- Bar chart or pie chart showing attendance rate per class
- Uses Chart.js or Recharts library
- Responsive design
- Tooltip showing detailed numbers

#### 4. Enhanced CheckIn Component

**Purpose:** Add schedule validation to existing check-in flow

**Location:** `frontend/src/pages/CheckIn.js` (modify existing)

**Enhancements:**
- Call validateSchedule API before showing check-in form
- Display "Hôm nay không có lịch học" if no schedule
- Display "Chưa đến giờ học" or "Đã hết giờ học" if outside time window
- Show schedule info (time, room) when valid

#### 5. Enhanced AttendanceQR Component

**Purpose:** Add schedule validation before generating QR code

**Location:** `frontend/src/pages/AttendanceQR.js` (modify existing)

**Enhancements:**
- Validate schedule before allowing code generation
- Display schedule info (day, time, room)
- Disable "Tạo mã điểm danh" button if outside time window
- Show countdown timer until class starts or ends

## Data Models

### Existing Models (No Changes Required)

#### Schedule Model
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: Class),
  dayOfWeek: Number, // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: String, // "HH:mm" format
  endTime: String,   // "HH:mm" format
  room: String,
  startDate: Date,
  endDate: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### AttendanceSession Model
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: Class),
  date: Date,
  shift: String,
  code: String,
  codeExpiredAt: Date,
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### AttendanceRecord Model
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId (ref: AttendanceSession),
  studentId: ObjectId (ref: User),
  status: String, // enum: ['present', 'absent', 'late']
  checkedAt: Date,
  checkInMethod: String, // enum: ['manual', 'qr']
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ sessionId: 1, studentId: 1 }` - unique constraint to prevent duplicate attendance

#### Class Model
```javascript
{
  _id: ObjectId,
  name: String,
  subjectId: ObjectId (ref: Subject),
  teacherId: ObjectId (ref: User),
  semester: String,
  year: String,
  status: String, // enum: ['active', 'closed', 'upcoming']
  maxStudents: Number,
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Enrollment Model
```javascript
{
  _id: ObjectId,
  classId: ObjectId (ref: Class),
  studentId: ObjectId (ref: User),
  enrolledAt: Date,
  isCompleted: Boolean,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `{ classId: 1, studentId: 1 }` - unique constraint

### Data Relationships

```
Class (1) ──────────── (N) Schedule
  │                         │
  │                         │ (used for validation)
  │                         ▼
  ├─────────────────► AttendanceSession (1) ──── (N) AttendanceRecord
  │                                                        │
  │                                                        │
  └─────────────────► Enrollment ──────────────────────► Student
                           │
                           └──────────────────────────────┘
```

### Query Patterns

**1. Get current schedule for a class:**
```javascript
Schedule.findOne({
  classId: classId,
  dayOfWeek: currentDayOfWeek,
  isDeleted: false,
  $or: [
    { startDate: { $exists: false } },
    { startDate: { $lte: currentDate } }
  ],
  $or: [
    { endDate: { $exists: false } },
    { endDate: { $gte: currentDate } }
  ]
})
```

**2. Get attendance statistics for today:**
```javascript
// Get today's sessions
const sessions = await AttendanceSession.find({
  classId: classId,
  date: { $gte: startOfDay, $lte: endOfDay },
  isDeleted: false
})

// Get total enrolled students
const totalStudents = await Enrollment.countDocuments({
  classId: classId
})

// Get students who attended
const attendedStudents = await AttendanceRecord.distinct('studentId', {
  sessionId: { $in: sessions.map(s => s._id) },
  status: 'present'
})
```

**3. Calculate attendance rate:**
```javascript
// Get all sessions for the class
const totalSessions = await AttendanceSession.countDocuments({
  classId: classId,
  isDeleted: false
})

// Get all attendance records
const attendanceRecords = await AttendanceRecord.countDocuments({
  sessionId: { $in: sessionIds },
  status: 'present'
})

// Get total enrolled students
const totalStudents = await Enrollment.countDocuments({
  classId: classId
})

// Calculate rate
const rate = (attendanceRecords / (totalSessions * totalStudents)) * 100
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Properties 5.2 and 3.1 both test that valid attendance creates a record (keep 3.1)
- Properties 5.3 and 1.4 both test rejection outside time window (keep 1.4)
- Properties 9.1 and 3.2 both test record structure (keep 3.2)
- Properties 9.5 and 3.3 both test uniqueness constraint (keep 3.3)
- Edge cases 2.2 and 2.3 can be combined with property 2.4 into a comprehensive time window validation property

The following properties provide unique validation value and will be implemented:

### Property 1: Schedule Existence Validation

*For any* class and any attendance attempt, the system should verify that a schedule exists for the current day of week before allowing attendance operations.

**Validates: Requirements 1.1**

### Property 2: Time Window Validation

*For any* schedule with startTime and endTime, the system should only allow attendance when current time is between startTime and endTime (inclusive), and should reject attendance when current time is before startTime or after endTime.

**Validates: Requirements 1.3, 1.4, 2.2, 2.3, 2.4**

### Property 3: Attendance Record Creation

*For any* student who successfully marks attendance within a valid schedule and time window, the system should create exactly one AttendanceRecord in the database.

**Validates: Requirements 3.1**

### Property 4: Attendance Record Structure

*For any* created AttendanceRecord, it should include all required fields: studentId, sessionId, status, checkedAt, and checkInMethod.

**Validates: Requirements 3.2**

### Property 5: Duplicate Attendance Prevention

*For any* student and session, attempting to create a second AttendanceRecord for the same sessionId and studentId should be rejected by the unique constraint.

**Validates: Requirements 3.3**

### Property 6: Default Status Value

*For any* newly created AttendanceRecord through the check-in process, the status field should be set to "present".

**Validates: Requirements 3.4**

### Property 7: Timestamp Accuracy

*For any* AttendanceRecord created through check-in, the checkedAt timestamp should be set to the current time (within a reasonable delta of a few seconds).

**Validates: Requirements 3.5**

### Property 8: Total Students Count Accuracy

*For any* class, the "Total students" statistic should equal the count of Enrollment records for that class.

**Validates: Requirements 4.3**

### Property 9: Students Attended Count Accuracy

*For any* class and date, the "Students attended" statistic should equal the count of distinct studentIds in AttendanceRecord entries for that class's sessions on that date with status "present".

**Validates: Requirements 4.4**

### Property 10: Schedule-Based UI Display

*For any* student user and any date, the attendance interface should only be displayed if a valid schedule exists for the class on that day of week.

**Validates: Requirements 5.1**

### Property 11: Attendance Rate Calculation Formula

*For any* class with attendance data, the attendance rate should be calculated as (number of "present" attendance records / (total sessions × total enrolled students)) × 100.

**Validates: Requirements 6.1, 6.2**

### Property 12: Attendance Rate Update on New Record

*For any* class, when a new AttendanceRecord is created, querying the attendance rate should reflect the updated calculation including the new record.

**Validates: Requirements 6.3**

### Property 13: API Authentication Requirement

*For any* attendance API endpoint, requests without valid authentication should be rejected with 401 status, and requests without proper authorization should be rejected with 403 status.

**Validates: Requirements 8.5**

### Property 14: Referential Integrity - Student

*For any* AttendanceRecord, the studentId field should reference a valid User document with role "student", and attempts to create records with invalid studentId should be rejected.

**Validates: Requirements 9.2**

### Property 15: Referential Integrity - Class

*For any* AttendanceSession, the classId field should reference a valid Class document, and attempts to create sessions with invalid classId should be rejected.

**Validates: Requirements 9.3**

### Property 16: Referential Integrity - Session

*For any* AttendanceRecord, the sessionId field should reference a valid AttendanceSession document, and attempts to create records with invalid sessionId should be rejected.

**Validates: Requirements 9.4**

### Property 17: Timezone Consistency

*For any* time comparison operation in the system, all times should be compared using the server's timezone to ensure consistent validation results regardless of client timezone.

**Validates: Requirements 10.5**

## Error Handling

### Schedule Validation Errors

**Error:** No schedule exists for current day
- **Code:** `SCHEDULE_NOT_FOUND`
- **HTTP Status:** 400 Bad Request
- **Message:** "Hôm nay không có lịch học"
- **User Action:** Display message to user, disable attendance actions

**Error:** Current time before schedule start time
- **Code:** `ATTENDANCE_TOO_EARLY`
- **HTTP Status:** 400 Bad Request
- **Message:** "Chưa đến giờ học. Lớp học bắt đầu lúc {startTime}"
- **User Action:** Display message with countdown to start time

**Error:** Current time after schedule end time
- **Code:** `ATTENDANCE_TOO_LATE`
- **HTTP Status:** 400 Bad Request
- **Message:** "Đã hết giờ học. Lớp học kết thúc lúc {endTime}"
- **User Action:** Display message, disable attendance actions

### Attendance Record Errors

**Error:** Duplicate attendance attempt
- **Code:** `DUPLICATE_ATTENDANCE`
- **HTTP Status:** 409 Conflict
- **Message:** "Bạn đã điểm danh cho buổi học này rồi"
- **User Action:** Display message, show existing attendance record

**Error:** Student not enrolled in class
- **Code:** `NOT_ENROLLED`
- **HTTP Status:** 403 Forbidden
- **Message:** "Bạn không được ghi danh vào lớp học này"
- **User Action:** Display message, redirect to class list

**Error:** Invalid QR code or expired code
- **Code:** `INVALID_CODE`
- **HTTP Status:** 400 Bad Request
- **Message:** "Mã không hợp lệ hoặc đã hết hạn"
- **User Action:** Display message, prompt for manual code entry

### Authorization Errors

**Error:** Unauthorized access (no token)
- **Code:** `UNAUTHORIZED`
- **HTTP Status:** 401 Unauthorized
- **Message:** "Vui lòng đăng nhập"
- **User Action:** Redirect to login page

**Error:** Forbidden access (wrong role)
- **Code:** `FORBIDDEN`
- **HTTP Status:** 403 Forbidden
- **Message:** "Bạn không có quyền thực hiện thao tác này"
- **User Action:** Display message, redirect to appropriate page

### Database Errors

**Error:** Database connection failure
- **Code:** `DB_CONNECTION_ERROR`
- **HTTP Status:** 503 Service Unavailable
- **Message:** "Không thể kết nối đến cơ sở dữ liệu. Vui lòng thử lại sau"
- **User Action:** Display error message, provide retry button

**Error:** Invalid ObjectId format
- **Code:** `INVALID_ID`
- **HTTP Status:** 400 Bad Request
- **Message:** "ID không hợp lệ"
- **User Action:** Log error, display generic error message

### Error Handling Strategy

1. **Validation Errors:** Return immediately with appropriate error code and message
2. **Business Logic Errors:** Log error details, return user-friendly message
3. **Database Errors:** Log full error stack, return generic message to user
4. **Authentication Errors:** Clear invalid tokens, redirect to login
5. **Authorization Errors:** Log access attempt, return 403 with message

### Error Logging

All errors should be logged with:
- Timestamp
- User ID (if authenticated)
- Request path and method
- Error code and message
- Stack trace (for server errors)

Example log format:
```
[2024-01-15 10:30:45] ERROR: SCHEDULE_NOT_FOUND
User: 507f1f77bcf86cd799439011
Path: POST /attendance/check-in
Message: Hôm nay không có lịch học
ClassId: 507f191e810c19729de860ea
DayOfWeek: 0 (Sunday)
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of schedule validation (e.g., Monday at 9:00 AM with schedule 9:00-11:00)
- Edge cases (e.g., attendance exactly at startTime or endTime)
- Error conditions (e.g., invalid ObjectId, missing required fields)
- Integration between components (e.g., ScheduleValidator + AttendanceController)
- UI component rendering and user interactions

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs (e.g., time window validation for any schedule)
- Comprehensive input coverage through randomization
- Invariants that must always hold (e.g., attendance rate between 0-100%)
- Round-trip properties (e.g., create record then query should return same data)

### Property-Based Testing Configuration

**Library:** fast-check (for JavaScript/Node.js)

**Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: schedule-based-attendance, Property {number}: {property_text}`

**Example Property Test Structure:**

```javascript
import fc from 'fast-check';

describe('Feature: schedule-based-attendance, Property 2: Time Window Validation', () => {
  it('should only allow attendance when current time is within schedule window', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          startTime: fc.string({ minLength: 5, maxLength: 5 }).filter(isValidTime),
          endTime: fc.string({ minLength: 5, maxLength: 5 }).filter(isValidTime),
          currentTime: fc.string({ minLength: 5, maxLength: 5 }).filter(isValidTime)
        }),
        async ({ startTime, endTime, currentTime }) => {
          const schedule = { startTime, endTime };
          const validator = new ScheduleValidator();
          const isValid = validator.validateTimeWindow(schedule, currentTime);
          
          const isWithinWindow = 
            compareTime(currentTime, startTime) >= 0 && 
            compareTime(currentTime, endTime) <= 0;
          
          expect(isValid).toBe(isWithinWindow);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Backend Unit Tests:**

1. **ScheduleValidator Service**
   - `getCurrentSchedule()` returns correct schedule for current day
   - `getCurrentSchedule()` returns null when no schedule exists
   - `validateDayOfWeek()` correctly matches current day
   - `validateTimeWindow()` returns true for time within window
   - `validateTimeWindow()` returns false for time before startTime
   - `validateTimeWindow()` returns false for time after endTime
   - `compareTime()` correctly compares time strings

2. **AttendanceController**
   - `createSession()` rejects when no schedule exists
   - `createSession()` rejects when outside time window
   - `createSession()` succeeds when schedule is valid
   - `checkIn()` rejects when no schedule exists
   - `checkIn()` rejects when outside time window
   - `checkIn()` creates record when valid
   - `getStatistics()` returns correct counts
   - `getAttendanceRate()` returns correct rate
   - `validateSchedule()` returns schedule info when valid

3. **AttendanceService**
   - `calculateStatistics()` counts enrolled students correctly
   - `calculateStatistics()` counts attended students correctly
   - `calculateAttendanceRate()` uses correct formula
   - `calculateAttendanceRate()` handles zero sessions
   - `calculateAttendanceRate()` handles zero students
   - `getTeacherClassesAttendanceRate()` returns all teacher's classes

4. **Integration Tests**
   - Full flow: teacher creates session with schedule validation
   - Full flow: student checks in with schedule validation
   - Full flow: teacher views statistics
   - Full flow: dashboard displays attendance rates

**Frontend Unit Tests:**

1. **useAttendanceValidator Hook**
   - Returns loading state initially
   - Calls API to validate schedule
   - Sets isValidSchedule based on API response
   - Sets errorMessage when validation fails
   - Provides scheduleInfo when valid

2. **AttendanceStatistics Component**
   - Renders table with correct columns
   - Displays loading state
   - Displays error message on API failure
   - Shows correct student counts
   - Refreshes when refreshTrigger changes

3. **AttendanceRateChart Component**
   - Renders chart with correct data
   - Displays loading state
   - Handles empty data gracefully
   - Shows tooltips with detailed numbers
   - Responsive to window resize

4. **Enhanced CheckIn Component**
   - Validates schedule before showing form
   - Displays "Hôm nay không có lịch học" when no schedule
   - Displays time window error when outside window
   - Shows schedule info when valid
   - Submits check-in successfully

5. **Enhanced AttendanceQR Component**
   - Validates schedule before allowing code generation
   - Disables button when outside time window
   - Displays schedule info
   - Shows countdown timer
   - Generates QR code successfully

### Test Data Setup

**Mock Data for Tests:**

```javascript
const mockSchedule = {
  _id: '507f1f77bcf86cd799439011',
  classId: '507f191e810c19729de860ea',
  dayOfWeek: 1, // Monday
  startTime: '09:00',
  endTime: '11:00',
  room: 'A101'
};

const mockClass = {
  _id: '507f191e810c19729de860ea',
  name: 'Web Development',
  teacherId: '507f1f77bcf86cd799439012'
};

const mockStudent = {
  _id: '507f1f77bcf86cd799439013',
  role: 'student',
  name: 'Nguyen Van A'
};

const mockEnrollment = {
  classId: '507f191e810c19729de860ea',
  studentId: '507f1f77bcf86cd799439013'
};
```

### Test Execution

**Backend Tests:**
```bash
npm test -- --coverage
```

**Frontend Tests:**
```bash
cd frontend && npm test -- --coverage
```

**Property-Based Tests:**
```bash
npm test -- --testPathPattern=property
```

### Continuous Integration

All tests should run on:
- Every commit to feature branch
- Every pull request
- Before deployment to staging/production

CI should fail if:
- Any test fails
- Code coverage drops below 80%
- Property-based tests find counterexamples

