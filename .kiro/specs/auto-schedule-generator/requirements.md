# Requirements Document

## Introduction

Tính năng Tự Động Tạo Lịch Học cho phép giáo viên tạo lịch học cho cả học kỳ một cách tự động, thay vì phải tạo từng buổi học thủ công. Hệ thống sẽ tính toán số tiết còn lại, render danh sách buổi học dựa trên nhóm thứ đã chọn, và tự động đánh dấu tiết cuối cùng là tiết thi.

## Glossary

- **Schedule_Generator**: Hệ thống tự động tạo lịch học
- **Class**: Khóa học/lớp học trong hệ thống
- **Lesson**: Một tiết học/buổi học
- **Schedule**: Lịch học đã được tạo và lưu trong database
- **Teacher**: Giáo viên sử dụng hệ thống
- **Student**: Sinh viên thuộc lớp học
- **Modal**: Cửa sổ popup để nhập thông tin tạo lịch
- **Day_Group**: Nhóm thứ học (Thứ 2-4-6 hoặc Thứ 3-5-7)
- **Session**: Ca học (Sáng hoặc Chiều)
- **Exam_Lesson**: Tiết thi/kiểm tra (tiết cuối cùng)

## Requirements

### Requirement 1: Tính toán số tiết còn lại

**User Story:** As a Teacher, I want to see how many lessons remain to be scheduled, so that I know if I can create more schedules

#### Acceptance Criteria

1. WHEN a Teacher opens the schedule creation feature for a Class, THE Schedule_Generator SHALL calculate remaining lessons as (totalLessons - scheduledLessons)
2. THE Schedule_Generator SHALL display the total lessons, scheduled lessons, and remaining lessons to the Teacher
3. IF scheduledLessons equals totalLessons, THEN THE Schedule_Generator SHALL disable the create schedule button
4. IF scheduledLessons equals totalLessons, THEN THE Schedule_Generator SHALL display a message "Đã lên lịch đầy đủ"
5. THE Schedule_Generator SHALL retrieve totalLessons and scheduledLessons from the Class document in the database

### Requirement 2: Hiển thị Modal nhập thông tin lịch học

**User Story:** As a Teacher, I want to input schedule parameters in a modal, so that I can configure how the automatic schedule should be generated

#### Acceptance Criteria

1. WHEN a Teacher clicks the create schedule button, THE Schedule_Generator SHALL display a Modal with input fields
2. THE Modal SHALL display the Class name, subject name, total lessons, scheduled lessons, and remaining lessons
3. THE Modal SHALL provide a date picker for selecting the start date
4. THE Modal SHALL provide radio buttons for selecting Day_Group with two options: "Thứ 2-4-6" and "Thứ 3-5-7"
5. THE Modal SHALL provide radio buttons for selecting Session with two options: "Sáng (07:30-11:30)" and "Chiều (13:30-17:30)"
6. THE Modal SHALL provide a text input field for entering the classroom name
7. THE Modal SHALL provide a preview button and a confirm button
8. WHEN any required field is empty, THE Schedule_Generator SHALL disable the preview and confirm buttons

### Requirement 3: Tự động render danh sách buổi học

**User Story:** As a Teacher, I want to preview the generated schedule before confirming, so that I can verify the dates and times are correct

#### Acceptance Criteria

1. WHEN a Teacher clicks the preview button, THE Schedule_Generator SHALL generate a list of Lessons based on the input parameters
2. THE Schedule_Generator SHALL start from the selected start date and iterate through subsequent dates
3. THE Schedule_Generator SHALL include only dates that match the selected Day_Group
4. THE Schedule_Generator SHALL generate exactly the number of remaining lessons
5. THE Schedule_Generator SHALL assign the selected Session time to all generated Lessons
6. THE Schedule_Generator SHALL assign the entered classroom name to all generated Lessons
7. THE Schedule_Generator SHALL mark the last Lesson as an Exam_Lesson
8. THE Schedule_Generator SHALL display the preview list showing lesson number, date, day of week, time, and classroom for each Lesson
9. THE Schedule_Generator SHALL display a summary showing the count of regular lessons and exam lessons

