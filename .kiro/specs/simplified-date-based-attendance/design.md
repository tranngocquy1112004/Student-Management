# Design Document: Simplified Date-Based Attendance

## Overview

This design transforms the attendance system from a recurring weekly schedule model to a specific date-based model with automatic session creation and one-click student check-in. The key changes eliminate QR code complexity, remove the `dayOfWeek` field in favor of specific dates, and automatically create `AttendanceSession` records when schedules are created.

### Key Design Decisions

1. **Date-Based Scheduling**: Replace `dayOfWeek` with specific `date` field to support exact date scheduling rather than recurring patterns
2. **Automatic Session Creation**: Create `AttendanceSession` immediately when a schedule is created, eliminating manual session management
3. **Simplified Check-In**: Remove QR code generation and scanning, replacing with direct button-based check-in
4. **Time-Based Status**: Calculate session status (upcoming/active/expired) in real-time based on current server time
5. **Backward Compatibility**: Maintain existing `AttendanceRecord` structure to preserve historical data

### System Context

The attendance system integrates with:
- **Class Management**: Schedules belong to classes, which have enrolled students
- **User Management**: Teachers create schedules, students check in
- **Enrollment System**: Validates student access to attendance sessions
- **Frontend UI**: Displays session status and check-in buttons based on time windows

## Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Teacher View │  │ Student View │  │ Admin View   │     │
│  │ - Create     │  │ - View       │  │ - Manage     │     │
│  │ - Manage     │  │ - Check-in   │  │ - Reports    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Controller Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         scheduleController.js                        │  │
│  │  - createSchedule()                                  │  │
│  │  - getSchedules()                                    │  │
│  │  - deleteSchedule()                                  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         attendanceController.js                      │  │
│  │  - directCheckIn()                                   │  │
│  │  - getStudentAttendanceStatus()                      │  │
│  │  - getSessionRecords()                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         scheduleService.js                           │  │
│  │  - createScheduleWithSession()                       │  │
│  │  - validateScheduleInput()                           │  │
│  │  - calculateSessionStatus()                          │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         attendanceService.js                         │  │
│  │  - checkInStudent()                                  │  │
│  │  - validateCheckInEligibility()                      │  │
│  │  - getAttendanceReport()                             │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Data Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Schedule    │  │  Attendance  │  │  Attendance  │     │
│  │  Model       │  │  Session     │  │  Record      │     │
│  │              │  │  Model       │  │  Model       │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Schedule Creation Flow
```
Teacher → createSchedule() → Validate Input → Create Schedule
                                    ↓
                          Auto-create AttendanceSession
                                    ↓
                          Link Session to Schedule
                                    ↓
                          Return Success Response
```

#### Student Check-In Flow
```
Student → Click "Điểm danh" → Validate Time Window
                                    ↓
                          Validate Enrollment
                                    ↓
                          Check Duplicate
                                    ↓
                          Create AttendanceRecord
                                    ↓
                          Return Success/Error
```

#### Status Calculation Flow
```
Frontend Request → Get Current Server Time
                          ↓
                  Get Schedule Date/Time
                          ↓
                  Compare Times
                          ↓
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   Before Start      In Window         After End
   (Upcoming)        (Active)          (Expired)
```

## Components and Interfaces

### Modified Schedule Model

The `Schedule` model is updated to use specific dates instead of recurring weekly patterns:

```javascript
{
  classId: ObjectId,           // Reference to Class
  date: Date,                  // NEW: Specific date (replaces dayOfWeek)
  startTime: String,           // Format: "HH:MM" (e.g., "08:00")
  endTime: String,             // Format: "HH:MM" (e.g., "10:00")
  room: String,                // Optional room location
  isDeleted: Boolean,          // Soft delete flag
  deletedAt: Date,             // Soft delete timestamp
  createdAt: Date,
  updatedAt: Date
}
```

**Key Changes**:
- Remove: `dayOfWeek`, `startDate`, `endDate`, `isExam` fields
- Add: `date` field for specific date scheduling
- Maintain: `startTime`, `endTime` for time slot definition

### Modified AttendanceSession Model

The `AttendanceSession` model is linked to schedules and created automatically:

