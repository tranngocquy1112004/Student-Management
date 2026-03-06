# PHÂN TÍCH THIẾT KẾ HỆ THỐNG - Hệ thống Quản lý Lớp học

> Tài liệu này cung cấp thông tin chi tiết để xây dựng ERD (Entity Relationship Diagram) và Use Case Diagram cho hệ thống quản lý lớp học.

## MỤC LỤC

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Actors (Tác nhân)](#2-actors-tác-nhân)
3. [Entities (Thực thể)](#3-entities-thực-thể)
4. [Relationships (Quan hệ)](#4-relationships-quan-hệ)
5. [Use Cases (Ca sử dụng)](#5-use-cases-ca-sử-dụng)
6. [Business Rules (Quy tắc nghiệp vụ)](#6-business-rules-quy-tắc-nghiệp-vụ)
7. [Data Flow (Luồng dữ liệu)](#7-data-flow-luồng-dữ-liệu)

---

## 1. TỔNG QUAN HỆ THỐNG

### 1.1. Mục đích
Hệ thống quản lý lớp học toàn diện cho trường đại học, hỗ trợ:
- Quản lý người dùng (Admin, Teacher, Student)
- Quản lý học tập (Lớp học, Bài tập, Điểm số)
- Quản lý điểm danh (QR Code, Thủ công)
- Quản lý kỷ luật (Cảnh cáo, Đuổi học, Kháng cáo)
- Giao tiếp real-time (Chat, Thông báo)

### 1.2. Phạm vi
- Backend: REST API + Socket.io
- Frontend: React SPA
- Database: MongoDB (NoSQL)
- Authentication: JWT (Access Token + Refresh Token)


---

## 2. ACTORS (TÁC NHÂN)

### 2.1. Admin (Quản trị viên)
**Vai trò**: Quản trị toàn bộ hệ thống
**Quyền hạn**:
- Quản lý tài khoản (Teacher, Student)
- Quản lý khoa, môn học, lớp học
- Duyệt bảo lưu, kỷ luật, đuổi học
- Xem tất cả báo cáo và thống kê
- Gửi thông báo hệ thống

### 2.2. Teacher (Giảng viên)
**Vai trò**: Giảng dạy và quản lý lớp học
**Quyền hạn**:
- Quản lý lớp học được phân công
- Tạo và chấm bài tập
- Điểm danh sinh viên
- Nhập điểm (QT, GK, CK)
- Tạo lịch học
- Báo cáo vi phạm sinh viên
- Gửi thông báo cho lớp

### 2.3. Student (Sinh viên)
**Vai trò**: Học tập và tham gia các hoạt động
**Quyền hạn**:
- Xem lớp học đã ghi danh
- Nộp bài tập
- Điểm danh (QR Code hoặc trực tiếp)
- Xem điểm số
- Xem lịch học
- Xin bảo lưu
- Kháng cáo quyết định đuổi học
- Chat với giảng viên/sinh viên khác


---

## 3. ENTITIES (THỰC THỂ)

### 3.1. User (Người dùng)
**Primary Key**: `_id`
**Attributes**:
- `name`: String (required) - Họ tên
- `email`: String (required, unique) - Email đăng nhập
- `password`: String (required, hashed) - Mật khẩu
- `role`: Enum (admin, teacher, student) - Vai trò
- `avatar`: String - URL ảnh đại diện
- `phone`: String - Số điện thoại
- `studentCode`: String (unique) - Mã sinh viên
- `teacherCode`: String (unique) - Mã giảng viên
- `isLocked`: Boolean - Trạng thái khóa
- `status`: Enum (active, on_leave, dismissed, suspended) - Trạng thái
- `isDeleted`: Boolean - Soft delete
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `email` (unique)
- `role`
- `studentCode` (unique, sparse)
- `teacherCode` (unique, sparse)
- `(role, isDeleted)` (compound)


### 3.2. Student (Sinh viên)
**Primary Key**: `_id`
**Foreign Keys**: `userId` → User._id
**Attributes**:
- `userId`: ObjectId (required, unique) - Tham chiếu User
- `studentCode`: String (required, unique) - Mã sinh viên
- `facultyId`: ObjectId - Tham chiếu Faculty
- `dateOfBirth`: Date - Ngày sinh
- `address`: String - Địa chỉ
- `phone`: String - Số điện thoại
- `gpa`: Number - Điểm trung bình tích lũy
- `enrollmentYear`: Number - Năm nhập học
- `status`: Enum (active, on_leave, dismissed, suspended)
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `userId` (unique)
- `studentCode` (unique)
- `facultyId`

### 3.3. Teacher (Giảng viên)
**Primary Key**: `_id`
**Foreign Keys**: `userId` → User._id
**Attributes**:
- `userId`: ObjectId (required, unique) - Tham chiếu User
- `teacherCode`: String (required, unique) - Mã giảng viên
- `facultyId`: ObjectId - Tham chiếu Faculty
- `department`: String - Bộ môn
- `degree`: String - Học vị (Thạc sĩ, Tiến sĩ)
- `specialization`: String - Chuyên môn
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `userId` (unique)
- `teacherCode` (unique)
- `facultyId`


### 3.4. Faculty (Khoa)
**Primary Key**: `_id`
**Attributes**:
- `name`: String (required) - Tên khoa
- `code`: String (unique) - Mã khoa
- `description`: String - Mô tả
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `code` (unique)

### 3.5. Subject (Môn học)
**Primary Key**: `_id`
**Foreign Keys**: `facultyId` → Faculty._id
**Attributes**:
- `name`: String (required) - Tên môn học
- `code`: String (unique) - Mã môn học
- `credits`: Number (default: 3) - Số tín chỉ
- `facultyId`: ObjectId - Tham chiếu Faculty
- `description`: String - Mô tả
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `code` (unique)
- `facultyId`

### 3.6. Class (Lớp học)
**Primary Key**: `_id`
**Foreign Keys**: 
- `subjectId` → Subject._id
- `teacherId` → User._id
**Attributes**:
- `name`: String (required) - Tên lớp
- `code`: String (unique) - Mã lớp
- `subjectId`: ObjectId (required) - Tham chiếu Subject
- `teacherId`: ObjectId (required) - Tham chiếu Teacher
- `semester`: String (required) - Học kỳ (HK1, HK2, HK3)
- `year`: String (required) - Năm học (2023-2024)
- `status`: Enum (active, closed, upcoming) - Trạng thái
- `maxStudents`: Number (default: 50) - Số sinh viên tối đa
- `totalLessons`: Number - Tổng số buổi học
- `scheduledLessons`: Number (default: 0) - Số buổi đã lên lịch
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `teacherId`
- `subjectId`
- `(teacherId, isDeleted)` (compound)

**Business Rules**:
- `scheduledLessons` ≤ `totalLessons`


### 3.7. Enrollment (Ghi danh)
**Primary Key**: `_id`
**Foreign Keys**: 
- `classId` → Class._id
- `studentId` → User._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `studentId`: ObjectId (required) - Tham chiếu Student
- `status`: Enum (active, completed, dropped, on_leave) - Trạng thái
- `enrolledAt`: Date (default: now) - Thời gian ghi danh
- `completedAt`: Date - Thời gian hoàn thành
- `cancelledAt`: Date - Thời gian hủy
- `cancelReason`: String - Lý do hủy
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `(classId, studentId)` (unique, compound)
- `studentId`
- `classId`
- `(studentId, status)` (compound)

### 3.8. Assignment (Bài tập)
**Primary Key**: `_id`
**Foreign Keys**: `classId` → Class._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `title`: String (required) - Tiêu đề
- `description`: String - Mô tả
- `deadline`: Date (required) - Hạn nộp
- `maxScore`: Number (default: 10) - Điểm tối đa
- `type`: Enum (individual, group) - Loại bài tập
- `mode`: Enum (file, quiz) - Hình thức (file/trắc nghiệm)
- `durationMinutes`: Number (default: 60) - Thời gian làm bài
- `status`: Enum (draft, published, closed) - Trạng thái
- `attachments`: Array [{url, name}] - File đính kèm
- `lockedStudents`: Array [{studentId, lockedAt, reason}] - Sinh viên bị khóa
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `classId`
- `(classId, isDeleted)` (compound)
- `deadline` (descending)


### 3.9. Question (Câu hỏi trắc nghiệm)
**Primary Key**: `_id`
**Foreign Keys**: `assignmentId` → Assignment._id
**Attributes**:
- `assignmentId`: ObjectId (required) - Tham chiếu Assignment
- `content`: String (required) - Nội dung câu hỏi
- `options`: Array [{text, isCorrect}] - Các lựa chọn
- `type`: Enum (single, multiple) - Loại câu hỏi
- `points`: Number (default: 1) - Điểm
- `order`: Number - Thứ tự hiển thị
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `assignmentId`
- `(assignmentId, order)` (compound)

### 3.10. Submission (Bài nộp)
**Primary Key**: `_id`
**Foreign Keys**: 
- `assignmentId` → Assignment._id
- `studentId` → User._id
- `gradedBy` → User._id
**Attributes**:
- `assignmentId`: ObjectId (required) - Tham chiếu Assignment
- `studentId`: ObjectId (required) - Tham chiếu Student
- `content`: String - Nội dung bài làm
- `files`: Array [{url, name}] - File nộp
- `status`: Enum (submitted, late, graded) - Trạng thái
- `submittedAt`: Date - Thời gian nộp
- `score`: Number - Điểm đạt được
- `feedback`: String - Nhận xét
- `gradedBy`: ObjectId - Người chấm điểm
- `gradedAt`: Date - Thời gian chấm
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `assignmentId`
- `studentId`
- `(assignmentId, studentId)` (compound)


### 3.11. SubmissionAnswer (Câu trả lời trắc nghiệm)
**Primary Key**: `_id`
**Foreign Keys**: 
- `submissionId` → Submission._id
- `questionId` → Question._id
**Attributes**:
- `submissionId`: ObjectId (required) - Tham chiếu Submission
- `questionId`: ObjectId (required) - Tham chiếu Question
- `selectedOptions`: Array - Lựa chọn đã chọn
- `isCorrect`: Boolean - Đáp án đúng/sai
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `submissionId`
- `(submissionId, questionId)` (compound)

### 3.12. Gradebook (Bảng điểm)
**Primary Key**: `_id`
**Foreign Keys**: 
- `classId` → Class._id
- `studentId` → User._id
- `expulsionRecordId` → ExpulsionRecord._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `studentId`: ObjectId (required) - Tham chiếu Student
- `qt`: Number (default: 0) - Điểm quá trình
- `gk`: Number (default: 0) - Điểm giữa kỳ
- `ck`: Number (default: 0) - Điểm cuối kỳ
- `total`: Number (default: 0) - Điểm tổng kết (tự động tính)
- `averageScore`: Number (default: 0) - Điểm trung bình bài tập
- `dismissedMarker`: Object
  - `isDismissed`: Boolean - Đã đuổi học
  - `dismissedAt`: Date - Thời gian đuổi
  - `expulsionRecordId`: ObjectId - Tham chiếu ExpulsionRecord
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `(classId, studentId)` (unique, compound)
- `classId`

**Business Rules**:
- `total` = (`qt` × 0.3 + `gk` × 0.2 + `ck` × 0.5)
- Tự động tính trong pre-save hook


### 3.13. Schedule (Lịch học)
**Primary Key**: `_id`
**Foreign Keys**: `classId` → Class._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `date`: Date (required) - Ngày học
- `startTime`: String (required) - Giờ bắt đầu (HH:MM)
- `endTime`: String (required) - Giờ kết thúc (HH:MM)
- `room`: String - Phòng học
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `classId`
- `(classId, date)` (compound)
- `date` (descending)

### 3.14. AttendanceSession (Buổi điểm danh)
**Primary Key**: `_id`
**Foreign Keys**: 
- `classId` → Class._id
- `scheduleId` → Schedule._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `scheduleId`: ObjectId (required) - Tham chiếu Schedule
- `date`: Date (required) - Ngày điểm danh
- `startTime`: String (required) - Giờ bắt đầu (HH:MM)
- `endTime`: String (required) - Giờ kết thúc (HH:MM)
- `code`: String - Mã QR code (6 chữ số)
- `codeExpiredAt`: Date - Thời gian hết hạn QR
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `classId`
- `scheduleId`
- `(classId, date, isDeleted)` (compound)
- `date` (descending)

**Business Rules**:
- QR code: 6 chữ số ngẫu nhiên
- QR code hết hạn sau 5 phút
- Tự động tạo khi tạo Schedule


### 3.15. AttendanceRecord (Ghi nhận điểm danh)
**Primary Key**: `_id`
**Foreign Keys**: 
- `sessionId` → AttendanceSession._id
- `studentId` → User._id
**Attributes**:
- `sessionId`: ObjectId (required) - Tham chiếu AttendanceSession
- `studentId`: ObjectId (required) - Tham chiếu Student
- `status`: Enum (present, absent, late, excused) - Trạng thái
- `checkedAt`: Date - Thời gian điểm danh
- `checkInMethod`: Enum (manual, qr) - Phương thức
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `(sessionId, studentId)` (unique, compound)
- `sessionId`
- `studentId`

**Business Rules**:
- Mỗi sinh viên chỉ điểm danh 1 lần/buổi
- Late: Điểm danh sau 15 phút từ startTime

### 3.16. AttendanceWarning (Cảnh cáo điểm danh)
**Primary Key**: `_id`
**Foreign Keys**: 
- `studentId` → User._id
- `classId` → Class._id
**Attributes**:
- `studentId`: ObjectId (required) - Tham chiếu Student
- `classId`: ObjectId (required) - Tham chiếu Class
- `warningLevel`: Enum (warning, critical) - Mức độ
- `absenceRate`: Number (required) - Tỷ lệ vắng (0-100)
- `totalSessions`: Number (required) - Tổng số buổi
- `absentSessions`: Number (required) - Số buổi vắng
- `notifiedAt`: Date - Thời gian thông báo
- `isDeleted`: Boolean
- `createdAt`: Timestamp

**Indexes**:
- `studentId`
- `classId`
- `(studentId, classId)` (compound)

**Business Rules**:
- Warning: `absenceRate` > 20%
- Critical: `absenceRate` > 30%
- Tự động tạo khi tính tỷ lệ vắng


### 3.17. AcademicWarning (Cảnh cáo học thuật)
**Primary Key**: `_id`
**Foreign Keys**: 
- `studentId` → User._id
- `createdBy` → User._id
**Attributes**:
- `studentId`: ObjectId (required) - Tham chiếu Student
- `warningType`: Enum (low_gpa, probation) - Loại cảnh cáo
- `warningLevel`: Number (1, 2, 3) - Mức độ
- `gpa`: Number (required) - Điểm GPA
- `threshold`: Number (required) - Ngưỡng điểm
- `semester`: String (required) - Học kỳ
- `createdBy`: ObjectId - Người tạo
- `notifiedAt`: Date - Thời gian thông báo
- `createdAt`: Timestamp

**Indexes**:
- `studentId`
- `(studentId, semester)` (compound)
- `(warningLevel, createdAt)` (compound)

**Business Rules**:
- `gpa` < `threshold`
- Warning Level 1: GPA < 4.0
- Warning Level 2: GPA < 3.0
- Warning Level 3: GPA < 2.0

### 3.18. ExpulsionRecord (Quyết định đuổi học)
**Primary Key**: `_id`
**Foreign Keys**: 
- `studentId` → User._id
- `createdBy` → User._id
- `approvedBy` → User._id
- `appealReviewedBy` → User._id
**Attributes**:
- `studentId`: ObjectId (required) - Tham chiếu Student
- `reason`: String (required, min: 20, max: 2000) - Lý do
- `reasonType`: Enum (low_gpa, discipline_violation, excessive_absence, expired_leave)
- `effectiveDate`: Date (required) - Ngày có hiệu lực
- `attachments`: Array [{filename, path, uploadedAt}] - File đính kèm
- `notes`: String (max: 1000) - Ghi chú
- `status`: Enum (pending, active, appealed, revoked) - Trạng thái
- `appealStatus`: Enum (none, pending, approved, rejected) - Trạng thái kháng cáo
- `appealReason`: String (max: 2000) - Lý do kháng cáo
- `appealEvidence`: Array [{filename, path, uploadedAt}] - Bằng chứng kháng cáo
- `appealSubmittedAt`: Date - Thời gian nộp kháng cáo
- `appealReviewedBy`: ObjectId - Người xét kháng cáo
- `appealReviewedAt`: Date - Thời gian xét
- `appealReviewNote`: String (max: 1000) - Ghi chú xét kháng cáo
- `createdBy`: ObjectId (required) - Người tạo
- `emailSentAt`: Date - Thời gian gửi email
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `studentId`
- `(studentId, status)` (compound)
- `(status, createdAt)` (compound)
- `(reasonType, effectiveDate)` (compound)
- `(appealStatus, appealSubmittedAt)` (compound)

**Business Rules**:
- `effectiveDate` không được trong quá khứ (khi tạo mới)
- Sinh viên có quyền kháng cáo
- Khi approved: User.status = 'dismissed'


### 3.19. AcademicLeave (Bảo lưu)
**Primary Key**: `_id`
**Foreign Keys**: 
- `studentId` → User._id
- `approvedBy` → User._id
**Attributes**:
- `studentId`: ObjectId (required) - Tham chiếu Student
- `type`: Enum (medical, personal, family) - Loại nghỉ
- `reason`: String (required) - Lý do
- `startDate`: Date (required) - Ngày bắt đầu
- `endDate`: Date (required) - Ngày kết thúc
- `duration`: Number - Số ngày (tự động tính)
- `status`: Enum (pending, approved, rejected) - Trạng thái
- `approvedBy`: ObjectId - Người duyệt
- `approvedAt`: Date - Thời gian duyệt
- `rejectionReason`: String - Lý do từ chối
- `documents`: Array [{url, name, type}] - Giấy tờ
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `studentId`
- `status`
- `(studentId, status)` (compound)

**Business Rules**:
- `endDate` > `startDate`
- `duration` = days between startDate and endDate
- Khi approved: User.status = 'on_leave'
- Tự động khôi phục khi hết hạn

### 3.20. Conversation (Cuộc trò chuyện)
**Primary Key**: `_id`
**Attributes**:
- `participants`: Array [{userId, unreadCount, lastReadAt}] - Người tham gia
- `type`: Enum (direct, group, class) - Loại
- `classId`: ObjectId - Tham chiếu Class (nếu là chat lớp)
- `title`: String - Tiêu đề (cho nhóm)
- `lastMessage`: Object {content, senderId, timestamp} - Tin nhắn cuối
- `isActive`: Boolean (default: true) - Đang hoạt động
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `participants.userId`
- `(participants.userId, updatedAt)` (compound)
- `updatedAt` (descending)

**Business Rules**:
- Direct chat: Exactly 2 participants
- Participants phải unique
- Không cho phép chat với chính mình


### 3.21. Message (Tin nhắn)
**Primary Key**: `_id`
**Foreign Keys**: 
- `conversationId` → Conversation._id
- `senderId` → User._id
**Attributes**:
- `conversationId`: ObjectId (required) - Tham chiếu Conversation
- `senderId`: ObjectId (required) - Tham chiếu User
- `content`: String (required, min: 1, max: 1000) - Nội dung
- `timestamp`: Date (required, default: now) - Thời gian gửi
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `conversationId`
- `(conversationId, timestamp)` (compound, descending)

**Business Rules**:
- `timestamp` không được trong tương lai
- Sender phải là participant của conversation
- Max 1000 ký tự

### 3.22. Notification (Thông báo)
**Primary Key**: `_id`
**Foreign Keys**: 
- `recipientId` → User._id
- `senderId` → User._id
**Attributes**:
- `title`: String (required) - Tiêu đề
- `content`: String (required) - Nội dung
- `type`: Enum (info, warning, error, success) - Loại
- `recipientId`: ObjectId - Người nhận
- `senderId`: ObjectId - Người gửi
- `isRead`: Boolean (default: false) - Đã đọc
- `priority`: Enum (low, medium, high) - Mức độ ưu tiên
- `actionUrl`: String - Link hành động
- `expiresAt`: Date - Thời gian hết hạn
- `relatedId`: ObjectId - ID thực thể liên quan
- `relatedType`: String - Loại thực thể liên quan
- `isDeleted`: Boolean
- `createdAt`: Timestamp

**Indexes**:
- `recipientId`
- `(recipientId, isRead)` (compound)
- `(recipientId, createdAt)` (compound, descending)

**Business Rules**:
- Real-time qua Socket.io
- Tự động xóa khi hết hạn


### 3.23. Announcement (Thông báo lớp)
**Primary Key**: `_id`
**Foreign Keys**: 
- `classId` → Class._id
- `teacherId` → User._id
**Attributes**:
- `classId`: ObjectId (required) - Tham chiếu Class
- `teacherId`: ObjectId (required) - Tham chiếu Teacher
- `title`: String (required) - Tiêu đề
- `content`: String (required) - Nội dung
- `isPinned`: Boolean (default: false) - Ghim
- `isDeleted`: Boolean
- `createdAt`, `updatedAt`: Timestamp

**Indexes**:
- `classId`
- `(classId, isPinned, createdAt)` (compound)

### 3.24. RefreshToken (Token làm mới)
**Primary Key**: `_id`
**Foreign Keys**: `userId` → User._id
**Attributes**:
- `token`: String (required, unique) - Refresh token
- `userId`: ObjectId (required) - Tham chiếu User
- `expiresAt`: Date (required) - Thời gian hết hạn
- `createdAt`: Timestamp

**Indexes**:
- `token` (unique)
- `userId`
- `expiresAt`

**Business Rules**:
- Hết hạn sau 7 ngày
- Xóa khi logout

### 3.25. Otp (Mã OTP)
**Primary Key**: `_id`
**Foreign Keys**: `userId` → User._id
**Attributes**:
- `userId`: ObjectId (required) - Tham chiếu User
- `code`: String (required) - Mã OTP (6 chữ số)
- `expiresAt`: Date (required) - Thời gian hết hạn
- `isUsed`: Boolean (default: false) - Đã sử dụng
- `createdAt`: Timestamp

**Indexes**:
- `userId`
- `(userId, code)` (compound)
- `expiresAt`

**Business Rules**:
- Hết hạn sau 5 phút
- Chỉ sử dụng 1 lần



---

## 4. RELATIONSHIPS (QUAN HỆ)

### 4.1. User - Student/Teacher (1:1)
- **Mô tả**: Mỗi User có thể là Student hoặc Teacher
- **Cardinality**: 1 User → 0..1 Student/Teacher
- **Foreign Key**: Student.userId, Teacher.userId → User._id
- **Cascade**: Khi xóa User, xóa Student/Teacher tương ứng

### 4.2. Faculty - Subject (1:N)
- **Mô tả**: Một Khoa có nhiều Môn học
- **Cardinality**: 1 Faculty → N Subject
- **Foreign Key**: Subject.facultyId → Faculty._id
- **Cascade**: Không cho phép xóa Faculty khi còn Subject

### 4.3. Subject - Class (1:N)
- **Mô tả**: Một Môn học có nhiều Lớp học
- **Cardinality**: 1 Subject → N Class
- **Foreign Key**: Class.subjectId → Subject._id
- **Cascade**: Không cho phép xóa Subject khi còn Class

### 4.4. Teacher - Class (1:N)
- **Mô tả**: Một Giảng viên phụ trách nhiều Lớp học
- **Cardinality**: 1 Teacher → N Class
- **Foreign Key**: Class.teacherId → User._id (role=teacher)
- **Cascade**: Không cho phép xóa Teacher khi còn Class

### 4.5. Class - Enrollment (1:N)
- **Mô tả**: Một Lớp học có nhiều Ghi danh
- **Cardinality**: 1 Class → N Enrollment
- **Foreign Key**: Enrollment.classId → Class._id
- **Cascade**: Xóa Enrollment khi xóa Class

### 4.6. Student - Enrollment (1:N)
- **Mô tả**: Một Sinh viên có nhiều Ghi danh
- **Cardinality**: 1 Student → N Enrollment
- **Foreign Key**: Enrollment.studentId → User._id (role=student)
- **Cascade**: Xóa Enrollment khi xóa Student

### 4.7. Class - Assignment (1:N)
- **Mô tả**: Một Lớp học có nhiều Bài tập
- **Cardinality**: 1 Class → N Assignment
- **Foreign Key**: Assignment.classId → Class._id
- **Cascade**: Xóa Assignment khi xóa Class

### 4.8. Assignment - Question (1:N)
- **Mô tả**: Một Bài tập có nhiều Câu hỏi
- **Cardinality**: 1 Assignment → N Question
- **Foreign Key**: Question.assignmentId → Assignment._id
- **Cascade**: Xóa Question khi xóa Assignment

### 4.9. Assignment - Submission (1:N)
- **Mô tả**: Một Bài tập có nhiều Bài nộp
- **Cardinality**: 1 Assignment → N Submission
- **Foreign Key**: Submission.assignmentId → Assignment._id
- **Cascade**: Xóa Submission khi xóa Assignment

### 4.10. Student - Submission (1:N)
- **Mô tả**: Một Sinh viên có nhiều Bài nộp
- **Cardinality**: 1 Student → N Submission
- **Foreign Key**: Submission.studentId → User._id (role=student)
- **Cascade**: Xóa Submission khi xóa Student


### 4.11. Submission - SubmissionAnswer (1:N)
- **Mô tả**: Một Bài nộp có nhiều Câu trả lời
- **Cardinality**: 1 Submission → N SubmissionAnswer
- **Foreign Key**: SubmissionAnswer.submissionId → Submission._id
- **Cascade**: Xóa SubmissionAnswer khi xóa Submission

### 4.12. Question - SubmissionAnswer (1:N)
- **Mô tả**: Một Câu hỏi có nhiều Câu trả lời
- **Cardinality**: 1 Question → N SubmissionAnswer
- **Foreign Key**: SubmissionAnswer.questionId → Question._id
- **Cascade**: Không xóa SubmissionAnswer khi xóa Question

### 4.13. Class - Gradebook (1:N)
- **Mô tả**: Một Lớp học có nhiều Bảng điểm
- **Cardinality**: 1 Class → N Gradebook
- **Foreign Key**: Gradebook.classId → Class._id
- **Cascade**: Xóa Gradebook khi xóa Class

### 4.14. Student - Gradebook (1:N)
- **Mô tả**: Một Sinh viên có nhiều Bảng điểm
- **Cardinality**: 1 Student → N Gradebook
- **Foreign Key**: Gradebook.studentId → User._id (role=student)
- **Cascade**: Xóa Gradebook khi xóa Student

### 4.15. Class - Schedule (1:N)
- **Mô tả**: Một Lớp học có nhiều Lịch học
- **Cardinality**: 1 Class → N Schedule
- **Foreign Key**: Schedule.classId → Class._id
- **Cascade**: Xóa Schedule khi xóa Class

### 4.16. Schedule - AttendanceSession (1:1)
- **Mô tả**: Một Lịch học có một Buổi điểm danh
- **Cardinality**: 1 Schedule → 1 AttendanceSession
- **Foreign Key**: AttendanceSession.scheduleId → Schedule._id
- **Cascade**: Xóa AttendanceSession khi xóa Schedule

### 4.17. Class - AttendanceSession (1:N)
- **Mô tả**: Một Lớp học có nhiều Buổi điểm danh
- **Cardinality**: 1 Class → N AttendanceSession
- **Foreign Key**: AttendanceSession.classId → Class._id
- **Cascade**: Xóa AttendanceSession khi xóa Class

### 4.18. AttendanceSession - AttendanceRecord (1:N)
- **Mô tả**: Một Buổi điểm danh có nhiều Ghi nhận điểm danh
- **Cardinality**: 1 AttendanceSession → N AttendanceRecord
- **Foreign Key**: AttendanceRecord.sessionId → AttendanceSession._id
- **Cascade**: Xóa AttendanceRecord khi xóa AttendanceSession

### 4.19. Student - AttendanceRecord (1:N)
- **Mô tả**: Một Sinh viên có nhiều Ghi nhận điểm danh
- **Cardinality**: 1 Student → N AttendanceRecord
- **Foreign Key**: AttendanceRecord.studentId → User._id (role=student)
- **Cascade**: Xóa AttendanceRecord khi xóa Student

### 4.20. Student - AttendanceWarning (1:N)
- **Mô tả**: Một Sinh viên có nhiều Cảnh cáo điểm danh
- **Cardinality**: 1 Student → N AttendanceWarning
- **Foreign Key**: AttendanceWarning.studentId → User._id (role=student)
- **Cascade**: Xóa AttendanceWarning khi xóa Student


### 4.21. Student - AcademicWarning (1:N)
- **Mô tả**: Một Sinh viên có nhiều Cảnh cáo học thuật
- **Cardinality**: 1 Student → N AcademicWarning
- **Foreign Key**: AcademicWarning.studentId → User._id (role=student)
- **Cascade**: Xóa AcademicWarning khi xóa Student

### 4.22. Student - ExpulsionRecord (1:N)
- **Mô tả**: Một Sinh viên có nhiều Quyết định đuổi học
- **Cardinality**: 1 Student → N ExpulsionRecord
- **Foreign Key**: ExpulsionRecord.studentId → User._id (role=student)
- **Cascade**: Xóa ExpulsionRecord khi xóa Student

### 4.23. Student - AcademicLeave (1:N)
- **Mô tả**: Một Sinh viên có nhiều Đơn bảo lưu
- **Cardinality**: 1 Student → N AcademicLeave
- **Foreign Key**: AcademicLeave.studentId → User._id (role=student)
- **Cascade**: Xóa AcademicLeave khi xóa Student

### 4.24. User - Conversation (M:N)
- **Mô tả**: Nhiều User tham gia nhiều Cuộc trò chuyện
- **Cardinality**: M User ↔ N Conversation
- **Implementation**: Embedded array trong Conversation.participants
- **Cascade**: Xóa Conversation khi không còn participants

### 4.25. Conversation - Message (1:N)
- **Mô tả**: Một Cuộc trò chuyện có nhiều Tin nhắn
- **Cardinality**: 1 Conversation → N Message
- **Foreign Key**: Message.conversationId → Conversation._id
- **Cascade**: Xóa Message khi xóa Conversation

### 4.26. User - Message (1:N)
- **Mô tả**: Một User gửi nhiều Tin nhắn
- **Cardinality**: 1 User → N Message
- **Foreign Key**: Message.senderId → User._id
- **Cascade**: Không xóa Message khi xóa User (giữ lịch sử)

### 4.27. User - Notification (1:N)
- **Mô tả**: Một User nhận nhiều Thông báo
- **Cardinality**: 1 User → N Notification
- **Foreign Key**: Notification.recipientId → User._id
- **Cascade**: Xóa Notification khi xóa User

### 4.28. Class - Announcement (1:N)
- **Mô tả**: Một Lớp học có nhiều Thông báo lớp
- **Cardinality**: 1 Class → N Announcement
- **Foreign Key**: Announcement.classId → Class._id
- **Cascade**: Xóa Announcement khi xóa Class

### 4.29. Teacher - Announcement (1:N)
- **Mô tả**: Một Giảng viên tạo nhiều Thông báo lớp
- **Cardinality**: 1 Teacher → N Announcement
- **Foreign Key**: Announcement.teacherId → User._id (role=teacher)
- **Cascade**: Không xóa Announcement khi xóa Teacher



---

## 5. USE CASES (CA SỬ DỤNG)

### 5.1. Module Xác thực (Authentication)

#### UC-01: Đăng nhập
**Actor**: Admin, Teacher, Student
**Precondition**: User có tài khoản hợp lệ
**Main Flow**:
1. User nhập email và password
2. Hệ thống xác thực thông tin
3. Hệ thống tạo Access Token (15 phút) và Refresh Token (7 ngày)
4. Hệ thống lưu Refresh Token vào database
5. Hệ thống trả về tokens và thông tin user
**Postcondition**: User đăng nhập thành công
**Alternative Flow**:
- 2a. Email hoặc password sai → Hiển thị lỗi
- 2b. Tài khoản bị khóa → Hiển thị thông báo khóa

#### UC-02: Quên mật khẩu
**Actor**: Admin, Teacher, Student
**Precondition**: User có email đã đăng ký
**Main Flow**:
1. User nhập email
2. Hệ thống tạo OTP (6 chữ số, hết hạn 5 phút)
3. Hệ thống gửi OTP qua email
4. User nhập OTP
5. Hệ thống xác thực OTP
6. User nhập mật khẩu mới
7. Hệ thống cập nhật mật khẩu
**Postcondition**: Mật khẩu được đặt lại
**Alternative Flow**:
- 5a. OTP sai hoặc hết hạn → Yêu cầu gửi lại OTP

#### UC-03: Đổi mật khẩu
**Actor**: Admin, Teacher, Student
**Precondition**: User đã đăng nhập
**Main Flow**:
1. User nhập mật khẩu cũ và mật khẩu mới
2. Hệ thống xác thực mật khẩu cũ
3. Hệ thống cập nhật mật khẩu mới
4. Hệ thống xóa tất cả Refresh Token cũ
**Postcondition**: Mật khẩu được thay đổi
**Alternative Flow**:
- 2a. Mật khẩu cũ sai → Hiển thị lỗi


### 5.2. Module Quản lý Người dùng

#### UC-04: Tạo tài khoản
**Actor**: Admin
**Precondition**: Admin đã đăng nhập
**Main Flow**:
1. Admin nhập thông tin user (name, email, role)
2. Hệ thống tạo mật khẩu mặc định
3. Hệ thống tạo User record
4. Nếu role=student: Tạo Student record với studentCode
5. Nếu role=teacher: Tạo Teacher record với teacherCode
6. Hệ thống gửi email thông báo tài khoản
**Postcondition**: Tài khoản được tạo thành công
**Alternative Flow**:
- 2a. Email đã tồn tại → Hiển thị lỗi

#### UC-05: Khóa/Mở khóa tài khoản
**Actor**: Admin
**Precondition**: Admin đã đăng nhập, User tồn tại
**Main Flow**:
1. Admin chọn user cần khóa/mở khóa
2. Hệ thống cập nhật User.isLocked
3. Nếu khóa: Xóa tất cả Refresh Token của user
**Postcondition**: Trạng thái tài khoản được thay đổi

#### UC-06: Import người dùng hàng loạt
**Actor**: Admin
**Precondition**: Admin đã đăng nhập, có file CSV hợp lệ
**Main Flow**:
1. Admin upload file CSV
2. Hệ thống đọc và validate dữ liệu
3. Hệ thống tạo User và Student/Teacher records
4. Hệ thống gửi email cho từng user
5. Hệ thống trả về báo cáo kết quả
**Postcondition**: Danh sách user được tạo
**Alternative Flow**:
- 2a. Dữ liệu không hợp lệ → Hiển thị lỗi chi tiết


### 5.3. Module Quản lý Lớp học

#### UC-07: Tạo lớp học
**Actor**: Admin
**Precondition**: Admin đã đăng nhập, Subject và Teacher tồn tại
**Main Flow**:
1. Admin nhập thông tin lớp (name, subjectId, teacherId, semester, year)
2. Hệ thống validate dữ liệu
3. Hệ thống tạo Class record
4. Hệ thống gửi thông báo cho Teacher
**Postcondition**: Lớp học được tạo thành công

#### UC-08: Ghi danh sinh viên
**Actor**: Admin, Teacher
**Precondition**: Class và Student tồn tại
**Main Flow**:
1. Actor chọn lớp và sinh viên
2. Hệ thống kiểm tra số lượng sinh viên (< maxStudents)
3. Hệ thống tạo Enrollment record
4. Hệ thống tạo Gradebook record cho sinh viên
5. Hệ thống gửi thông báo cho sinh viên
**Postcondition**: Sinh viên được ghi danh vào lớp
**Alternative Flow**:
- 2a. Lớp đã đầy → Hiển thị lỗi
- 2b. Sinh viên đã ghi danh → Hiển thị lỗi

#### UC-09: Import sinh viên từ Excel
**Actor**: Admin, Teacher
**Precondition**: Class tồn tại, có file Excel hợp lệ
**Main Flow**:
1. Actor upload file Excel
2. Hệ thống đọc danh sách studentCode
3. Hệ thống tìm Student records
4. Hệ thống tạo Enrollment và Gradebook cho từng sinh viên
5. Hệ thống trả về báo cáo kết quả
**Postcondition**: Danh sách sinh viên được ghi danh
**Alternative Flow**:
- 3a. StudentCode không tồn tại → Bỏ qua và ghi log


### 5.4. Module Quản lý Bài tập

#### UC-10: Tạo bài tập
**Actor**: Teacher
**Precondition**: Teacher đã đăng nhập, Class tồn tại
**Main Flow**:
1. Teacher nhập thông tin bài tập (title, description, deadline, mode)
2. Nếu mode=quiz: Teacher thêm câu hỏi trắc nghiệm
3. Hệ thống tạo Assignment record (status=draft)
4. Nếu có câu hỏi: Hệ thống tạo Question records
**Postcondition**: Bài tập được tạo ở trạng thái draft

#### UC-11: Xuất bản bài tập
**Actor**: Teacher
**Precondition**: Assignment tồn tại, status=draft
**Main Flow**:
1. Teacher chọn xuất bản bài tập
2. Hệ thống cập nhật Assignment.status=published
3. Hệ thống gửi thông báo cho tất cả sinh viên trong lớp
**Postcondition**: Bài tập được xuất bản, sinh viên có thể nộp

#### UC-12: Nộp bài tập (File)
**Actor**: Student
**Precondition**: Student đã ghi danh, Assignment.status=published
**Main Flow**:
1. Student upload file bài làm
2. Hệ thống kiểm tra deadline
3. Hệ thống tạo Submission record
4. Nếu sau deadline: Submission.status=late
5. Hệ thống gửi thông báo cho Teacher
**Postcondition**: Bài tập được nộp thành công
**Alternative Flow**:
- 2a. Student bị khóa khỏi bài tập → Hiển thị lỗi
- 2b. Student đã nộp bài → Hiển thị lỗi

#### UC-13: Làm bài trắc nghiệm
**Actor**: Student
**Precondition**: Student đã ghi danh, Assignment.mode=quiz
**Main Flow**:
1. Student xem danh sách câu hỏi
2. Student chọn đáp án cho từng câu
3. Student nộp bài
4. Hệ thống tạo Submission record
5. Hệ thống tạo SubmissionAnswer records
6. Hệ thống tự động chấm điểm
7. Hệ thống cập nhật Submission.score
8. Hệ thống cập nhật Gradebook.averageScore
**Postcondition**: Bài trắc nghiệm được chấm điểm tự động

#### UC-14: Chấm điểm bài tập
**Actor**: Teacher
**Precondition**: Submission tồn tại, Assignment.mode=file
**Main Flow**:
1. Teacher xem bài nộp của sinh viên
2. Teacher nhập điểm và nhận xét
3. Hệ thống cập nhật Submission (score, feedback, status=graded)
4. Hệ thống gửi thông báo cho sinh viên
**Postcondition**: Bài tập được chấm điểm


### 5.5. Module Quản lý Điểm danh

#### UC-15: Tạo lịch học
**Actor**: Teacher
**Precondition**: Teacher đã đăng nhập, Class tồn tại
**Main Flow**:
1. Teacher nhập thông tin lịch (date, startTime, endTime, room)
2. Hệ thống validate (date phải trong tương lai)
3. Hệ thống tạo Schedule record
4. Hệ thống tự động tạo AttendanceSession record
5. Hệ thống cập nhật Class.scheduledLessons
**Postcondition**: Lịch học và buổi điểm danh được tạo
**Alternative Flow**:
- 2a. Lịch trùng → Hiển thị lỗi
- 2b. scheduledLessons > totalLessons → Hiển thị lỗi

#### UC-16: Tạo QR code điểm danh
**Actor**: Teacher
**Precondition**: AttendanceSession tồn tại
**Main Flow**:
1. Teacher chọn tạo QR code
2. Hệ thống tạo mã 6 chữ số ngẫu nhiên
3. Hệ thống cập nhật AttendanceSession (code, codeExpiredAt = now + 5 phút)
4. Hệ thống hiển thị QR code
**Postcondition**: QR code được tạo và hiển thị

#### UC-17: Điểm danh bằng QR code
**Actor**: Student
**Precondition**: Student đã ghi danh, QR code còn hạn
**Main Flow**:
1. Student quét QR code
2. Hệ thống validate mã QR
3. Hệ thống kiểm tra thời gian (trong khoảng startTime - endTime)
4. Hệ thống tạo AttendanceRecord (status=present, checkInMethod=qr)
5. Nếu sau startTime + 15 phút: status=late
6. Hệ thống tính tỷ lệ vắng học
7. Nếu vắng > 20%: Tạo AttendanceWarning
**Postcondition**: Sinh viên được điểm danh thành công
**Alternative Flow**:
- 2a. Mã QR hết hạn → Hiển thị lỗi
- 2b. Sinh viên đã điểm danh → Hiển thị lỗi
- 3a. Ngoài giờ học → Hiển thị lỗi

#### UC-18: Điểm danh thủ công
**Actor**: Teacher
**Precondition**: AttendanceSession tồn tại
**Main Flow**:
1. Teacher xem danh sách sinh viên
2. Teacher chọn trạng thái cho từng sinh viên (present/absent/late)
3. Hệ thống tạo/cập nhật AttendanceRecord
4. Hệ thống tính tỷ lệ vắng học
5. Nếu vắng > 20%: Tạo AttendanceWarning
**Postcondition**: Điểm danh được ghi nhận


### 5.6. Module Quản lý Bảng điểm

#### UC-19: Nhập điểm
**Actor**: Teacher
**Precondition**: Gradebook tồn tại
**Main Flow**:
1. Teacher nhập điểm QT, GK, CK
2. Hệ thống validate (0 ≤ điểm ≤ 10)
3. Hệ thống cập nhật Gradebook
4. Hệ thống tự động tính total = QT×0.3 + GK×0.2 + CK×0.5
5. Hệ thống gửi thông báo cho sinh viên
6. Nếu total < 4.0: Tạo AcademicWarning
**Postcondition**: Điểm được cập nhật
**Alternative Flow**:
- 2a. Điểm không hợp lệ → Hiển thị lỗi

#### UC-20: Xuất bảng điểm Excel
**Actor**: Teacher
**Precondition**: Class có Gradebook records
**Main Flow**:
1. Teacher chọn xuất bảng điểm
2. Hệ thống lấy danh sách Gradebook của lớp
3. Hệ thống tạo file Excel
4. Hệ thống trả về file để download
**Postcondition**: File Excel được tạo

### 5.7. Module Quản lý Kỷ luật

#### UC-21: Tạo quyết định đuổi học
**Actor**: Admin
**Precondition**: Admin đã đăng nhập, Student tồn tại
**Main Flow**:
1. Admin nhập thông tin (studentId, reason, reasonType, effectiveDate)
2. Hệ thống validate (effectiveDate không trong quá khứ)
3. Hệ thống tạo ExpulsionRecord (status=pending)
4. Admin upload tài liệu đính kèm
5. Admin duyệt quyết định
6. Hệ thống cập nhật ExpulsionRecord.status=active
7. Hệ thống cập nhật User.status=dismissed
8. Hệ thống đánh dấu Gradebook.dismissedMarker
9. Hệ thống gửi email thông báo cho sinh viên
**Postcondition**: Quyết định đuổi học được tạo và áp dụng
**Alternative Flow**:
- 2a. effectiveDate trong quá khứ → Hiển thị lỗi

#### UC-22: Kháng cáo quyết định đuổi học
**Actor**: Student
**Precondition**: ExpulsionRecord tồn tại, status=active
**Main Flow**:
1. Student nhập lý do kháng cáo
2. Student upload tài liệu bằng chứng
3. Hệ thống cập nhật ExpulsionRecord (appealReason, appealEvidence, appealStatus=pending)
4. Hệ thống gửi thông báo cho Admin
**Postcondition**: Đơn kháng cáo được nộp

#### UC-23: Xét kháng cáo
**Actor**: Admin
**Precondition**: ExpulsionRecord.appealStatus=pending
**Main Flow**:
1. Admin xem đơn kháng cáo và bằng chứng
2. Admin quyết định (approved/rejected)
3. Hệ thống cập nhật ExpulsionRecord (appealStatus, appealReviewedBy, appealReviewNote)
4. Nếu approved: Cập nhật User.status=active, ExpulsionRecord.status=revoked
5. Hệ thống gửi email thông báo cho sinh viên
**Postcondition**: Kháng cáo được xét duyệt


### 5.8. Module Quản lý Bảo lưu

#### UC-24: Xin bảo lưu
**Actor**: Student
**Precondition**: Student đã đăng nhập, status=active
**Main Flow**:
1. Student nhập thông tin (type, reason, startDate, endDate)
2. Student upload giấy tờ chứng minh
3. Hệ thống validate (endDate > startDate)
4. Hệ thống tạo AcademicLeave (status=pending)
5. Hệ thống gửi thông báo cho Admin
**Postcondition**: Đơn bảo lưu được nộp
**Alternative Flow**:
- 3a. Ngày không hợp lệ → Hiển thị lỗi

#### UC-25: Duyệt bảo lưu
**Actor**: Admin
**Precondition**: AcademicLeave.status=pending
**Main Flow**:
1. Admin xem đơn bảo lưu và giấy tờ
2. Admin quyết định (approved/rejected)
3. Hệ thống cập nhật AcademicLeave (status, approvedBy, approvedAt)
4. Nếu approved: Cập nhật User.status=on_leave
5. Nếu rejected: Nhập lý do từ chối
6. Hệ thống gửi email thông báo cho sinh viên
**Postcondition**: Đơn bảo lưu được xét duyệt

### 5.9. Module Chat Real-time

#### UC-26: Bắt đầu cuộc trò chuyện
**Actor**: Admin, Teacher, Student
**Precondition**: User đã đăng nhập
**Main Flow**:
1. User tìm kiếm người dùng khác
2. User chọn người để chat
3. Hệ thống kiểm tra Conversation đã tồn tại
4. Nếu chưa: Tạo Conversation mới (type=direct, 2 participants)
5. Hệ thống hiển thị cuộc trò chuyện
**Postcondition**: Cuộc trò chuyện được tạo/mở

#### UC-27: Gửi tin nhắn
**Actor**: Admin, Teacher, Student
**Precondition**: Conversation tồn tại, User là participant
**Main Flow**:
1. User nhập nội dung tin nhắn
2. User gửi tin nhắn
3. Hệ thống tạo Message record
4. Hệ thống cập nhật Conversation.lastMessage
5. Hệ thống cập nhật unreadCount cho participant khác
6. Hệ thống gửi tin nhắn real-time qua Socket.io
7. Hệ thống gửi browser notification (nếu được phép)
**Postcondition**: Tin nhắn được gửi và nhận real-time
**Alternative Flow**:
- 1a. Nội dung > 1000 ký tự → Hiển thị lỗi

#### UC-28: Đánh dấu đã đọc
**Actor**: Admin, Teacher, Student
**Precondition**: Conversation tồn tại, có tin nhắn chưa đọc
**Main Flow**:
1. User mở cuộc trò chuyện
2. Hệ thống cập nhật participant.lastReadAt
3. Hệ thống reset participant.unreadCount = 0
4. Hệ thống gửi sự kiện đã đọc qua Socket.io
**Postcondition**: Tin nhắn được đánh dấu đã đọc



---

## 6. BUSINESS RULES (QUY TẮC NGHIỆP VỤ)

### 6.1. Quy tắc Xác thực
- **BR-01**: Password phải được hash bằng bcrypt với 10 rounds
- **BR-02**: Access Token hết hạn sau 15 phút
- **BR-03**: Refresh Token hết hạn sau 7 ngày
- **BR-04**: OTP hết hạn sau 5 phút và chỉ sử dụng 1 lần
- **BR-05**: Email phải duy nhất trong hệ thống
- **BR-06**: Tài khoản bị khóa không thể đăng nhập

### 6.2. Quy tắc Người dùng
- **BR-07**: Admin có thể tạo tất cả loại tài khoản
- **BR-08**: Teacher/Student không thể tự đăng ký
- **BR-09**: StudentCode và TeacherCode phải duy nhất
- **BR-10**: Soft delete: isDeleted=true, giữ dữ liệu liên quan
- **BR-11**: User.status ảnh hưởng đến quyền truy cập:
  - active: Truy cập đầy đủ
  - on_leave: Hạn chế truy cập học tập
  - dismissed: Chỉ xem thông tin đuổi học và kháng cáo
  - suspended: Không thể đăng nhập

### 6.3. Quy tắc Lớp học
- **BR-12**: Mỗi lớp chỉ có 1 giảng viên phụ trách
- **BR-13**: Số sinh viên ≤ maxStudents (mặc định 50)
- **BR-14**: scheduledLessons ≤ totalLessons
- **BR-15**: Enrollment.unique: (classId, studentId)
- **BR-16**: Giảng viên chỉ quản lý lớp mình phụ trách
- **BR-17**: Sinh viên chỉ xem lớp mình đã ghi danh

### 6.4. Quy tắc Bài tập
- **BR-18**: Bài tập phải có deadline
- **BR-19**: Sinh viên chỉ thấy bài tập đã xuất bản (status=published)
- **BR-20**: Mỗi sinh viên chỉ nộp 1 lần cho mỗi bài tập
- **BR-21**: Nộp sau deadline: Submission.status=late
- **BR-22**: Bài trắc nghiệm (mode=quiz) tự động chấm điểm
- **BR-23**: Bài file (mode=file) cần giảng viên chấm thủ công
- **BR-24**: Sinh viên bị khóa không thể nộp bài

### 6.5. Quy tắc Bảng điểm
- **BR-25**: Công thức điểm tổng: total = QT×0.3 + GK×0.2 + CK×0.5
- **BR-26**: Điểm làm tròn đến 1 chữ số thập phân
- **BR-27**: Gradebook.unique: (classId, studentId)
- **BR-28**: 0 ≤ điểm ≤ 10
- **BR-29**: Tự động tạo AcademicWarning khi total < 4.0


### 6.6. Quy tắc Điểm danh
- **BR-30**: QR code: 6 chữ số ngẫu nhiên
- **BR-31**: QR code hết hạn sau 5 phút
- **BR-32**: AttendanceRecord.unique: (sessionId, studentId)
- **BR-33**: Điểm danh sau startTime + 15 phút: status=late
- **BR-34**: Sinh viên không thuộc lớp không thể điểm danh
- **BR-35**: Tự động tạo AttendanceSession khi tạo Schedule
- **BR-36**: Tự động tạo AttendanceWarning khi vắng > 20%
- **BR-37**: AttendanceWarning.critical khi vắng > 30%

### 6.7. Quy tắc Lịch học
- **BR-38**: Chỉ tạo lịch cho ngày trong tương lai
- **BR-39**: Không cho phép lịch trùng (cùng classId, date)
- **BR-40**: Chỉ xóa lịch trong tương lai
- **BR-41**: Xóa Schedule → Xóa AttendanceSession tương ứng

### 6.8. Quy tắc Kỷ luật
- **BR-42**: ExpulsionRecord.effectiveDate không được trong quá khứ (khi tạo mới)
- **BR-43**: Sinh viên có quyền kháng cáo quyết định đuổi học
- **BR-44**: Khi ExpulsionRecord.status=active: User.status=dismissed
- **BR-45**: Khi kháng cáo approved: User.status=active, ExpulsionRecord.status=revoked
- **BR-46**: AcademicWarning tự động tạo khi:
  - GPA < 4.0 (warning level 1)
  - GPA < 3.0 (warning level 2)
  - GPA < 2.0 (warning level 3)

### 6.9. Quy tắc Bảo lưu
- **BR-47**: endDate > startDate
- **BR-48**: duration = days between startDate and endDate
- **BR-49**: Khi AcademicLeave.status=approved: User.status=on_leave
- **BR-50**: Hệ thống tự động khôi phục User.status=active khi hết hạn bảo lưu
- **BR-51**: Medical leave cần giấy tờ chứng minh

### 6.10. Quy tắc Chat
- **BR-52**: Direct chat: Exactly 2 participants
- **BR-53**: Participants phải unique (không chat với chính mình)
- **BR-54**: Message.content ≤ 1000 ký tự
- **BR-55**: Message.timestamp không được trong tương lai
- **BR-56**: Sender phải là participant của conversation
- **BR-57**: Tin nhắn gửi real-time qua Socket.io
- **BR-58**: Tự động cập nhật unreadCount cho participant khác

### 6.11. Quy tắc Thông báo
- **BR-59**: Thông báo gửi real-time qua Socket.io
- **BR-60**: Thông báo có thể hết hạn (expiresAt)
- **BR-61**: Thông báo lớp chỉ gửi cho sinh viên trong lớp
- **BR-62**: Hệ thống tự động tạo thông báo cho các sự kiện quan trọng:
  - Bài tập mới được xuất bản
  - Điểm số được cập nhật
  - Cảnh cáo học thuật/điểm danh
  - Quyết định đuổi học
  - Kết quả kháng cáo



---

## 7. DATA FLOW (LUỒNG DỮ LIỆU)

### 7.1. Luồng Đăng nhập
```
User → [POST /api/auth/login] → Backend
  ↓
Validate email/password
  ↓
Generate JWT Tokens (Access + Refresh)
  ↓
Save RefreshToken to DB
  ↓
Return tokens + user info → Frontend
  ↓
Store tokens in localStorage
  ↓
Redirect to Dashboard
```

### 7.2. Luồng Tạo và Nộp bài tập
```
Teacher → [POST /api/assignments] → Backend
  ↓
Create Assignment (status=draft)
  ↓
[PUT /api/assignments/:id/publish]
  ↓
Update status=published
  ↓
Send notifications to students (Socket.io)
  ↓
Students receive notification
  ↓
Student → [POST /api/submissions] → Backend
  ↓
Upload file / Submit quiz answers
  ↓
Create Submission record
  ↓
If quiz: Auto-grade → Update score
  ↓
Send notification to teacher
```

### 7.3. Luồng Điểm danh QR Code
```
Teacher → [POST /api/schedules] → Backend
  ↓
Create Schedule record
  ↓
Auto-create AttendanceSession
  ↓
Teacher → [POST /api/attendance/generate-qr] → Backend
  ↓
Generate 6-digit code
  ↓
Update AttendanceSession (code, codeExpiredAt)
  ↓
Return QR code → Display to students
  ↓
Student scan QR → [POST /api/attendance/check-in] → Backend
  ↓
Validate code, time, enrollment
  ↓
Create AttendanceRecord
  ↓
Calculate absence rate
  ↓
If > 20%: Create AttendanceWarning
  ↓
Send notification to student
```


### 7.4. Luồng Nhập điểm và Cảnh cáo
```
Teacher → [PUT /api/gradebooks/:id] → Backend
  ↓
Update QT, GK, CK
  ↓
Auto-calculate total = QT×0.3 + GK×0.2 + CK×0.5
  ↓
If total < 4.0:
  ↓
  Create AcademicWarning
  ↓
  Send notification to student
  ↓
  Send email notification
```

### 7.5. Luồng Đuổi học và Kháng cáo
```
Admin → [POST /api/expulsions] → Backend
  ↓
Create ExpulsionRecord (status=pending)
  ↓
Admin → [PUT /api/expulsions/:id/approve] → Backend
  ↓
Update status=active
  ↓
Update User.status=dismissed
  ↓
Update Gradebook.dismissedMarker
  ↓
Send email to student
  ↓
Student → [POST /api/expulsions/:id/appeal] → Backend
  ↓
Update appealStatus=pending
  ↓
Send notification to admin
  ↓
Admin → [PUT /api/expulsions/:id/appeal/review] → Backend
  ↓
If approved:
  ↓
  Update User.status=active
  ↓
  Update ExpulsionRecord.status=revoked
  ↓
Send email to student
```

### 7.6. Luồng Chat Real-time
```
User A → [POST /api/chat/conversations] → Backend
  ↓
Find or create Conversation
  ↓
User A → [Socket: message:send] → Backend
  ↓
Create Message record
  ↓
Update Conversation.lastMessage
  ↓
Update User B unreadCount
  ↓
[Socket: message:receive] → User B
  ↓
Display message in real-time
  ↓
Send browser notification to User B
```

### 7.7. Luồng Bảo lưu
```
Student → [POST /api/leaves] → Backend
  ↓
Create AcademicLeave (status=pending)
  ↓
Upload documents
  ↓
Send notification to admin
  ↓
Admin → [PUT /api/leaves/:id/approve] → Backend
  ↓
Update status=approved
  ↓
Update User.status=on_leave
  ↓
Send email to student
  ↓
[Cron Job] Check endDate
  ↓
If expired: Update User.status=active
```



---

## 8. HƯỚNG DẪN VẼ ERD (ENTITY RELATIONSHIP DIAGRAM)

### 8.1. Các thực thể chính (Main Entities)
Vẽ các hình chữ nhật đại diện cho 25 entities:
1. User (trung tâm)
2. Student, Teacher (kế thừa từ User)
3. Faculty, Subject, Class
4. Enrollment, Assignment, Question, Submission, SubmissionAnswer
5. Gradebook, Schedule, AttendanceSession, AttendanceRecord, AttendanceWarning
6. AcademicWarning, ExpulsionRecord, AcademicLeave
7. Conversation, Message
8. Notification, Announcement
9. RefreshToken, Otp

### 8.2. Các mối quan hệ (Relationships)
Vẽ các đường nối với cardinality:
- **1:1**: User ↔ Student/Teacher
- **1:N**: Faculty → Subject, Subject → Class, Teacher → Class
- **1:N**: Class → Enrollment, Assignment, Schedule, Gradebook
- **1:N**: Assignment → Question, Submission
- **1:N**: Schedule → AttendanceSession → AttendanceRecord
- **M:N**: User ↔ Conversation (qua participants array)

### 8.3. Thuộc tính quan trọng (Key Attributes)
Đánh dấu:
- **Primary Key**: _id (gạch chân)
- **Foreign Key**: userId, classId, studentId, etc. (in nghiêng)
- **Unique**: email, studentCode, teacherCode (đánh dấu U)
- **Required**: Các trường bắt buộc (đánh dấu *)

### 8.4. Lưu ý khi vẽ ERD
- Sử dụng crow's foot notation cho cardinality
- Đánh dấu cascade delete bằng mũi tên đặc biệt
- Nhóm các entities liên quan gần nhau
- Sử dụng màu sắc để phân biệt module:
  - Xanh: User Management
  - Đỏ: Academic (Class, Assignment, Gradebook)
  - Vàng: Attendance
  - Tím: Discipline (Warning, Expulsion, Leave)
  - Xanh lá: Communication (Chat, Notification)



---

## 9. HƯỚNG DẪN VẼ USE CASE DIAGRAM

### 9.1. Actors (Tác nhân)
Vẽ 3 stick figures:
1. **Admin** (bên trái)
2. **Teacher** (giữa)
3. **Student** (bên phải)

### 9.2. Use Cases theo Module

#### Module Authentication (Oval màu xanh)
- UC-01: Đăng nhập (All actors)
- UC-02: Quên mật khẩu (All actors)
- UC-03: Đổi mật khẩu (All actors)
- UC-04: Đăng xuất (All actors)

#### Module User Management (Oval màu đỏ)
- UC-05: Tạo tài khoản (Admin)
- UC-06: Khóa/Mở khóa tài khoản (Admin)
- UC-07: Import người dùng (Admin)
- UC-08: Cập nhật profile (All actors)

#### Module Class Management (Oval màu vàng)
- UC-09: Tạo lớp học (Admin)
- UC-10: Ghi danh sinh viên (Admin, Teacher)
- UC-11: Import sinh viên (Admin, Teacher)
- UC-12: Xem danh sách lớp (All actors)

#### Module Assignment (Oval màu tím)
- UC-13: Tạo bài tập (Teacher)
- UC-14: Xuất bản bài tập (Teacher)
- UC-15: Nộp bài tập (Student)
- UC-16: Làm bài trắc nghiệm (Student)
- UC-17: Chấm điểm (Teacher)

#### Module Attendance (Oval màu xanh lá)
- UC-18: Tạo lịch học (Teacher)
- UC-19: Tạo QR code (Teacher)
- UC-20: Điểm danh QR (Student)
- UC-21: Điểm danh thủ công (Teacher)
- UC-22: Xem báo cáo điểm danh (Teacher, Student)

#### Module Gradebook (Oval màu cam)
- UC-23: Nhập điểm (Teacher)
- UC-24: Xem bảng điểm (Teacher, Student)
- UC-25: Xuất Excel (Teacher)

#### Module Discipline (Oval màu đỏ đậm)
- UC-26: Tạo quyết định đuổi học (Admin)
- UC-27: Kháng cáo (Student)
- UC-28: Xét kháng cáo (Admin)
- UC-29: Xin bảo lưu (Student)
- UC-30: Duyệt bảo lưu (Admin)

#### Module Chat (Oval màu xanh dương)
- UC-31: Bắt đầu cuộc trò chuyện (All actors)
- UC-32: Gửi tin nhắn (All actors)
- UC-33: Đánh dấu đã đọc (All actors)

#### Module Notification (Oval màu hồng)
- UC-34: Xem thông báo (All actors)
- UC-35: Tạo thông báo lớp (Teacher)
- UC-36: Gửi thông báo hệ thống (Admin)

### 9.3. Mối quan hệ (Relationships)
- **Association**: Đường thẳng nối actor với use case
- **Include**: Đường nét đứt với <<include>> (VD: UC-13 include UC-14)
- **Extend**: Đường nét đứt với <<extend>> (VD: UC-15 extend UC-16)
- **Generalization**: Mũi tên rỗng (VD: Admin extends User)

### 9.4. Lưu ý khi vẽ Use Case Diagram
- Nhóm use cases theo module trong system boundary
- Sử dụng màu sắc để phân biệt module
- Đặt actors bên ngoài system boundary
- Vẽ các use case phổ biến ở giữa
- Vẽ các use case đặc biệt ở rìa
- Sử dụng note để giải thích business rules quan trọng



---

## 10. BẢNG TÓM TẮT ENTITIES VÀ RELATIONSHIPS

### 10.1. Bảng Entities

| STT | Entity | Primary Key | Foreign Keys | Unique Fields | Indexes |
|-----|--------|-------------|--------------|---------------|---------|
| 1 | User | _id | - | email, studentCode, teacherCode | role, (role, isDeleted) |
| 2 | Student | _id | userId | studentCode | userId, facultyId |
| 3 | Teacher | _id | userId | teacherCode | userId, facultyId |
| 4 | Faculty | _id | - | code | code |
| 5 | Subject | _id | facultyId | code | code, facultyId |
| 6 | Class | _id | subjectId, teacherId | - | teacherId, subjectId |
| 7 | Enrollment | _id | classId, studentId | (classId, studentId) | studentId, classId |
| 8 | Assignment | _id | classId | - | classId, deadline |
| 9 | Question | _id | assignmentId | - | assignmentId |
| 10 | Submission | _id | assignmentId, studentId, gradedBy | - | assignmentId, studentId |
| 11 | SubmissionAnswer | _id | submissionId, questionId | - | submissionId |
| 12 | Gradebook | _id | classId, studentId, expulsionRecordId | (classId, studentId) | classId |
| 13 | Schedule | _id | classId | - | classId, (classId, date) |
| 14 | AttendanceSession | _id | classId, scheduleId | - | classId, scheduleId |
| 15 | AttendanceRecord | _id | sessionId, studentId | (sessionId, studentId) | sessionId, studentId |
| 16 | AttendanceWarning | _id | studentId, classId | - | studentId, classId |
| 17 | AcademicWarning | _id | studentId, createdBy | - | studentId, (studentId, semester) |
| 18 | ExpulsionRecord | _id | studentId, createdBy, approvedBy, appealReviewedBy | - | studentId, (studentId, status) |
| 19 | AcademicLeave | _id | studentId, approvedBy | - | studentId, status |
| 20 | Conversation | _id | participants.userId | - | participants.userId, updatedAt |
| 21 | Message | _id | conversationId, senderId | - | conversationId, (conversationId, timestamp) |
| 22 | Notification | _id | recipientId, senderId | - | recipientId, (recipientId, isRead) |
| 23 | Announcement | _id | classId, teacherId | - | classId |
| 24 | RefreshToken | _id | userId | token | token, userId |
| 25 | Otp | _id | userId | - | userId, (userId, code) |


### 10.2. Bảng Relationships

| STT | Relationship | From Entity | To Entity | Cardinality | Type | Cascade |
|-----|--------------|-------------|-----------|-------------|------|---------|
| 1 | User-Student | User | Student | 1:1 | Identifying | Delete |
| 2 | User-Teacher | User | Teacher | 1:1 | Identifying | Delete |
| 3 | Faculty-Subject | Faculty | Subject | 1:N | Non-identifying | Restrict |
| 4 | Subject-Class | Subject | Class | 1:N | Non-identifying | Restrict |
| 5 | Teacher-Class | User (Teacher) | Class | 1:N | Non-identifying | Restrict |
| 6 | Class-Enrollment | Class | Enrollment | 1:N | Identifying | Delete |
| 7 | Student-Enrollment | User (Student) | Enrollment | 1:N | Non-identifying | Delete |
| 8 | Class-Assignment | Class | Assignment | 1:N | Identifying | Delete |
| 9 | Assignment-Question | Assignment | Question | 1:N | Identifying | Delete |
| 10 | Assignment-Submission | Assignment | Submission | 1:N | Identifying | Delete |
| 11 | Student-Submission | User (Student) | Submission | 1:N | Non-identifying | Delete |
| 12 | Submission-SubmissionAnswer | Submission | SubmissionAnswer | 1:N | Identifying | Delete |
| 13 | Question-SubmissionAnswer | Question | SubmissionAnswer | 1:N | Non-identifying | None |
| 14 | Class-Gradebook | Class | Gradebook | 1:N | Identifying | Delete |
| 15 | Student-Gradebook | User (Student) | Gradebook | 1:N | Non-identifying | Delete |
| 16 | Class-Schedule | Class | Schedule | 1:N | Identifying | Delete |
| 17 | Schedule-AttendanceSession | Schedule | AttendanceSession | 1:1 | Identifying | Delete |
| 18 | Class-AttendanceSession | Class | AttendanceSession | 1:N | Identifying | Delete |
| 19 | AttendanceSession-AttendanceRecord | AttendanceSession | AttendanceRecord | 1:N | Identifying | Delete |
| 20 | Student-AttendanceRecord | User (Student) | AttendanceRecord | 1:N | Non-identifying | Delete |
| 21 | Student-AttendanceWarning | User (Student) | AttendanceWarning | 1:N | Non-identifying | Delete |
| 22 | Class-AttendanceWarning | Class | AttendanceWarning | 1:N | Non-identifying | Delete |
| 23 | Student-AcademicWarning | User (Student) | AcademicWarning | 1:N | Non-identifying | Delete |
| 24 | Student-ExpulsionRecord | User (Student) | ExpulsionRecord | 1:N | Non-identifying | Delete |
| 25 | Student-AcademicLeave | User (Student) | AcademicLeave | 1:N | Non-identifying | Delete |
| 26 | User-Conversation | User | Conversation | M:N | Non-identifying | None |
| 27 | Conversation-Message | Conversation | Message | 1:N | Identifying | Delete |
| 28 | User-Message | User | Message | 1:N | Non-identifying | None |
| 29 | User-Notification | User | Notification | 1:N | Non-identifying | Delete |
| 30 | Class-Announcement | Class | Announcement | 1:N | Identifying | Delete |
| 31 | Teacher-Announcement | User (Teacher) | Announcement | 1:N | Non-identifying | None |
| 32 | User-RefreshToken | User | RefreshToken | 1:N | Non-identifying | Delete |
| 33 | User-Otp | User | Otp | 1:N | Non-identifying | Delete |



---

## 11. CÔNG THỨC VÀ TÍNH TOÁN TỰ ĐỘNG

### 11.1. Công thức Điểm tổng kết
```
total = (qt × 0.3) + (gk × 0.2) + (ck × 0.5)
```
- Làm tròn đến 1 chữ số thập phân
- Tự động tính trong Gradebook pre-save hook

### 11.2. Công thức Tỷ lệ vắng học
```
absenceRate = (absentSessions / totalSessions) × 100
```
- Warning: absenceRate > 20%
- Critical: absenceRate > 30%

### 11.3. Công thức Điểm trung bình bài tập
```
averageScore = sum(submission.score) / count(submissions)
```
- Chỉ tính các bài trắc nghiệm đã chấm
- Cập nhật vào Gradebook.averageScore

### 11.4. Tính Duration bảo lưu
```
duration = days_between(startDate, endDate)
```
- Tự động tính khi tạo AcademicLeave

### 11.5. Tính Unread Count
```
unreadCount = count(messages where timestamp > lastReadAt)
```
- Cập nhật trong Conversation.participants

---

## 12. SECURITY & PERFORMANCE

### 12.1. Security Measures
- **Password**: Bcrypt hash với 10 rounds
- **JWT**: Access Token (15m), Refresh Token (7d)
- **Rate Limiting**: 100 requests/15 phút (production)
- **Input Sanitization**: XSS protection với xss library
- **CORS**: Chỉ cho phép frontend URL
- **Helmet**: HTTP headers security

### 12.2. Performance Optimizations
- **Indexes**: Compound indexes cho queries phổ biến
- **Pagination**: Limit 20-50 records/page
- **Soft Delete**: isDeleted flag thay vì hard delete
- **Redis Cache**: Online users trong chat
- **Socket.io**: Real-time communication
- **Lazy Loading**: Load data on demand

### 12.3. Database Indexes Strategy
- Single field indexes: email, role, studentCode, teacherCode
- Compound indexes: (classId, studentId), (role, isDeleted), (conversationId, timestamp)
- Unique indexes: email, studentCode, teacherCode, (classId, studentId), (sessionId, studentId)

---

## 13. KẾT LUẬN

Tài liệu này cung cấp đầy đủ thông tin để:
1. **Vẽ ERD**: 25 entities, 33 relationships, cardinality, attributes
2. **Vẽ Use Case Diagram**: 3 actors, 36+ use cases, 9 modules
3. **Hiểu Business Rules**: 62 quy tắc nghiệp vụ chi tiết
4. **Phân tích Data Flow**: 7 luồng dữ liệu chính
5. **Thiết kế Database**: Indexes, constraints, cascade rules

Hệ thống được thiết kế với:
- **Scalability**: MongoDB với indexes tối ưu
- **Security**: JWT, bcrypt, rate limiting, input sanitization
- **Real-time**: Socket.io cho chat và notifications
- **User Experience**: Tự động tính toán, cảnh cáo, thông báo
- **Maintainability**: Soft delete, clear separation of concerns

---

**Tác giả**: Hệ thống Quản lý Lớp học - MERN Stack
**Ngày tạo**: 2024
**Phiên bản**: 1.0

