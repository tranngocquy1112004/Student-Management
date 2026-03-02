# Design Document: Auto Schedule Generator

## Overview

Tính năng Auto Schedule Generator cho phép giáo viên tự động tạo lịch học cho cả học kỳ thay vì phải tạo từng buổi học thủ công. Hệ thống sẽ:

- Tính toán số tiết còn lại dựa trên totalLessons và scheduledLessons
- Cho phép giáo viên chọn ngày bắt đầu, nhóm thứ (2-4-6 hoặc 3-5-7), ca học (sáng/chiều), và phòng học
- Tự động tính toán các ngày học dựa trên nhóm thứ đã chọn
- Hiển thị preview danh sách lịch học trước khi xác nhận
- Tự động đánh dấu tiết cuối cùng là tiết thi
- Bulk insert schedules và update scheduledLessons atomically

Tính năng này giảm đáng kể thời gian và công sức của giáo viên trong việc quản lý lịch học, đồng thời đảm bảo tính nhất quán và chính xác của dữ liệu.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  ClassDetail Component                                       │
│    ├─> ScheduleGeneratorModal Component                     │
│    │     ├─> Form Inputs (Date, Day Group, Session, Room)   │
│    │     ├─> Preview List Component                         │
│    │     └─> Validation Logic                               │
│    └─> Schedule Display Component                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Backend Layer                           │
├─────────────────────────────────────────────────────────────┤
│  API Routes                                                  │
│    ├─> GET /classes/:id/remaining-lessons                   │
│    └─> POST /classes/:id/schedules/bulk                     │
│                                                              │
│  Controllers                                                 │
│    └─> scheduleController                                   │
│          ├─> getRemainingLessons()                          │
│          └─> bulkCreateSchedules()                          │
│                                                              │
│  Services                                                    │
│    └─> scheduleService                                      │
│          ├─> calculateRemainingLessons()                    │
│          ├─> validateBulkSchedules()                        │
│          └─> bulkInsertWithTransaction()                    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Mongoose ODM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│  MongoDB Collections                                         │
│    ├─> classes (updated with totalLessons, scheduledLessons)│
│    └─> schedules (bulk insert with transaction)             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Initialization Flow**:
   - User opens ClassDetail page
   - Frontend fetches class data including totalLessons and scheduledLessons
   - System calculates and displays remaining lessons

2. **Schedule Generation Flow**:
   - User clicks "Tạo lịch tự động" button
   - ScheduleGeneratorModal opens with form inputs
   - User fills in: start date, day group, session, room
   - User clicks "Preview" button
   - Frontend calculates all lesson dates based on day group
   - Frontend displays preview list with lesson details
   - User reviews and clicks "Xác nhận"
   - Frontend sends bulk create request to backend
   - Backend validates and performs atomic transaction:
     - Insert all schedules
     - Update class.scheduledLessons
   - Backend returns success/error response
   - Frontend updates UI and closes modal

3. **Validation Flow**:
   - Frontend validates form inputs before enabling preview/confirm
   - Backend validates remaining lessons count
   - Backend validates schedule data structure
   - Transaction ensures atomicity (all or nothing)

## Components and Interfaces

### Frontend Components

#### 1. ScheduleGeneratorModal Component

**Purpose**: Modal dialog for inputting schedule generation parameters and previewing results

**Props**:
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  classData: {
    _id: string,
    name: string,
    subjectName: string,
    totalLessons: number,
    scheduledLessons: number
  },
  onSchedulesCreated: () => void
}
```

**State**:
```javascript
{
  startDate: Date | null,
  dayGroup: '2-4-6' | '3-5-7' | null,
  session: 'morning' | 'afternoon' | null,
  room: string,
  previewSchedules: Array<SchedulePreview>,
  isPreviewMode: boolean,
  isSubmitting: boolean,
  error: string | null
}
```

**Key Methods**:
- `handlePreview()`: Generate preview list of schedules
- `handleConfirm()`: Submit schedules to backend
- `calculateScheduleDates()`: Calculate dates based on day group
- `validateForm()`: Validate all required fields
- `resetForm()`: Reset form to initial state

#### 2. SchedulePreviewList Component

**Purpose**: Display preview of generated schedules before confirmation

**Props**:
```javascript
{
  schedules: Array<SchedulePreview>,
  onEdit: () => void,
  onConfirm: () => void
}
```

**Display Format**:
- Lesson number (1, 2, 3, ..., n)
- Date (DD/MM/YYYY)
- Day of week (Thứ 2, Thứ 3, ...)
- Time (07:30-11:30 or 13:30-17:30)
- Room
- Exam indicator (for last lesson)

### Backend Components

#### 1. Schedule Controller

**New Methods**:

```javascript
// GET /api/classes/:id/remaining-lessons
async getRemainingLessons(req, res) {
  // Returns: { totalLessons, scheduledLessons, remainingLessons }
}