```javascript
{
  classId: ObjectId,           // Reference to Class
  scheduleId: ObjectId,        // NEW: Reference to Schedule
  date: Date,                  // Session date (copied from schedule)
  startTime: String,           // NEW: Start time (copied from schedule)
  endTime: String,             // NEW: End time (copied from schedule)
  isDeleted: Boolean,
  deletedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Key Changes**:
- Add: `scheduleId` to link back to the schedule
- Add: `startTime`, `endTime` for time window validation
- Remove: `shift`, `code`, `codeExpiredAt` (QR code fields)
- Maintain: `date` field for session date

### AttendanceRecord Model (Unchanged)

```javascript
{
  sessionId: ObjectId,         // Reference to AttendanceSession
  studentId: ObjectId,         // Reference to User (student)
  status: String,              // 'present', 'absent', 'late'
  checkedAt: Date,             // Timestamp of check-in
  checkInMethod: String,       // 'manual' (no more 'qr')
  createdAt: Date,
  updatedAt: Date
}
```

**No Changes**: This model remains compatible with the new system.

### API Endpoints

#### Schedule Management

**POST /api/classes/:classId/schedules**
- Creates a new schedule and automatically creates associated AttendanceSession
- Request Body:
  ```json
  {
    "date": "2024-03-15",
    "startTime": "08:00",
    "endTime": "10:00",
    "room": "A101"
  }
  ```
- Response:
  ```json
  {
    "success": true,
    "data": {
      "schedule": { /* schedule object */ },
      "session": { /* auto-created session */ }
    }
  }
  ```

**GET /api/classes/:classId/schedules**
- Retrieves all schedules for a class with session status
- Query Parameters: `page`, `limit`, `startDate`, `endDate`
- Response includes calculated status for each session

**DELETE /api/schedules/:scheduleId**
- Soft deletes a schedule and its associated session
- Only allowed if session date hasn't passed

#### Student Attendance

**POST /api/classes/:classId/attendance/check-in**
- One-click check-in for current session
- Validates time window and enrollment
- Request Body: (empty - uses authenticated user)
- Response:
  ```json
  {
    "success": true,
    "message": "Điểm danh thành công",
    "data": { /* attendance record */ }
  }
  ```

**GET /api/classes/:classId/attendance/status**
- Gets current attendance status for authenticated student
- Returns whether student has checked in today
- Response:
  ```json
  {
    "success": true,
    "hasCheckedIn": false,
    "sessionStatus": "active",
    "session": { /* session details */ }
  }
  ```

**GET /api/classes/:classId/attendance/my-attendance**
- Gets all attendance records for authenticated student in a class
- Includes pagination support

#### Teacher Management

**GET /api/sessions/:sessionId/records**
- Gets all attendance records for a specific session
- Returns list of students with check-in status and timestamps

**GET /api/classes/:classId/attendance/report**
- Generates attendance report for entire class
- Shows attendance statistics per student

### Service Layer Methods

#### scheduleService.js

```javascript
// Creates schedule and auto-creates session
async createScheduleWithSession(classId, scheduleData, userId)

// Validates schedule input (date, time, permissions)
async validateScheduleInput(classId, scheduleData, userId)

// Calculates session status based on current time
calculateSessionStatus(schedule, currentTime)

// Soft deletes schedule and associated session
async deleteSchedule(scheduleId, userId)

// Gets schedules with enriched status information
async getSchedulesWithStatus(classId, filters)
```

#### attendanceService.js

```javascript
// Validates if student can check in (time window, enrollment, duplicates)
async validateCheckInEligibility(classId, studentId, currentTime)

// Creates attendance record for student
async checkInStudent(sessionId, studentId)

// Gets attendance status for a student in a class
async getStudentAttendanceStatus(classId, studentId, date)