### Requirement 4: Xác nhận và lưu lịch học vào database

**User Story:** As a Teacher, I want to save the generated schedule to the database, so that Students can see their class schedule

#### Acceptance Criteria

1. WHEN a Teacher clicks the confirm button, THE Schedule_Generator SHALL insert all generated Lessons into the schedules collection
2. THE Schedule_Generator SHALL create one document in the schedules collection for each Lesson
3. THE Schedule_Generator SHALL update the Class document by incrementing scheduledLessons by the number of newly created Lessons
4. WHEN the save operation completes successfully, THE Schedule_Generator SHALL display a success message
5. WHEN the save operation completes successfully, THE Schedule_Generator SHALL close the Modal
6. IF the save operation fails, THEN THE Schedule_Generator SHALL display an error message and keep the Modal open
7. THE Schedule_Generator SHALL ensure that Students enrolled in the Class can immediately view the newly created Schedules

### Requirement 5: Validation và xử lý lỗi

**User Story:** As a Teacher, I want the system to prevent invalid schedule creation, so that I don't accidentally create incorrect schedules

#### Acceptance Criteria

1. THE Schedule_Generator SHALL validate that the start date is not in the past
2. THE Schedule_Generator SHALL validate that all required fields are filled before allowing preview or confirmation
3. THE Schedule_Generator SHALL prevent creating more Lessons than the remaining lesson count
4. IF totalLessons is not set for a Class, THEN THE Schedule_Generator SHALL display an error message and prevent schedule creation
5. THE Schedule_Generator SHALL validate that the classroom name contains only valid characters
6. WHEN validation fails, THE Schedule_Generator SHALL display a specific error message indicating which field is invalid

### Requirement 6: Cập nhật Class model

**User Story:** As a system, I need to track scheduled lessons in the Class model, so that the schedule generator can calculate remaining lessons

#### Acceptance Criteria

1. THE Class model SHALL include a totalLessons field of type Number
2. THE Class model SHALL include a scheduledLessons field of type Number with default value 0
3. WHEN a new Class is created, THE scheduledLessons field SHALL be initialized to 0
4. THE Class model SHALL ensure that scheduledLessons never exceeds totalLessons
5. THE Class model SHALL allow updating scheduledLessons through the schedule creation process

### Requirement 7: API endpoints cho tạo lịch tự động

**User Story:** As a frontend application, I need API endpoints to create schedules automatically, so that I can communicate with the backend

#### Acceptance Criteria

1. THE backend SHALL provide an endpoint to retrieve remaining lesson count for a Class
2. THE backend SHALL provide an endpoint to bulk insert multiple Schedule documents
3. THE bulk insert endpoint SHALL accept an array of Schedule objects and a Class ID
4. THE bulk insert endpoint SHALL validate that the number of schedules does not exceed remaining lessons
5. THE bulk insert endpoint SHALL update the Class scheduledLessons field atomically with the schedule insertion
6. IF the bulk insert fails, THEN THE backend SHALL rollback all changes and return an error response
7. THE backend SHALL return the created Schedule documents in the response

### Requirement 8: Tích hợp với chức năng điểm danh

**User Story:** As a Student, I want to see the automatically generated schedules in my timetable, so that I can attend classes and mark attendance

#### Acceptance Criteria

1. WHEN Schedules are created by the Schedule_Generator, THE system SHALL make them immediately visible to enrolled Students
2. THE system SHALL allow Students to mark attendance for each automatically created Schedule
3. THE system SHALL display the Exam_Lesson indicator for the last lesson in the Student timetable
4. THE automatically created Schedules SHALL function identically to manually created Schedules for attendance purposes
