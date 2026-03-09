# HỆ THỐNG QUẢN LÝ SINH VIÊN (STUDENT MANAGEMENT SYSTEM)

## 📋 MỤC LỤC
- [Tổng quan hệ thống](#tổng-quan-hệ-thống)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt và chạy dự án](#cài-đặt-và-chạy-dự-án)
- [Cấu trúc dự án](#cấu-trúc-dự-án)
- [Chức năng chính](#chức-năng-chính)
- [API Endpoints](#api-endpoints)
- [Models và Database Schema](#models-và-database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Real-time Features](#real-time-features)
- [Hướng dẫn sử dụng](#hướng-dẫn-sử-dụng)

---

## 🎯 TỔNG QUAN HỆ THỐNG

Hệ thống Quản lý Sinh viên là một ứng dụng web full-stack được xây dựng để quản lý toàn diện các hoạt động học tập tại trường đại học, bao gồm:

- **Quản lý người dùng**: Admin, Giảng viên, Sinh viên
- **Quản lý lớp học**: Tạo lớp, phân công giảng viên, ghi danh sinh viên
- **Điểm danh**: Hệ thống điểm danh tự động với QR code và check-in trực tiếp
- **Quản lý bài tập**: Tạo, nộp, chấm điểm bài tập
- **Quản lý điểm số**: Sổ điểm, tính GPA, xuất báo cáo
- **Cảnh báo học vụ**: Tự động cảnh báo GPA thấp, vắng học nhiều
- **Quản lý đuổi học**: Xử lý đuổi học và khiếu nại
- **Chat real-time**: Hệ thống chat giữa Admin, Giảng viên và Sinh viên
- **Thông báo**: Thông báo real-time qua Socket.io
- **Bảo lưu**: Quản lý đơn bảo lưu học tập

---

## 🛠️ CÔNG NGHỆ SỬ DỤNG

### Backend
- **Node.js** v18+ với **Express.js**
- **MongoDB** với **Mongoose** ODM
- **Socket.io** cho real-time communication
- **Redis** cho caching và performance optimization
- **JWT** (JSON Web Tokens) cho authentication
- **Bcrypt** cho password hashing
- **Multer** cho file upload
- **Nodemailer** cho email notifications
- **ExcelJS & XLSX** cho import/export dữ liệu
- **PDFKit** cho tạo PDF reports
- **Bull** cho job queue
- **Joi** cho validation
- **Helmet** cho security headers
- **Express Rate Limit** cho rate limiting

### Frontend
- **React** v19+ với **React Router DOM** v7
- **Axios** cho HTTP requests
- **Socket.io Client** cho real-time features
- **Chart.js** với **React-Chartjs-2** cho biểu đồ
- **React Hot Toast** & **React Toastify** cho notifications
- **QRCode.react** cho QR code generation
- **React Window** cho virtualization
- **XLSX** cho export Excel

### Database
- **MongoDB** (NoSQL database)
- Indexes được tối ưu cho performance
- Soft delete pattern cho data preservation

---

## 📦 CÀI ĐẶT VÀ CHẠY DỰ ÁN

### Yêu cầu hệ thống
- Node.js v18 trở lên
- MongoDB v6 trở lên
- Redis (optional, cho caching)
- npm hoặc yarn

### Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` từ `.env.example`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/student_management
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here
```

Chạy backend:
```bash
npm run dev    # Development mode với nodemon
npm start      # Production mode
```

Seed dữ liệu mẫu:
```bash
npm run seed
```

### Cài đặt Frontend

```bash
cd frontend
npm install
```

Tạo file `.env` từ `.env.example`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Chạy frontend:
```bash
npm start      # Development mode
npm run build  # Build cho production
```

### Chạy Tests

```bash
cd backend
npm test                    # Chạy tất cả tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:property      # Property-based tests
npm run test:coverage      # Test coverage report
```

---

## 📁 CẤU TRÚC DỰ ÁN

### Backend Structure
```
backend/
├── src/
│   ├── config/           # Database, upload configuration
│   ├── controllers/      # Request handlers
│   │   └── chat/        # Chat controllers
│   ├── middleware/       # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   │   └── chat/        # Chat models (Conversation, Message)
│   ├── routes/          # API routes (23 route files)
│   ├── services/        # Business logic
│   │   ├── cache/       # Cache service (Redis)
│   │   └── chat/        # Chat services (ChatService, PermissionService)
│   ├── socket/          # Socket.io handlers
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation schemas
│   ├── __tests__/       # Test files
│   ├── index.js         # Entry point
│   ├── socket.js        # Socket.io setup
│   └── socketService.js # Socket service wrapper
├── scripts/             # Database scripts, migrations
├── uploads/             # File uploads directory
├── package.json
└── .env
```

### Frontend Structure
```
frontend/
├── public/
├── src/
│   ├── api/             # Axios configuration
│   ├── components/      # Reusable components
│   │   └── chat/       # Chat components
│   ├── context/         # React Context (Auth, Chat, Socket, Theme, Loading)
│   ├── hooks/          # Custom hooks (useChat, useConversations, useMessages)
│   ├── pages/          # Page components
│   ├── services/       # API services
│   ├── App.js          # Main app component
│   ├── index.js        # Entry point
│   └── index.css       # Global styles
├── package.json
└── .env
```

---

## ⚡ CHỨC NĂNG CHÍNH

### 1. Quản lý Người dùng
- **3 vai trò**: Admin, Teacher (Giảng viên), Student (Sinh viên)
- CRUD operations cho tất cả người dùng (Admin only)
- Import CSV hàng loạt
- Khóa/mở khóa tài khoản
- Reset password
- Quản lý profile, avatar
- Soft delete (không xóa vĩnh viễn)

### 2. Quản lý Khoa và Môn học
- **Faculties (Khoa)**: Tạo, sửa, xóa khoa
- **Subjects (Môn học)**: Quản lý môn học theo khoa
- Liên kết môn học với lớp học

### 3. Quản lý Lớp học
- Tạo lớp học với thông tin: tên, môn học, giảng viên, học kỳ, năm học
- Ghi danh sinh viên (thủ công hoặc import Excel)
- Xem danh sách sinh viên trong lớp
- Quản lý trạng thái lớp: active, closed, upcoming
- Giới hạn số lượng sinh viên tối đa
- Theo dõi số buổi học đã lên lịch vs tổng số buổi

### 4. Hệ thống Điểm danh (Attendance)

#### Tính năng điểm danh:
- **Date-based scheduling**: Lịch học theo ngày cụ thể (không còn theo thứ)
- **Attendance Sessions**: Tự động tạo session khi tạo schedule
- **QR Code Check-in**: Sinh viên quét QR để điểm danh
- **Direct Check-in**: Điểm danh trực tiếp không cần QR
- **Manual Check**: Giảng viên điểm danh thủ công cho sinh viên
- **Bulk Manual**: Điểm danh hàng loạt
- **Time Window Validation**: Chỉ cho phép điểm danh trong khung giờ học
- **Status Tracking**: present (có mặt), absent (vắng), late (muộn)
- **Duplicate Prevention**: Không cho phép điểm danh 2 lần trong 1 session

#### Thống kê điểm danh:
- Tỷ lệ điểm danh theo lớp
- Tỷ lệ điểm danh theo giảng viên
- Thống kê chi tiết theo sinh viên
- Báo cáo điểm danh (export Excel)
- Biểu đồ trực quan với Chart.js

### 5. Quản lý Lịch học (Schedule)
- Tạo lịch học theo ngày cụ thể
- Bulk create/delete schedules
- Validation: không cho phép tạo lịch trong quá khứ
- Validation: kiểm tra trùng lịch
- Validation: kiểm tra số buổi học còn lại
- Tự động tạo Attendance Session khi tạo Schedule
- Xem lịch học của tôi (My Schedule)
- Quản lý phòng học

### 6. Quản lý Bài tập (Assignments)
- **Tạo bài tập**: 
  - Loại: essay (tự luận), quiz (trắc nghiệm)
  - Đính kèm file (PDF, Word, etc.)
  - Đáp án (answer key)
  - Deadline
  - Điểm tối đa
- **Nộp bài**: 
  - Upload file (multiple files)
  - Nộp lại (resubmit) nếu chưa quá deadline
  - Trả lời câu hỏi trắc nghiệm
- **Chấm điểm**:
  - Chấm thủ công cho essay
  - Tự động chấm cho quiz
  - Feedback cho sinh viên
- **Trạng thái**: draft, published, closed
- **Khóa bài tập**: Tự động khóa khi sinh viên bị đuổi học

### 7. Quản lý Điểm số (Gradebook)
- **Cấu trúc điểm**:
  - QT (Quá trình): 30%
  - GK (Giữa kỳ): 20%
  - CK (Cuối kỳ): 50%
  - Total = QT × 0.3 + GK × 0.2 + CK × 0.5
- **Tính điểm trung bình**: Điểm TB các bài tập trắc nghiệm
- **Bulk update**: Cập nhật điểm hàng loạt
- **Export Excel**: Xuất sổ điểm
- **GPA Calculation**: Tính GPA theo học kỳ
- **Dismissed Marker**: Đánh dấu sinh viên bị đuổi học

### 8. Hệ thống Cảnh báo (Warnings)

#### Academic Warning (Cảnh báo học vụ):
- **Trigger**: GPA < 4.0
- **3 cấp độ**:
  - Level 1: Cảnh báo lần 1
  - Level 2: Cảnh báo lần 2 (2 học kỳ liên tiếp GPA thấp)
  - Level 3: Cảnh báo lần 3 (3 học kỳ liên tiếp GPA thấp) → Có thể dẫn đến đuổi học
- **Tự động gửi email** thông báo cho sinh viên
- **Tracking**: Theo dõi lịch sử cảnh báo

#### Attendance Warning (Cảnh báo vắng học):
- **Trigger**: Tỷ lệ vắng > 20%
- **Tính toán**: (Số buổi vắng / Tổng số buổi) × 100%
- **Tự động cảnh báo** khi vượt ngưỡng
- **Email notification** cho sinh viên

### 9. Quản lý Đuổi học (Expulsion)

#### Tạo quyết định đuổi học:
- **Lý do** (reasonType):
  - low_gpa: GPA thấp
  - discipline_violation: Vi phạm kỷ luật
  - excessive_absence: Vắng học quá nhiều
  - expired_leave: Hết hạn bảo lưu
- **Thông tin**: Lý do chi tiết, ngày hiệu lực, đính kèm file
- **Tự động**:
  - Cập nhật trạng thái User thành 'dismissed'
  - Hủy tất cả refresh tokens (đăng xuất khỏi mọi thiết bị)
  - Hủy lịch học tương lai
  - Khóa bài tập chưa nộp
  - Đánh dấu trong sổ điểm
  - Gửi email thông báo

#### Hệ thống Khiếu nại (Appeal):
- **Sinh viên**:
  - Nộp đơn khiếu nại
  - Đính kèm bằng chứng
  - Xem trạng thái khiếu nại
- **Admin**:
  - Xem danh sách khiếu nại
  - Phê duyệt: Khôi phục quyền truy cập, cập nhật trạng thái về 'active'
  - Từ chối: Ghi chú lý do từ chối
- **Trạng thái**: none, pending, approved, rejected

#### Giới hạn truy cập:
- Sinh viên bị đuổi học chỉ có thể:
  - Xem thông tin đuổi học
  - Nộp đơn khiếu nại
  - Xem cảnh báo
  - Đăng xuất
  - Xem profile
- Không thể truy cập: lớp học, bài tập, điểm danh, chat, etc.

### 10. Hệ thống Chat Real-time

#### Permission Matrix (Ma trận quyền chat):
- **Admin** ↔ Admin, Teacher, Student (chat với tất cả)
- **Teacher** ↔ Admin, Student (không chat với Teacher khác)
- **Student** ↔ Admin, Teacher (không chat với Student khác)

#### Tính năng:
- **1-on-1 Conversations**: Chỉ hỗ trợ chat 1-1
- **Real-time messaging**: Socket.io
- **Typing indicators**: Hiển thị khi đang gõ
- **Online status**: Hiển thị trạng thái online/offline
- **Unread count**: Đếm tin nhắn chưa đọc
- **Message pagination**: Load tin nhắn theo trang (50 messages/page)
- **User search**: Tìm kiếm người dùng để chat
- **Auto-join conversations**: Tự động join room khi connect
- **Mark as read**: Đánh dấu đã đọc
- **Last message preview**: Hiển thị tin nhắn cuối cùng

#### Performance Optimization:
- **Redis caching**: 
  - Unread count (TTL: 5 phút)
  - Online users
- **In-memory cache**: Typing indicators
- **Lean queries**: Chỉ lấy fields cần thiết
- **Indexes**: Tối ưu query performance
- **Pagination**: Giới hạn 50 items/page

### 11. Quản lý Bảo lưu (Leave Requests)
- **Sinh viên**:
  - Nộp đơn bảo lưu
  - Lý do bảo lưu
  - Thời gian bảo lưu (từ ngày - đến ngày)
  - Xem trạng thái đơn
- **Admin**:
  - Xem danh sách đơn bảo lưu
  - Phê duyệt/Từ chối
  - Ghi chú
- **Trạng thái**: pending, approved, rejected, expired
- **Tự động**: Cập nhật trạng thái User thành 'on_leave' khi được duyệt
- **Giới hạn**: Sinh viên đang bảo lưu không thể truy cập lớp học, bài tập

### 12. Hệ thống Thông báo (Notifications)
- **Real-time**: Socket.io emit ngay lập tức
- **Broadcast**: Admin gửi thông báo cho tất cả hoặc theo vai trò
- **Types**: 
  - assignment: Bài tập mới
  - grade: Điểm số mới
  - attendance: Điểm danh
  - warning: Cảnh báo
  - expulsion: Đuổi học
  - chat: Tin nhắn mới
  - announcement: Thông báo chung
- **Mark as read**: Đánh dấu đã đọc (từng cái hoặc tất cả)
- **Unread count**: Đếm số thông báo chưa đọc
- **Delete**: Xóa thông báo

### 13. Dashboard
- **Admin Dashboard**:
  - Tổng số người dùng (Admin, Teacher, Student)
  - Tổng số lớp học
  - Thống kê theo trạng thái
  - Biểu đồ
- **Teacher Dashboard**:
  - Số lớp đang dạy
  - Số sinh viên
  - Lịch dạy hôm nay
  - Bài tập cần chấm
- **Student Dashboard**:
  - Số lớp đang học
  - GPA hiện tại
  - Lịch học hôm nay
  - Bài tập sắp đến hạn
  - Cảnh báo (nếu có)

---

## 🔌 API ENDPOINTS

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

```
POST   /api/auth/login              # Đăng nhập
POST   /api/auth/logout             # Đăng xuất
POST   /api/auth/refresh-token      # Làm mới token
POST   /api/auth/forgot-password    # Quên mật khẩu
POST   /api/auth/verify-otp         # Xác thực OTP
POST   /api/auth/reset-password     # Đặt lại mật khẩu
GET    /api/auth/me                 # Lấy thông tin user hiện tại
PUT    /api/auth/me                 # Cập nhật thông tin
PUT    /api/auth/change-password    # Đổi mật khẩu
PUT    /api/auth/me/avatar          # Upload avatar
```

### Admin - User Management
```
GET    /api/admin/users             # Danh sách người dùng (pagination, filter)
POST   /api/admin/users             # Tạo người dùng mới
POST   /api/admin/users/import-csv  # Import CSV
GET    /api/admin/users/:id         # Chi tiết người dùng
PUT    /api/admin/users/:id         # Cập nhật người dùng
DELETE /api/admin/users/:id         # Xóa người dùng (soft delete)
PATCH  /api/admin/users/:id/lock    # Khóa tài khoản
PATCH  /api/admin/users/:id/unlock  # Mở khóa tài khoản
PATCH  /api/admin/users/:id/reset-password  # Reset mật khẩu
```

### Faculties (Khoa)
```
GET    /api/faculties               # Danh sách khoa
POST   /api/faculties               # Tạo khoa (Admin)
PUT    /api/faculties/:id           # Cập nhật khoa (Admin)
DELETE /api/faculties/:id           # Xóa khoa (Admin)
```

### Subjects (Môn học)
```
GET    /api/subjects                # Danh sách môn học
POST   /api/subjects                # Tạo môn học (Admin)
GET    /api/subjects/:id            # Chi tiết môn học
PUT    /api/subjects/:id            # Cập nhật môn học (Admin)
DELETE /api/subjects/:id            # Xóa môn học (Admin)
```

### Classes (Lớp học)
```
GET    /api/classes                 # Danh sách lớp học
GET    /api/classes/my-classes      # Lớp của tôi
POST   /api/classes                 # Tạo lớp (Admin)
GET    /api/classes/:id             # Chi tiết lớp
PUT    /api/classes/:id             # Cập nhật lớp (Admin)
DELETE /api/classes/:id             # Xóa lớp (Admin)
PATCH  /api/classes/:id/status      # Cập nhật trạng thái (Admin)
GET    /api/classes/:id/students    # Danh sách sinh viên trong lớp
GET    /api/classes/:id/my-enrollment  # Thông tin ghi danh của tôi
POST   /api/classes/:id/students    # Thêm sinh viên (Admin)
POST   /api/classes/:id/students/import  # Import sinh viên Excel (Admin)
DELETE /api/classes/:id/students/:userId  # Xóa sinh viên khỏi lớp (Admin)
```

### Schedules (Lịch học)
```
GET    /api/classes/:classId/schedules  # Lịch học của lớp
POST   /api/classes/:classId/schedules  # Tạo lịch học
POST   /api/classes/:id/schedules/bulk  # Tạo hàng loạt
DELETE /api/classes/:id/schedules/bulk  # Xóa hàng loạt
PUT    /api/schedules/:id            # Cập nhật lịch
DELETE /api/schedules/:id            # Xóa lịch
GET    /api/schedules/my-schedule    # Lịch học của tôi
GET    /api/classes/:id/remaining-lessons  # Số buổi còn lại
```

### Attendance (Điểm danh)
```
# Validation & Statistics
GET    /api/attendance/validate-schedule/:classId  # Validate lịch học
GET    /api/attendance/statistics/:classId  # Thống kê điểm danh
GET    /api/attendance/detailed-statistics/:classId  # Thống kê chi tiết
GET    /api/attendance/rate/:classId        # Tỷ lệ điểm danh
GET    /api/attendance/teacher-rates        # Tỷ lệ điểm danh theo GV
GET    /api/attendance/teacher-rates/:teacherId  # Tỷ lệ của 1 GV

# Check-in
POST   /api/classes/:classId/attendance/check-in  # Check-in trực tiếp
GET    /api/classes/:classId/attendance/status    # Trạng thái điểm danh
GET    /api/classes/:classId/attendance/my-attendance  # Điểm danh của tôi

# Sessions
POST   /api/classes/:classId/attendance/sessions  # Tạo session
GET    /api/classes/:classId/attendance/sessions  # Danh sách sessions
PUT    /api/attendance/sessions/:sessionId        # Cập nhật session
POST   /api/attendance/sessions/:sessionId/manual  # Điểm danh thủ công
PUT    /api/attendance/sessions/:sessionId/manual  # Điểm danh hàng loạt
POST   /api/attendance/sessions/:sessionId/generate-code  # Tạo QR code
GET    /api/attendance/sessions/:sessionId/records  # Danh sách records
POST   /api/attendance/check-in                   # Check-in bằng QR
GET    /api/classes/:classId/attendance/report    # Báo cáo điểm danh
```

### Assignments (Bài tập)
```
GET    /api/classes/:classId/assignments  # Danh sách bài tập
POST   /api/classes/:classId/assignments  # Tạo bài tập
GET    /api/assignments/download/:filename  # Download file đính kèm
GET    /api/assignments/:id             # Chi tiết bài tập
GET    /api/assignments/:id/answer-key  # Download đáp án
PUT    /api/assignments/:id             # Cập nhật bài tập
DELETE /api/assignments/:id             # Xóa bài tập
POST   /api/assignments/:id/attachments  # Thêm file đính kèm
PATCH  /api/assignments/:id/publish     # Publish bài tập
PATCH  /api/assignments/:id/close       # Đóng bài tập
PATCH  /api/assignments/:id/status      # Cập nhật trạng thái

# Submissions
POST   /api/assignments/:id/submit      # Nộp bài
PUT    /api/assignments/:id/resubmit    # Nộp lại
GET    /api/assignments/:id/my-submission  # Bài nộp của tôi
GET    /api/assignments/:id/submissions    # Danh sách bài nộp
GET    /api/submissions/:id             # Chi tiết bài nộp
GET    /api/submissions/:id/download    # Download bài nộp
POST   /api/submissions/:id/grade       # Chấm điểm
PUT    /api/submissions/:id/grade       # Cập nhật điểm
```

### Gradebook (Sổ điểm)
```
GET    /api/classes/:classId/gradebook  # Sổ điểm lớp
PUT    /api/classes/:classId/gradebook/:studentId  # Cập nhật điểm SV
POST   /api/classes/:classId/gradebook/bulk  # Cập nhật hàng loạt
GET    /api/classes/:classId/gradebook/export  # Export Excel
```

### Students
```
GET    /api/students/my-grades          # Điểm của tôi
GET    /api/students/my-grades/:classId  # Điểm theo lớp
```

### Teachers
```
GET    /api/teachers                    # Danh sách giảng viên
GET    /api/teachers/my-students        # Sinh viên của tôi
GET    /api/teachers/:id                # Chi tiết giảng viên
PUT    /api/teachers/:id                # Cập nhật giảng viên
GET    /api/teachers/:id/classes        # Lớp của giảng viên
```

### Warnings (Cảnh báo)
```
GET    /api/admin/warnings              # Danh sách cảnh báo (Admin)
GET    /api/students/warnings/me        # Cảnh báo của tôi (Student)
GET    /api/teachers/warnings/class/:classId  # Cảnh báo lớp (Teacher)
```

### Expulsions (Đuổi học)
```
# Admin
POST   /api/admin/expulsions            # Tạo quyết định đuổi học
GET    /api/admin/expulsions            # Danh sách đuổi học
GET    /api/admin/expulsions/:id        # Chi tiết
PUT    /api/admin/expulsions/:id/approve-appeal  # Duyệt khiếu nại
PUT    /api/admin/expulsions/:id/reject-appeal   # Từ chối khiếu nại

# Student
GET    /api/students/expulsions/me      # Thông tin đuổi học của tôi
PUT    /api/students/expulsions/:id/appeal  # Nộp đơn khiếu nại
```

### Leave Requests (Bảo lưu)
```
# Student
POST   /api/students/leave/request      # Nộp đơn bảo lưu
GET    /api/students/leave/my-requests  # Đơn của tôi

# Admin
GET    /api/admin/leave-requests        # Danh sách đơn bảo lưu
PUT    /api/admin/leave-requests/:id/approve  # Duyệt đơn
PUT    /api/admin/leave-requests/:id/reject   # Từ chối đơn
```

### Chat (Tin nhắn)
```
GET    /api/chat/conversations          # Danh sách hội thoại
POST   /api/chat/conversations          # Tạo hội thoại mới
GET    /api/chat/conversations/:id      # Chi tiết hội thoại
GET    /api/chat/conversations/:id/messages  # Tin nhắn trong hội thoại
POST   /api/chat/conversations/:id/read      # Đánh dấu đã đọc
GET    /api/chat/users/search           # Tìm kiếm người dùng
GET    /api/chat/unread-count           # Số tin nhắn chưa đọc
GET    /api/chat/online-users           # Danh sách online
```

### Notifications (Thông báo)
```
GET    /api/notifications               # Danh sách thông báo
GET    /api/notifications/unread-count  # Số thông báo chưa đọc
POST   /api/notifications/broadcast     # Gửi thông báo (Admin)
PATCH  /api/notifications/read-all      # Đánh dấu tất cả đã đọc
PATCH  /api/notifications/:id/read      # Đánh dấu 1 cái đã đọc
DELETE /api/notifications/:id           # Xóa thông báo
```

### Announcements (Thông báo lớp)
```
GET    /api/classes/:classId/announcements  # Thông báo lớp
POST   /api/classes/:classId/announcements  # Tạo thông báo
DELETE /api/announcements/:id                # Xóa thông báo
```

### Dashboard
```
GET    /api/dashboard/admin             # Dashboard Admin
GET    /api/dashboard/teacher           # Dashboard Teacher
GET    /api/dashboard/student           # Dashboard Student
```

### Statistics (Thống kê)
```
GET    /api/admin/statistics/expulsions  # Thống kê đuổi học
```

### Health Check
```
GET    /api/health                      # Kiểm tra server
```

---

## 🗄️ MODELS VÀ DATABASE SCHEMA

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: Enum ['admin', 'teacher', 'student'],
  avatar: String,
  phone: String,
  isLocked: Boolean,
  studentCode: String,
  teacherCode: String,
  isDeleted: Boolean,
  status: Enum ['active', 'on_leave', 'dismissed', 'suspended'],
  createdAt: Date,
  updatedAt: Date
}
```

### Student Model
```javascript
{
  userId: ObjectId (ref: User),
  studentCode: String (unique),
  classId: ObjectId (ref: Class),
  dateOfBirth: Date,
  address: String,
  phone: String,
  gpa: Number,
  isDeleted: Boolean
}
```

### Teacher Model
```javascript
{
  userId: ObjectId (ref: User),
  teacherCode: String (unique),
  department: String,
  degree: String,
  isDeleted: Boolean
}
```

### Faculty Model
```javascript
{
  name: String,
  code: String (unique),
  description: String,
  isDeleted: Boolean
}
```

### Subject Model
```javascript
{
  name: String,
  code: String (unique),
  credits: Number,
  facultyId: ObjectId (ref: Faculty),
  description: String,
  isDeleted: Boolean
}
```

### Class Model
```javascript
{
  name: String,
  subjectId: ObjectId (ref: Subject),
  teacherId: ObjectId (ref: User),
  semester: String,
  year: String,
  status: Enum ['active', 'closed', 'upcoming'],
  maxStudents: Number,
  totalLessons: Number,
  scheduledLessons: Number,
  isDeleted: Boolean
}
```

### Enrollment Model
```javascript
{
  classId: ObjectId (ref: Class),
  studentId: ObjectId (ref: User),
  enrolledAt: Date,
  status: Enum ['active', 'completed', 'dropped', 'on_leave'],
  isCompleted: Boolean,
  completedAt: Date,
  cancelledAt: Date,
  cancelReason: String
}
```

### Schedule Model
```javascript
{
  classId: ObjectId (ref: Class),
  date: Date,              // Ngày học cụ thể
  startTime: String,       // "HH:MM"
  endTime: String,         // "HH:MM"
  room: String,
  isDeleted: Boolean
}
```

### AttendanceSession Model
```javascript
{
  classId: ObjectId (ref: Class),
  scheduleId: ObjectId (ref: Schedule),
  date: Date,
  startTime: String,
  endTime: String,
  qrCode: String,
  qrExpiry: Date,
  isDeleted: Boolean
}
```

### AttendanceRecord Model
```javascript
{
  sessionId: ObjectId (ref: AttendanceSession),
  studentId: ObjectId (ref: User),
  status: Enum ['present', 'absent', 'late'],
  checkedAt: Date,
  checkInMethod: Enum ['manual', 'qr']
}
```

### Assignment Model
```javascript
{
  classId: ObjectId (ref: Class),
  title: String,
  description: String,
  type: Enum ['essay', 'quiz'],
  dueDate: Date,
  maxScore: Number,
  attachments: [{ filename, path }],
  answerKey: { filename, path },
  questions: [{ question, options, correctAnswer }],
  status: Enum ['draft', 'published', 'closed'],
  isDeleted: Boolean
}
```

### Submission Model
```javascript
{
  assignmentId: ObjectId (ref: Assignment),
  studentId: ObjectId (ref: User),
  submittedAt: Date,
  files: [{ filename, path }],
  answers: [{ questionId, answer }],
  score: Number,
  feedback: String,
  status: Enum ['submitted', 'graded', 'late'],
  isLocked: Boolean,
  lockedReason: String
}
```

### Gradebook Model
```javascript
{
  classId: ObjectId (ref: Class),
  studentId: ObjectId (ref: User),
  qt: Number,              // Quá trình (30%)
  gk: Number,              // Giữa kỳ (20%)
  ck: Number,              // Cuối kỳ (50%)
  total: Number,           // Tổng điểm
  averageScore: Number,    // Điểm TB bài tập
  dismissedMarker: {
    isDismissed: Boolean,
    dismissedAt: Date,
    expulsionRecordId: ObjectId
  },
  isDeleted: Boolean
}
```

### AcademicWarning Model
```javascript
{
  studentId: ObjectId (ref: User),
  warningType: Enum ['low_gpa', 'probation'],
  warningLevel: Number [1, 2, 3],
  gpa: Number,
  threshold: Number,
  semester: String,
  createdBy: ObjectId (ref: User),
  notifiedAt: Date
}
```

### AttendanceWarning Model
```javascript
{
  studentId: ObjectId (ref: User),
  classId: ObjectId (ref: Class),
  absenceRate: Number,
  threshold: Number,
  totalSessions: Number,
  absentSessions: Number,
  createdBy: ObjectId (ref: User),
  notifiedAt: Date
}
```

### ExpulsionRecord Model
```javascript
{
  studentId: ObjectId (ref: User),
  reason: String,
  reasonType: Enum ['low_gpa', 'discipline_violation', 'excessive_absence', 'expired_leave'],
  effectiveDate: Date,
  attachments: [{ filename, path }],
  notes: String,
  status: Enum ['pending', 'active', 'appealed', 'revoked'],
  appealStatus: Enum ['none', 'pending', 'approved', 'rejected'],
  appealReason: String,
  appealEvidence: [{ filename, path }],
  appealSubmittedAt: Date,
  appealReviewedBy: ObjectId (ref: User),
  appealReviewedAt: Date,
  appealReviewNote: String,
  createdBy: ObjectId (ref: User),
  emailSentAt: Date
}
```

### AcademicLeave Model
```javascript
{
  studentId: ObjectId (ref: User),
  reason: String,
  startDate: Date,
  endDate: Date,
  status: Enum ['pending', 'approved', 'rejected', 'expired'],
  reviewedBy: ObjectId (ref: User),
  reviewedAt: Date,
  reviewNote: String
}
```

### Conversation Model (Chat)
```javascript
{
  participants: [{
    userId: ObjectId (ref: User),
    unreadCount: Number,
    lastReadAt: Date
  }],
  lastMessage: {
    content: String,
    senderId: ObjectId (ref: User),
    timestamp: Date
  }
}
```

### Message Model (Chat)
```javascript
{
  conversationId: ObjectId (ref: Conversation),
  senderId: ObjectId (ref: User),
  content: String (max 1000 chars),
  timestamp: Date
}
```

### Notification Model
```javascript
{
  userId: ObjectId (ref: User),
  title: String,
  content: String,
  type: String,
  isRead: Boolean,
  refId: ObjectId,
  refType: String,
  isDeleted: Boolean
}
```

### Announcement Model
```javascript
{
  classId: ObjectId (ref: Class),
  title: String,
  content: String,
  createdBy: ObjectId (ref: User),
  isDeleted: Boolean
}
```

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### JWT Authentication
- **Access Token**: Expires in 1 day (configurable)
- **Refresh Token**: Expires in 7 days (configurable)
- **Token Storage**: 
  - Access token: localStorage/sessionStorage (frontend)
  - Refresh token: Database (backend)

### Authorization Middleware

```javascript
// protect: Xác thực token
// authorize(...roles): Kiểm tra vai trò
// restrictTo(...roles): Alias của authorize
// checkExpelledStatus: Kiểm tra sinh viên bị đuổi học
// checkStudentNotOnLeave: Kiểm tra sinh viên đang bảo lưu
```

### Role-based Access Control (RBAC)

#### Admin
- Toàn quyền truy cập tất cả endpoints
- Quản lý người dùng, lớp học, môn học, khoa
- Xử lý đuổi học, bảo lưu, khiếu nại
- Gửi thông báo broadcast

#### Teacher
- Quản lý lớp học của mình
- Tạo bài tập, chấm điểm
- Điểm danh sinh viên
- Xem thống kê lớp học
- Chat với Admin và Student

#### Student
- Xem lớp học, lịch học
- Nộp bài tập
- Điểm danh
- Xem điểm số, GPA
- Xem cảnh báo
- Nộp đơn bảo lưu, khiếu nại
- Chat với Admin và Teacher

### Expelled Student Restrictions
Sinh viên bị đuổi học (status = 'dismissed') chỉ có thể truy cập:
- `/api/students/expulsions/me` - Xem thông tin đuổi học
- `/api/students/expulsions/:id/appeal` - Nộp khiếu nại
- `/api/students/warnings/me` - Xem cảnh báo
- `/api/auth/logout` - Đăng xuất
- `/api/users/profile` - Xem profile

Tất cả endpoints khác sẽ trả về lỗi 403 với message:
```json
{
  "success": false,
  "message": "Tài khoản đã bị đuổi học. Bạn chỉ có thể xem thông tin đuổi học và gửi đơn khiếu nại.",
  "code": "ACCOUNT_DISMISSED"
}
```

---

## 🔄 REAL-TIME FEATURES (Socket.io)

### Socket Connection
```javascript
// Client-side
import io from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Socket Events

#### Chat Events
```javascript
// Client → Server
socket.emit('conversation:join', { conversationId });
socket.emit('conversation:leave', { conversationId });
socket.emit('message:send', { conversationId, content });
socket.emit('typing:start', { conversationId });
socket.emit('typing:stop', { conversationId });

// Server → Client
socket.on('message:sent', ({ conversationId, message }));
socket.on('message:receive', ({ conversationId, message }));
socket.on('conversation:updated', ({ conversationId }));
socket.on('typing:start', ({ conversationId, userId }));
socket.on('typing:stop', ({ conversationId, userId }));
socket.on('user:online', ({ userId }));
socket.on('user:offline', ({ userId }));
```

#### Notification Events
```javascript
// Server → Client
socket.on('notification', ({ title, content, type }));
socket.on('notification:read', ());

// Client → Server
socket.emit('notification:read', ());
```

### Auto-join Conversations
Khi user connect, tự động join tất cả conversations của họ:
```javascript
// Backend: socket/chatSocketHandler.js
const userConversations = await ChatService.getConversations(userId, 1, 100);
userConversations.conversations.forEach(conversation => {
  socket.join(`conversation:${conversation._id}`);
});
```

### Online Status Tracking
- Redis cache: `chat:online_users` (Set)
- Emit `user:online` khi connect
- Emit `user:offline` khi disconnect
- API endpoint: `GET /api/chat/online-users`

---

## 📚 HƯỚNG DẪN SỬ DỤNG

### 1. Đăng nhập

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "admin@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "...",
      "name": "Admin User",
      "email": "admin@example.com",
      "role": "admin",
      "avatar": ""
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Sử dụng token**:
```javascript
// Thêm vào header của mọi request
headers: {
  'Authorization': 'Bearer ' + accessToken
}
```

### 2. Tạo lớp học (Admin)

**Endpoint**: `POST /api/classes`

**Request**:
```json
{
  "name": "Lập trình Web - Nhóm 1",
  "subjectId": "subject_id_here",
  "teacherId": "teacher_id_here",
  "semester": "1",
  "year": "2024",
  "maxStudents": 50,
  "totalLessons": 15
}
```

### 3. Thêm sinh viên vào lớp

**Endpoint**: `POST /api/classes/:classId/students`

**Request**:
```json
{
  "studentId": "student_id_here"
}
```

**Hoặc import Excel**:
```
POST /api/classes/:classId/students/import
Content-Type: multipart/form-data
file: [Excel file]
```

### 4. Tạo lịch học

**Endpoint**: `POST /api/classes/:classId/schedules`

**Request**:
```json
{
  "date": "2024-03-15",
  "startTime": "08:00",
  "endTime": "10:00",
  "room": "A101"
}
```

**Tạo hàng loạt**:
```json
POST /api/classes/:classId/schedules/bulk
{
  "schedules": [
    {
      "date": "2024-03-15",
      "startTime": "08:00",
      "endTime": "10:00",
      "room": "A101"
    },
    {
      "date": "2024-03-22",
      "startTime": "08:00",
      "endTime": "10:00",
      "room": "A101"
    }
  ]
}
```

### 5. Điểm danh

#### Sinh viên check-in trực tiếp:
```
POST /api/classes/:classId/attendance/check-in
```

#### Giảng viên tạo QR code:
```
POST /api/attendance/sessions/:sessionId/generate-code
```

#### Sinh viên quét QR:
```json
POST /api/attendance/check-in
{
  "qrCode": "generated_qr_code_here"
}
```

#### Giảng viên điểm danh thủ công:
```json
POST /api/attendance/sessions/:sessionId/manual
{
  "studentId": "student_id_here",
  "status": "present"
}
```

### 6. Tạo bài tập

**Endpoint**: `POST /api/classes/:classId/assignments`

**Essay Assignment**:
```json
{
  "title": "Bài tập tuần 1",
  "description": "Viết báo cáo về...",
  "type": "essay",
  "dueDate": "2024-03-20T23:59:59Z",
  "maxScore": 10
}
```

**Quiz Assignment**:
```json
{
  "title": "Kiểm tra trắc nghiệm",
  "type": "quiz",
  "dueDate": "2024-03-20T23:59:59Z",
  "maxScore": 10,
  "questions": [
    {
      "question": "Câu hỏi 1?",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A"
    }
  ]
}
```

### 7. Nộp bài tập

**Endpoint**: `POST /api/assignments/:id/submit`

**Essay**:
```
Content-Type: multipart/form-data
files: [File1, File2, ...]
```

**Quiz**:
```json
{
  "answers": [
    {
      "questionId": "question_id_1",
      "answer": "A"
    },
    {
      "questionId": "question_id_2",
      "answer": "B"
    }
  ]
}
```

### 8. Chấm điểm

**Endpoint**: `POST /api/submissions/:id/grade`

**Request**:
```json
{
  "score": 8.5,
  "feedback": "Bài làm tốt, cần cải thiện..."
}
```

### 9. Cập nhật sổ điểm

**Endpoint**: `PUT /api/classes/:classId/gradebook/:studentId`

**Request**:
```json
{
  "qt": 8.0,
  "gk": 7.5,
  "ck": 9.0
}
```

**Bulk update**:
```json
POST /api/classes/:classId/gradebook/bulk
{
  "grades": [
    {
      "studentId": "student_id_1",
      "qt": 8.0,
      "gk": 7.5,
      "ck": 9.0
    },
    {
      "studentId": "student_id_2",
      "qt": 7.0,
      "gk": 8.0,
      "ck": 8.5
    }
  ]
}
```

### 10. Tạo quyết định đuổi học

**Endpoint**: `POST /api/admin/expulsions`

**Request**:
```
Content-Type: multipart/form-data
studentId: student_id_here
reason: Lý do chi tiết...
reasonType: low_gpa
effectiveDate: 2024-04-01
notes: Ghi chú thêm...
attachments: [File1, File2, ...]
```

### 11. Nộp đơn khiếu nại

**Endpoint**: `PUT /api/students/expulsions/:id/appeal`

**Request**:
```
Content-Type: multipart/form-data
appealReason: Lý do khiếu nại...
evidence: [File1, File2, ...]
```

### 12. Chat

#### Tạo conversation:
```json
POST /api/chat/conversations
{
  "participantId": "user_id_to_chat_with"
}
```

#### Gửi tin nhắn (Socket.io):
```javascript
socket.emit('message:send', {
  conversationId: 'conversation_id',
  content: 'Hello!'
});
```

#### Nhận tin nhắn:
```javascript
socket.on('message:receive', ({ conversationId, message }) => {
  console.log('New message:', message);
});
```

### 13. Gửi thông báo broadcast (Admin)

**Endpoint**: `POST /api/notifications/broadcast`

**Request**:
```json
{
  "title": "Thông báo quan trọng",
  "content": "Nội dung thông báo...",
  "type": "announcement",
  "targetRole": "student"  // hoặc "teacher", "admin", "all"
}
```

---

## 🔧 CONFIGURATION

### Environment Variables

#### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/student_management

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Frontend URL
FRONTEND_URL=http://localhost:3000

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 🧪 TESTING

### Test Structure
```
backend/src/__tests__/
├── unit/              # Unit tests
│   ├── attendance.test.js
│   ├── controllers/
│   ├── models/
│   └── services/
├── integration/       # Integration tests
│   └── attendance.integration.test.js
└── property/          # Property-based tests
    └── attendance.property.test.js
```

### Run Tests
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:property      # Property-based tests
npm run test:coverage      # Coverage report
```

---

## 🚀 DEPLOYMENT

### Production Build

#### Backend
```bash
cd backend
npm install --production
npm start
```

#### Frontend
```bash
cd frontend
npm run build
# Deploy build/ folder to static hosting
```

### Docker (Optional)
```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup
- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure proper CORS origins
- Enable rate limiting
- Set up MongoDB replica set (recommended)
- Configure Redis for caching
- Set up email service (SMTP)

---

## 📊 PERFORMANCE OPTIMIZATION

### Database Indexes
- Compound indexes trên các trường thường query
- Index trên foreign keys
- Index trên trường `isDeleted`, `status`, `role`

### Caching Strategy
- **Redis cache**:
  - Unread count (TTL: 5 phút)
  - Online users
- **In-memory cache**:
  - Typing indicators

### Query Optimization
- Sử dụng `.lean()` cho read-only queries
- Field projection (chỉ lấy fields cần thiết)
- Pagination (limit 50 items/page)
- Populate chỉ fields cần thiết

### Rate Limiting
- Login: 20 requests/15 minutes
- General API: 100 requests/15 minutes (production)

---

## 🔒 SECURITY

### Implemented Security Measures
- **Helmet**: HTTP security headers
- **CORS**: Configured origins
- **XSS Protection**: Input sanitization
- **JWT**: Secure token-based auth
- **Bcrypt**: Password hashing (10 rounds)
- **Rate Limiting**: Prevent brute force
- **Input Validation**: Joi schemas
- **File Upload Validation**: Multer with size limits
- **Soft Delete**: Data preservation
- **SQL Injection**: MongoDB parameterized queries

---

## 📝 LICENSE

MIT License

---

## 👥 CONTRIBUTORS

- Development Team

---

## 📞 SUPPORT

For issues and questions:
- Email: support@example.com
- GitHub Issues: [repository-url]

---

**Phiên bản**: 1.0.0  
**Cập nhật lần cuối**: 2024