// Generates attendance report for class
async getAttendanceReport(classId, filters)
```

## Data Models

### Database Schema Changes

#### Schedule Collection
```javascript
{
  _id: ObjectId,
  classId: ObjectId,
  date: ISODate("2024-03-15T00:00:00Z"),  // Specific date
  startTime: "08:00",                      // Time slot start
  endTime: "10:00",                        // Time slot end
  room: "A101",
  isDeleted: false,
  deletedAt: null,
  createdAt: ISODate("2024-03-01T10:00:00Z"),
  updatedAt: ISODate("2024-03-01T10:00:00Z")
}
```

**Indexes**:
- `{ classId: 1, isDeleted: 1 }` - For fetching class schedules
- `{ date: 1 }` - For date-based queries
- `{ classId: 1, date: 1, isDeleted: 1 }` - Compound index for efficient lookups

#### AttendanceSession Collection
```javascript
{
  _id: ObjectId,
  classId: ObjectId,
  scheduleId: ObjectId,                    // Links to schedule
  date: ISODate("2024-03-15T00:00:00Z"),
  startTime: "08:00",
  endTime: "10:00",
  isDeleted: false,
  deletedAt: null,
  createdAt: ISODate("2024-03-01T10:00:00Z"),
  updatedAt: ISODate("2024-03-01T10:00:00Z")
}
```

**Indexes**:
- `{ scheduleId: 1 }` - For schedule-to-session lookup
- `{ classId: 1, date: 1, isDeleted: 1 }` - For finding sessions by class and date
- `{ date: -1 }` - For date-based sorting

#### AttendanceRecord Collection (No Changes)
```javascript
{
  _id: ObjectId,
  sessionId: ObjectId,
  studentId: ObjectId,
  status: "present",
  checkedAt: ISODate("2024-03-15T08:15:00Z"),
  checkInMethod: "manual",
  createdAt: ISODate("2024-03-15T08:15:00Z"),
  updatedAt: ISODate("2024-03-15T08:15:00Z")
}
```

**Indexes** (Existing):
- `{ sessionId: 1, studentId: 1 }` - Unique compound index to prevent duplicates

### Data Relationships

```
Class (1) ──────< (N) Schedule
                        │
                        │ (1:1 auto-created)
                        │
                        ▼
                  AttendanceSession
                        │
                        │
                        ▼
                  AttendanceRecord (N)
                        │
                        │
                        ▼
                  User (Student)