// POST /api/classes/:id/schedules/bulk
async bulkCreateSchedules(req, res) {
  // Body: { schedules: Array<ScheduleData> }
  // Returns: { success, createdSchedules, updatedClass }
}
```

#### 2. Schedule Service

**New Methods**:

```javascript
async calculateRemainingLessons(classId) {
  // Query class document
  // Return totalLessons - scheduledLessons
}

async validateBulkSchedules(classId, schedules) {
  // Validate schedules count <= remaining lessons
  // Validate schedule data structure
  // Return validation result
}

async bulkInsertWithTransaction(classId, schedules) {
  // Start MongoDB session
  // Insert all schedules
  // Update class.scheduledLessons
  // Commit or rollback transaction
}
```

### API Interfaces

#### GET /api/classes/:id/remaining-lessons

**Request**:
```
GET /api/classes/:id/remaining-lessons
Headers: { Authorization: Bearer <token> }
```

**Response Success (200)**:
```json
{
  "success": true,
  "data": {
    "classId": "507f1f77bcf86cd799439011",
    "totalLessons": 45,
    "scheduledLessons": 10,
    "remainingLessons": 35
  }
}
```

**Response Error (404)**:
```json
{
  "success": false,
  "message": "Class not found"
}
```

#### POST /api/classes/:id/schedules/bulk

**Request**:
```json
POST /api/classes/:id/schedules/bulk
Headers: { Authorization: Bearer <token> }
Body: {
  "schedules": [
    {
      "dayOfWeek": 2,
      "startTime": "07:30",
      "endTime": "11:30",
      "room": "A101",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-01-15T00:00:00.000Z",
      "isExam": false
    },
    {
      "dayOfWeek": 4,
      "startTime": "07:30",
      "endTime": "11:30",
      "room": "A101",
      "startDate": "2024-01-17T00:00:00.000Z",
      "endDate": "2024-01-17T00:00:00.000Z",
      "isExam": false
    },
    {
      "dayOfWeek": 6,
      "startTime": "07:30",
      "endTime": "11:30",
      "room": "A101",
      "startDate": "2024-01-19T00:00:00.000Z",
      "endDate": "2024-01-19T00:00:00.000Z",
      "isExam": true
    }
  ]
}
```

**Response Success (201)**:
```json
{
  "success": true,
  "message": "Đã tạo 3 lịch học thành công",
  "data": {
    "createdSchedules": [...],
    "updatedClass": {
      "_id": "507f1f77bcf86cd799439011",
      "scheduledLessons": 13
    }
  }
}
```

**Response Error (400)**:
```json
{
  "success": false,
  "message": "Số lịch học vượt quá số tiết còn lại"
}
```

## Data Models

### Updated Class Model

```javascript
const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed', 'upcoming'], default: 'active' },
  maxStudents: { type: Number, default: 50 },
  
  // NEW FIELDS
  totalLessons: { 
    type: Number, 
    required: false,  // Optional for backward compatibility
    min: 0 
  },
  scheduledLessons: { 
    type: Number, 
    default: 0,
    min: 0,
    validate: {
      validator: function(value) {
        return !this.totalLessons || value <= this.totalLessons;
      },
      message: 'scheduledLessons cannot exceed totalLessons'
    }
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Field Descriptions**:
- `totalLessons`: Tổng số tiết học trong học kỳ (optional để tương thích với dữ liệu cũ)
- `scheduledLessons`: Số tiết đã được tạo lịch (default 0, tự động tăng khi tạo lịch)

### Updated Schedule Model

```javascript
const scheduleSchema = new mongoose.Schema({
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  dayOfWeek: { type: Number, required: true, min: 0, max: 6 }, // 0=CN, 1=T2, ..., 6=T7
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  room: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  
  // NEW FIELD
  isExam: { 
    type: Boolean, 
    default: false 
  },
  
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });
```

**Field Descriptions**:
- `isExam`: Đánh dấu tiết học là tiết thi (true cho tiết cuối cùng)

### Schedule Generation Algorithm

**Input Parameters**:
- `startDate`: Ngày bắt đầu học
- `dayGroup`: '2-4-6' hoặc '3-5-7'
- `session`: 'morning' (07:30-11:30) hoặc 'afternoon' (13:30-17:30)
- `room`: Tên phòng học
- `remainingLessons`: Số tiết còn lại cần tạo

**Algorithm**:
```javascript
function generateSchedules(startDate, dayGroup, session, room, remainingLessons) {
  const schedules = [];
  const dayOfWeekMap = {
    '2-4-6': [2, 4, 6],  // Monday, Wednesday, Friday
    '3-5-7': [3, 5, 0]   // Tuesday, Thursday, Saturday
  };
  const sessionTimes = {
    'morning': { startTime: '07:30', endTime: '11:30' },
    'afternoon': { startTime: '13:30', endTime: '17:30' }
  };
  
  const targetDays = dayOfWeekMap[dayGroup];
  const times = sessionTimes[session];
  let currentDate = new Date(startDate);
  let count = 0;
  
  while (count < remainingLessons) {
    const dayOfWeek = currentDate.getDay();
    
    if (targetDays.includes(dayOfWeek)) {
      schedules.push({
        dayOfWeek: dayOfWeek,
        startTime: times.startTime,
        endTime: times.endTime,
        room: room,
        startDate: new Date(currentDate),
        endDate: new Date(currentDate),
        isExam: count === remainingLessons - 1  // Last lesson is exam
      });
      count++;
    }
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedules;
}
```

**Example**:
- Start date: 15/01/2024 (Monday)
- Day group: 2-4-6
- Session: morning
- Room: A101
- Remaining lessons: 3

**Generated schedules**:
1. Monday 15/01/2024, 07:30-11:30, A101, isExam: false
2. Wednesday 17/01/2024, 07:30-11:30, A101, isExam: false
3. Friday 19/01/2024, 07:30-11:30, A101, isExam: true


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:

**Redundancy Analysis**:
1. Properties 3.3 (dates match day group), 3.5 (session time assignment), and 3.6 (room assignment) can be combined into a single comprehensive property about schedule generation correctness
2. Properties 4.1 (insert all lessons) and 4.2 (one document per lesson) are redundant - if we verify the count matches, we've verified both
3. Properties 3.4 (exact count) and 4.2 (one document per lesson) overlap - both verify the count of generated schedules
4. Properties 8.1 (visibility to students) and 8.4 (functional equivalence) overlap - if auto-created schedules function identically, they must be visible
5. Properties 3.8 (display fields) and 2.2 (modal displays fields) both test rendering of required information - can be combined
6. Properties 5.2 (validate required fields) and 2.8 (disable buttons when empty) test the same validation logic

**Consolidated Properties**:
After reflection, I will write properties that provide unique validation value without logical redundancy.

### Property 1: Remaining Lessons Calculation

*For any* class with totalLessons and scheduledLessons values, the remaining lessons should equal (totalLessons - scheduledLessons)

**Validates: Requirements 1.1**

### Property 2: Schedule Generation Produces Exact Count

*For any* valid input parameters (start date, day group, session, room) and remaining lesson count N, the schedule generator should produce exactly N schedules

**Validates: Requirements 3.4, 4.2**

### Property 3: Generated Schedules Match Input Parameters

*For any* generated schedule list with input parameters (day group, session time, room name), all schedules in the list should have:
- dayOfWeek matching the selected day group
- startTime and endTime matching the selected session
- room matching the entered room name

**Validates: Requirements 3.3, 3.5, 3.6**

### Property 4: Schedule Dates Are Chronological and After Start Date

*For any* generated schedule list with start date D, all schedule dates should be >= D and in chronological order

**Validates: Requirements 3.2**

### Property 5: Last Schedule Is Marked As Exam

*For any* non-empty generated schedule list, the last schedule should have isExam: true and all other schedules should have isExam: false

**Validates: Requirements 3.7**

### Property 6: Bulk Insert Updates Scheduled Lessons Atomically

*For any* class with initial scheduledLessons value S and bulk insert of N schedules, after successful insertion the class scheduledLessons should equal S + N

**Validates: Requirements 4.3, 7.5**

### Property 7: Transaction Rollback On Failure

*For any* bulk insert operation that fails, no schedules should be created in the database and the class scheduledLessons value should remain unchanged

**Validates: Requirements 7.6**

### Property 8: Scheduled Lessons Never Exceeds Total Lessons

*For any* class at any point in time, scheduledLessons should be <= totalLessons

**Validates: Requirements 6.4**

### Property 9: New Class Initialization

*For any* newly created class, scheduledLessons should be initialized to 0

**Validates: Requirements 6.3**

### Property 10: Validation Rejects Excessive Schedules

*For any* bulk insert request where the number of schedules exceeds remaining lessons, the request should be rejected with an error

**Validates: Requirements 5.3, 7.4**

### Property 11: Validation Rejects Past Start Dates

*For any* start date that is before the current date, the validation should fail and prevent schedule generation

**Validates: Requirements 5.1**

### Property 12: Required Field Validation

*For any* form state where one or more required fields (start date, day group, session, room) are empty, the preview and confirm actions should be disabled

**Validates: Requirements 5.2, 2.8**

### Property 13: Auto-Created Schedules Are Immediately Visible

*For any* successfully created schedules via bulk insert, querying the schedules for that class should immediately return all newly created schedules

**Validates: Requirements 4.7, 8.1**

### Property 14: Auto-Created Schedules Support Attendance

*For any* schedule created via the auto-generator, the attendance marking functionality should work identically to manually created schedules

**Validates: Requirements 8.2, 8.4**

### Property 15: API Response Contains Created Schedules

*For any* successful bulk insert operation, the API response should contain all created schedule documents

**Validates: Requirements 7.7**

### Property 16: Preview Display Contains Required Information

*For any* generated schedule in the preview list, the rendered output should contain: lesson number, date, day of week, time, room, and exam indicator (if applicable)

**Validates: Requirements 3.8**

### Property 17: Modal Display Contains Class Information

*For any* class data passed to the modal, the rendered modal should display: class name, subject name, total lessons, scheduled lessons, and remaining lessons

**Validates: Requirements 2.2**

### Property 18: Summary Counts Are Accurate

*For any* generated schedule list, the summary should show regular lesson count = (total count - 1) and exam lesson count = 1

**Validates: Requirements 3.9**

## Error Handling

### Frontend Error Handling

**Form Validation Errors**:
- Empty required fields: Disable preview/confirm buttons, show field-level validation messages
- Past start date: Show error message "Ngày bắt đầu không được ở quá khứ"
- Invalid room name: Show error message "Tên phòng học không hợp lệ"

**API Error Handling**:
- Network errors: Show toast notification "Không thể kết nối đến server"
- 400 Bad Request: Display specific error message from server
- 401 Unauthorized: Redirect to login page
- 404 Not Found: Show "Không tìm thấy lớp học"
- 500 Server Error: Show "Đã xảy ra lỗi, vui lòng thử lại sau"

**State Management**:
- Set `isSubmitting: false` on error to re-enable form
- Keep modal open on error to allow user to retry
- Clear error state when user modifies form inputs

### Backend Error Handling

**Validation Errors**:
```javascript
// Class not found
if (!classData) {
  return res.status(404).json({
    success: false,
    message: 'Không tìm thấy lớp học'
  });
}

// Total lessons not set
if (!classData.totalLessons) {
  return res.status(400).json({
    success: false,
    message: 'Lớp học chưa được cấu hình số tiết học'
  });
}

// Exceeds remaining lessons
if (schedules.length > remainingLessons) {
  return res.status(400).json({
    success: false,
    message: `Số lịch học (${schedules.length}) vượt quá số tiết còn lại (${remainingLessons})`
  });
}

// Invalid schedule data
if (!validateScheduleData(schedules)) {
  return res.status(400).json({
    success: false,
    message: 'Dữ liệu lịch học không hợp lệ'
  });
}
```

**Transaction Errors**:
```javascript
try {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  // Insert schedules
  const createdSchedules = await Schedule.insertMany(schedules, { session });
  
  // Update class
  await Class.findByIdAndUpdate(
    classId,
    { $inc: { scheduledLessons: schedules.length } },
    { session }
  );
  
  await session.commitTransaction();
  session.endSession();
  
  return res.status(201).json({ success: true, data: createdSchedules });
  
} catch (error) {
  await session.abortTransaction();
  session.endSession();
  
  console.error('Bulk insert error:', error);
  return res.status(500).json({
    success: false,
    message: 'Không thể tạo lịch học, vui lòng thử lại'
  });
}
```

**Authorization Errors**:
- Verify user is the teacher of the class
- Return 403 Forbidden if user is not authorized

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples and edge cases
- UI component rendering
- API endpoint structure
- Error handling scenarios
- Integration between components

**Property-Based Tests** focus on:
- Universal properties across all inputs
- Schedule generation algorithm correctness
- Data integrity and atomicity
- Validation logic across input ranges

### Property-Based Testing Configuration

**Library Selection**:
- Frontend: `fast-check` (JavaScript property-based testing library)
- Backend: `fast-check` (Node.js compatible)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: auto-schedule-generator, Property {N}: {property description}`

**Example Property Test Structure**:
```javascript
// Feature: auto-schedule-generator, Property 2: Schedule Generation Produces Exact Count
describe('Property 2: Schedule Generation Produces Exact Count', () => {
  it('should generate exactly N schedules for remaining lesson count N', () => {
    fc.assert(
      fc.property(
        fc.date({ min: new Date() }), // startDate
        fc.constantFrom('2-4-6', '3-5-7'), // dayGroup
        fc.constantFrom('morning', 'afternoon'), // session
        fc.string({ minLength: 1, maxLength: 10 }), // room
        fc.integer({ min: 1, max: 50 }), // remainingLessons
        (startDate, dayGroup, session, room, remainingLessons) => {
          const schedules = generateSchedules(
            startDate,
            dayGroup,
            session,
            room,
            remainingLessons
          );
          return schedules.length === remainingLessons;
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Test Coverage

**Frontend Unit Tests**:
1. ScheduleGeneratorModal component rendering
2. Form input handling and state management
3. Preview button click generates preview list
4. Confirm button calls API with correct data
5. Error display when API fails
6. Modal closes on success
7. Button disable logic when fields are empty
8. Date picker validation for past dates

**Backend Unit Tests**:
1. GET /classes/:id/remaining-lessons returns correct data
2. POST /classes/:id/schedules/bulk creates schedules
3. Validation rejects invalid requests
4. Authorization checks for teacher access
5. Error responses for edge cases (no totalLessons, class not found)
6. Transaction rollback on database errors

**Integration Tests**:
1. End-to-end flow: open modal → fill form → preview → confirm → verify database
2. Student can view auto-created schedules
3. Attendance marking works on auto-created schedules
4. Multiple bulk inserts update scheduledLessons correctly

### Test Data Generators

**For Property-Based Tests**:
```javascript
// Generate valid class data
const classGenerator = fc.record({
  _id: fc.hexaString({ minLength: 24, maxLength: 24 }),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  totalLessons: fc.integer({ min: 1, max: 100 }),
  scheduledLessons: fc.integer({ min: 0, max: 100 })
}).filter(c => c.scheduledLessons <= c.totalLessons);

// Generate valid schedule input
const scheduleInputGenerator = fc.record({
  startDate: fc.date({ min: new Date() }),
  dayGroup: fc.constantFrom('2-4-6', '3-5-7'),
  session: fc.constantFrom('morning', 'afternoon'),
  room: fc.string({ minLength: 1, maxLength: 20 })
});

// Generate valid schedule data
const scheduleGenerator = fc.record({
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  startTime: fc.constantFrom('07:30', '13:30'),
  endTime: fc.constantFrom('11:30', '17:30'),
  room: fc.string({ minLength: 1, maxLength: 20 }),
  startDate: fc.date(),
  endDate: fc.date(),
  isExam: fc.boolean()
});
```

### Edge Cases to Test

1. **Class with totalLessons = 0**: Should prevent schedule creation
2. **Class with scheduledLessons = totalLessons**: Should disable create button
3. **Start date on weekend**: Should correctly skip to next valid day
4. **Very large remaining lessons (e.g., 100)**: Should generate all schedules correctly
5. **Day group 3-5-7 starting on Monday**: Should skip to Tuesday
6. **Concurrent bulk inserts**: Should handle race conditions with proper locking
7. **Database connection failure during transaction**: Should rollback completely
8. **Invalid room name with special characters**: Should validate and reject

### Performance Considerations

**Frontend**:
- Debounce form input validation
- Virtualize preview list for large lesson counts (>50)
- Optimize date calculations to avoid blocking UI

**Backend**:
- Use bulk insert for better performance (insertMany vs multiple inserts)
- Index classId in schedules collection for faster queries
- Use MongoDB transactions for atomicity without sacrificing performance
- Consider batch size limits for very large schedule counts

### Test Execution

**Unit Tests**:
```bash
# Frontend
npm test -- --coverage

# Backend
npm test -- --coverage
```

**Property-Based Tests**:
```bash
# Run with increased iterations for CI/CD
npm test -- --testNamePattern="Property" --numRuns=1000
```

**Integration Tests**:
```bash
# Requires test database
npm run test:integration
```