```

### Migration Strategy

To migrate from the old `dayOfWeek`-based system to the new date-based system:

1. **Preserve Existing Data**: Keep old Schedule records with `dayOfWeek` field
2. **Add Migration Flag**: Add `isMigrated` boolean field to identify old vs new schedules
3. **Dual Support Period**: Support both old and new formats during transition
4. **Data Transformation**: Create migration script to convert recurring schedules to specific dates
5. **Gradual Rollout**: Allow teachers to create new date-based schedules while old ones remain

Migration script pseudocode:
```javascript
// For each old schedule with dayOfWeek
for (const oldSchedule of oldSchedules) {
  // Generate specific dates for remaining semester
  const dates = generateDatesForDayOfWeek(
    oldSchedule.dayOfWeek,
    oldSchedule.startDate,
    oldSchedule.endDate
  );
  
  // Create new date-based schedules
  for (const date of dates) {
    await createScheduleWithSession({
      classId: oldSchedule.classId,
      date: date,
      startTime: oldSchedule.startTime,
      endTime: oldSchedule.endTime,
      room: oldSchedule.room
    });
  }
  
  // Mark old schedule as migrated
  oldSchedule.isMigrated = true;
  await oldSchedule.save();
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas of redundancy:

1. **Data Completeness Properties**: Multiple criteria check that created records contain required fields (1.2, 2.4, 3.3, 9.2). These can be combined into comprehensive properties per entity type.

2. **Persistence Properties**: Several criteria test round-trip persistence (1.6, 9.1). These follow the same pattern and can be unified.

3. **Validation Properties**: Multiple criteria test input validation (1.4, 1.5, 8.1-8.6). These can be grouped by validation type.

4. **Retrieval Properties**: Criteria 5.1 and 6.1 are identical (retrieve all schedules for a class).

5. **Time-Based Validation**: Criteria 4.1, 4.2, 4.5 all test time window validation from different angles. These can be combined into a single comprehensive property.

The following properties represent the unique, non-redundant correctness guarantees after reflection:

### Property 1: Schedule Date-Based Storage

*For any* schedule created by a teacher, the stored record SHALL contain a `date` field (not `dayOfWeek`) representing the specific scheduled date.

**Validates: Requirements 1.1**

### Property 2: Schedule Data Completeness

*For any* schedule created, the stored record SHALL contain all required fields: `classId`, `date`, `startTime`, `endTime`, and timestamps (`createdAt`, `updatedAt`).

**Validates: Requirements 1.2, 1.3**

### Property 3: Schedule Persistence Round-Trip

*For any* valid schedule data, creating a schedule and then querying the database by its ID SHALL return an equivalent schedule object with all fields preserved.

**Validates: Requirements 1.6**

### Property 4: Past Date Rejection

*For any* date that is before the current date, attempting to create a schedule with that date SHALL fail with a validation error.

**Validates: Requirements 1.4**

### Property 5: Time Range Validation

*For any* schedule where `endTime` is not after `startTime`, the system SHALL reject the schedule creation with a validation error.

**Validates: Requirements 1.5**

### Property 6: Invalid Class Reference Rejection

*For any* `classId` that does not reference an existing, non-deleted class, schedule creation SHALL fail with a validation error.

**Validates: Requirements 8.3**

### Property 7: Teacher Permission Validation

*For any* teacher user who is not the owner of a class (and is not an admin), attempting to create a schedule for that class SHALL fail with an authorization error.

**Validates: Requirements 8.4**

### Property 8: Validation Error Response Format

*For any* schedule creation request that fails validation, the response SHALL include `success: false` and a descriptive error message.

**Validates: Requirements 8.5, 8.6**

### Property 9: Automatic Session Creation

*For any* successfully created schedule, exactly one `AttendanceSession` SHALL be automatically created with a `scheduleId` referencing the schedule.

**Validates: Requirements 2.1**

### Property 10: Session-Schedule Linkage

*For any* auto-created `AttendanceSession`, it SHALL have a `scheduleId` matching the schedule's `_id`, a `classId` matching the schedule's `classId`, and a `date` matching the schedule's `date`.

**Validates: Requirements 2.2**

### Property 11: Session Data Completeness

*For any* created `AttendanceSession`, it SHALL contain all required fields: `classId`, `scheduleId`, `date`, `startTime`, `endTime`, and a `createdAt` timestamp.

**Validates: Requirements 2.4**

### Property 12: Check-In Record Creation

*For any* valid student check-in action, an `AttendanceRecord` SHALL be created with `sessionId`, `studentId`, `status`, `checkedAt` timestamp, and `checkInMethod`.

**Validates: Requirements 3.2, 3.3, 9.2**

### Property 13: Check-In Persistence Round-Trip

*For any* student check-in, creating the `AttendanceRecord` and then querying by `sessionId` and `studentId` SHALL return the same record with all fields preserved.

**Validates: Requirements 9.1**

### Property 14: Duplicate Check-In Prevention

*For any* student and session pair, attempting to check in twice SHALL result in the second attempt failing, and only one `AttendanceRecord` SHALL exist in the database.

**Validates: Requirements 3.6**

### Property 15: Time Window Check-In Validation

*For any* check-in attempt, it SHALL succeed if and only if the current server time is on the scheduled date and between `startTime` and `endTime` (inclusive).

**Validates: Requirements 4.1, 4.2, 4.5**

### Property 16: Session Status Calculation - Upcoming

*For any* session where the current server time is before the scheduled date or before `startTime` on the scheduled date, the calculated status SHALL be "upcoming".

**Validates: Requirements 4.3, 4.6, 10.1**

### Property 17: Session Status Calculation - Active

*For any* session where the current server time is on the scheduled date and between `startTime` and `endTime`, the calculated status SHALL be "active".

**Validates: Requirements 4.3, 4.6, 10.1**

### Property 18: Session Status Calculation - Expired

*For any* session where the current server time is after `endTime` on the scheduled date or after the scheduled date, the calculated status SHALL be "expired".

**Validates: Requirements 4.3, 4.5, 4.6, 10.1**

### Property 19: Server Time Authority

*For any* status calculation or time-based validation, the system SHALL use the current server time (not client time) as the authoritative time source.

**Validates: Requirements 10.5**

### Property 20: Schedule Retrieval Completeness

*For any* class with N non-deleted schedules, retrieving schedules for that class SHALL return all N schedules.

**Validates: Requirements 5.1, 6.1**

### Property 21: Schedule Ordering

*For any* list of schedules returned by the system, they SHALL be ordered by `date` ascending, then by `startTime` ascending.

**Validates: Requirements 5.2**

### Property 22: Schedule Response Data Completeness

*For any* schedule in a retrieval response, it SHALL include `date`, `startTime`, `endTime`, and a calculated `status` field.

**Validates: Requirements 5.3**

### Property 23: Student Check-In Status Inclusion

*For any* schedule retrieval by a student, each schedule SHALL include a boolean indicator of whether that student has checked in for the associated session.

**Validates: Requirements 5.4**

### Property 24: Session Check-In Count

*For any* session with N `AttendanceRecord` entries, the check-in count returned to teachers SHALL equal N.

**Validates: Requirements 6.2**

### Property 25: Session Records Retrieval

*For any* session, teachers SHALL be able to retrieve all `AttendanceRecord` entries with populated student details (`name`, `email`, `studentCode`) and `checkedAt` timestamps.

**Validates: Requirements 6.3, 6.4**

### Property 26: Future Schedule Deletion

*For any* schedule where the scheduled date is in the future (after current server date), teachers SHALL be able to soft-delete the schedule and its associated session.

**Validates: Requirements 6.5**

### Property 27: Past Schedule Deletion Prevention

*For any* schedule where the scheduled date is in the past or is today, attempting to delete the schedule SHALL fail with an error.

**Validates: Requirements 6.5**

### Property 28: Migration Data Transformation

*For any* old schedule with `dayOfWeek` field, the migration function SHALL create new date-based schedules with `date` fields for each occurrence within the date range.

**Validates: Requirements 7.1**

### Property 29: Migration Attendance Record Preservation

*For any* migration operation, all existing `AttendanceRecord` entries SHALL remain unchanged in the database with the same `_id`, `sessionId`, `studentId`, and `checkedAt` values.

**Validates: Requirements 7.2**

### Property 30: Referential Integrity Maintenance

*For any* schedule in the system, its associated session SHALL have a valid `scheduleId` reference, and all attendance records SHALL have valid `sessionId` references to existing sessions.

**Validates: Requirements 7.3**

### Property 31: Attendance Record Persistence Over Time

*For any* `AttendanceRecord`, it SHALL remain in the database and be retrievable regardless of whether its associated session is upcoming, active, or expired.

**Validates: Requirements 9.3**

### Property 32: Historical Data Retrieval by Class

*For any* class and date range filter, the system SHALL return all `AttendanceRecord` entries for sessions belonging to that class within the date range.

**Validates: Requirements 9.4**

### Property 33: Historical Data Retrieval by Student

*For any* student and date range filter, the system SHALL return all `AttendanceRecord` entries for that student within the date range.

**Validates: Requirements 9.4**

### Property 34: Check-In Transaction Atomicity

*For any* check-in operation that encounters an error, no partial `AttendanceRecord` SHALL be persisted to the database (all-or-nothing).

**Validates: Requirements 9.5**

### Property 35: Enrollment Validation for Check-In

*For any* student who is not enrolled in a class, attempting to check in to a session for that class SHALL fail with an authorization error.

**Validates: Requirements 3.2 (implicit enrollment requirement)**

## Error Handling

### Error Categories

The system handles errors in the following categories:

#### 1. Validation Errors (400 Bad Request)
- **Invalid Date Format**: Date is not in ISO format or is unparseable
- **Invalid Time Format**: Time is not in "HH:MM" format
- **Past Date**: Schedule date is before current date
- **Invalid Time Range**: End time is not after start time
- **Invalid Class Reference**: Class ID does not exist or is deleted
- **Invalid Student Reference**: Student ID does not exist or is not a student role

**Example Response**:
```json
{
  "success": false,
  "message": "Schedule date cannot be in the past",
  "code": "PAST_DATE_ERROR"
}
```

#### 2. Authorization Errors (403 Forbidden)
- **Teacher Permission Denied**: Teacher attempting to create schedule for class they don't own
- **Student Not Enrolled**: Student attempting to check in to class they're not enrolled in
- **Role Insufficient**: User role lacks permission for the operation

**Example Response**:
```json
{
  "success": false,
  "message": "You do not have permission to create schedules for this class",
  "code": "PERMISSION_DENIED"
}
```

#### 3. Business Logic Errors (400 Bad Request)
- **Duplicate Check-In**: Student attempting to check in twice for same session
- **Outside Time Window**: Check-in attempted before start time or after end time
- **Session Expired**: Check-in attempted after session end time
- **Session Not Started**: Check-in attempted before session start time
- **Cannot Delete Past Schedule**: Attempting to delete schedule for past date

**Example Response**:
```json
{
  "success": false,
  "message": "You have already checked in for this session",
  "code": "DUPLICATE_CHECKIN"
}
```

#### 4. Not Found Errors (404 Not Found)
- **Schedule Not Found**: Schedule ID does not exist or is deleted
- **Session Not Found**: Session ID does not exist or is deleted
- **Class Not Found**: Class ID does not exist or is deleted

**Example Response**:
```json
{
  "success": false,
  "message": "Schedule not found",
  "code": "NOT_FOUND"
}
```

#### 5. Server Errors (500 Internal Server Error)
- **Database Connection Error**: Cannot connect to MongoDB
- **Transaction Failure**: Database transaction failed to commit
- **Unexpected Error**: Unhandled exception

**Example Response**:
```json
{
  "success": false,
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR"
}
```

### Error Handling Patterns

#### Controller Level
```javascript
try {
  // Validate input
  const validation = await validateScheduleInput(data);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: validation.message,
      code: validation.code
    });
  }
  
  // Execute business logic
  const result = await scheduleService.createScheduleWithSession(data);
  
  return res.status(201).json({
    success: true,
    data: result
  });
} catch (error) {
  // Log error for debugging
  console.error('Schedule creation error:', error);
  
  // Return generic error to client
  return res.status(500).json({
    success: false,
    message: 'Failed to create schedule',
    code: 'INTERNAL_ERROR'
  });
}
```

#### Service Level
```javascript
async createScheduleWithSession(classId, scheduleData, userId) {
  // Start database transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create schedule
    const schedule = await Schedule.create([scheduleData], { session });
    
    // Auto-create attendance session
    const attendanceSession = await AttendanceSession.create([{
      classId: schedule[0].classId,
      scheduleId: schedule[0]._id,
      date: schedule[0].date,
      startTime: schedule[0].startTime,
      endTime: schedule[0].endTime
    }], { session });
    
    // Commit transaction
    await session.commitTransaction();
    
    return {
      schedule: schedule[0],
      session: attendanceSession[0]
    };
  } catch (error) {
    // Rollback on error
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
```

#### Validation Level
```javascript
async validateScheduleInput(classId, scheduleData, userId) {
  // Check date format
  const date = new Date(scheduleData.date);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      message: 'Invalid date format',
      code: 'INVALID_DATE_FORMAT'
    };
  }
  
  // Check date is not in past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return {
      valid: false,
      message: 'Schedule date cannot be in the past',
      code: 'PAST_DATE_ERROR'
    };
  }
  
  // Check time format and range
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(scheduleData.startTime) || !timeRegex.test(scheduleData.endTime)) {
    return {
      valid: false,
      message: 'Invalid time format. Use HH:MM',
      code: 'INVALID_TIME_FORMAT'
    };
  }
  
  if (scheduleData.endTime <= scheduleData.startTime) {
    return {
      valid: false,
      message: 'End time must be after start time',
      code: 'INVALID_TIME_RANGE'
    };
  }
  
  // Check class exists
  const classExists = await Class.findById(classId);
  if (!classExists || classExists.isDeleted) {
    return {
      valid: false,
      message: 'Class not found',
      code: 'CLASS_NOT_FOUND'
    };
  }
  
  // Check teacher permission
  if (userId.role !== 'admin' && classExists.teacherId.toString() !== userId._id.toString()) {
    return {
      valid: false,
      message: 'You do not have permission to create schedules for this class',
      code: 'PERMISSION_DENIED'
    };
  }
  
  return { valid: true };
}
```

### Error Recovery Strategies

1. **Transaction Rollback**: All multi-step operations use database transactions to ensure atomicity
2. **Idempotency**: Check-in operations check for existing records before creating new ones
3. **Graceful Degradation**: If status calculation fails, return basic schedule data without status
4. **Retry Logic**: Database connection errors trigger automatic retry with exponential backoff
5. **Audit Logging**: All errors are logged with context for debugging and monitoring

## Testing Strategy

### Dual Testing Approach

This feature requires both unit testing and property-based testing for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs through randomization

Both approaches are complementary and necessary. Unit tests catch concrete bugs in specific scenarios, while property tests verify general correctness across a wide input space.

### Property-Based Testing

**Library Selection**: Use `fast-check` for JavaScript/Node.js property-based testing

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each test must reference its design document property
- Tag format: `Feature: simplified-date-based-attendance, Property {number}: {property_text}`

**Example Property Test Structure**:
```javascript
const fc = require('fast-check');

describe('Feature: simplified-date-based-attendance', () => {
  describe('Property 1: Schedule Date-Based Storage', () => {
    it('should store schedules with date field (not dayOfWeek)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.date({ min: new Date() }), // Future dates only
          fc.record({
            startTime: fc.constantFrom('08:00', '09:00', '10:00'),
            endTime: fc.constantFrom('10:00', '11:00', '12:00'),
            room: fc.string()
          }),
          async (date, scheduleData) => {
            // Arrange: Create class and teacher
            const classId = await createTestClass();
            const teacherId = await createTestTeacher(classId);
            
            // Act: Create schedule
            const schedule = await scheduleService.createScheduleWithSession(
              classId,
              { ...scheduleData, date },
              teacherId
            );
            
            // Assert: Schedule has date field, not dayOfWeek
            expect(schedule.schedule).toHaveProperty('date');
            expect(schedule.schedule).not.toHaveProperty('dayOfWeek');
            expect(schedule.schedule.date).toEqual(date);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
  
  describe('Property 14: Duplicate Check-In Prevention', () => {
    it('should prevent duplicate check-ins for same student and session', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }), // Student ID
          fc.integer({ min: 1, max: 100 }), // Session ID
          async (studentId, sessionId) => {
            // Arrange: Create session and enroll student
            await setupSessionAndEnrollment(sessionId, studentId);
            
            // Act: Check in twice
            const firstCheckIn = await attendanceService.checkInStudent(sessionId, studentId);
            const secondCheckIn = await attendanceService.checkInStudent(sessionId, studentId);
            
            // Assert: First succeeds, second fails
            expect(firstCheckIn.success).toBe(true);
            expect(secondCheckIn.success).toBe(false);
            
            // Assert: Only one record exists
            const records = await AttendanceRecord.find({ sessionId, studentId });
            expect(records).toHaveLength(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
```

### Unit Testing

**Focus Areas**:
- Specific date/time edge cases (midnight, end of day)
- Specific error messages and codes
- Integration between controllers and services
- Database transaction rollback scenarios
- Specific time zone handling

**Example Unit Test Structure**:
```javascript
describe('Schedule Creation', () => {
  it('should reject schedule with past date', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const result = await request(app)
      .post('/api/classes/123/schedules')
      .send({
        date: yesterday,
        startTime: '08:00',
        endTime: '10:00'
      });
    
    expect(result.status).toBe(400);
    expect(result.body.code).toBe('PAST_DATE_ERROR');
  });
  
  it('should create schedule and session atomically', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await request(app)
      .post('/api/classes/123/schedules')
      .send({
        date: tomorrow,
        startTime: '08:00',
        endTime: '10:00'
      });
    
    expect(result.status).toBe(201);
    expect(result.body.data.schedule).toBeDefined();
    expect(result.body.data.session).toBeDefined();
    expect(result.body.data.session.scheduleId).toBe(result.body.data.schedule._id);
  });
});

describe('Time-Based Check-In Validation', () => {
  it('should allow check-in during time window', async () => {
    // Mock current time to be within window
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T08:30:00'));
    
    const result = await request(app)
      .post('/api/classes/123/attendance/check-in')
      .set('Authorization', 'Bearer student-token');
    
    expect(result.status).toBe(200);
    expect(result.body.success).toBe(true);
    
    jest.useRealTimers();
  });
  
  it('should reject check-in before start time', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-15T07:30:00'));
    
    const result = await request(app)
      .post('/api/classes/123/attendance/check-in')
      .set('Authorization', 'Bearer student-token');
    
    expect(result.status).toBe(400);
    expect(result.body.code).toBe('SESSION_NOT_STARTED');
    
    jest.useRealTimers();
  });
});
```

### Test Coverage Goals

- **Line Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 75%
- **Property Tests**: All 35 correctness properties implemented
- **Unit Tests**: All error codes and edge cases covered
- **Integration Tests**: All API endpoints tested with realistic scenarios

### Testing Tools

- **Unit Testing**: Jest
- **Property-Based Testing**: fast-check
- **API Testing**: Supertest
- **Database Testing**: MongoDB Memory Server
- **Mocking**: Jest mocks for time, external services
- **Coverage**: Jest coverage reporter

### Continuous Integration

All tests run on:
- Every pull request
- Every commit to main branch
- Nightly full test suite with extended property test iterations (1000+ runs)

