# Hệ thống Quản Lý Lớp Học (MERN Stack)

Đồ án tốt nghiệp - Stack: ReactJS + Node.js (Express) + MongoDB + JWT

## Mục lục
- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Phân quyền](#phân-quyền)
- [Cài đặt](#cài-đặt)
- [Tài khoản mặc định](#tài-khoản-mặc-định)
- [Nghiệp vụ hệ thống](#nghiệp-vụ-hệ-thống)
  - [Quản lý Người dùng](#quản-lý-người-dùng)
  - [Quản lý Khoa](#quản-lý-khoa)
  - [Quản lý Môn học](#quản-lý-môn-học)
  - [Quản lý Lớp học](#quản-lý-lớp-học)
  - [Quản lý Điểm danh](#quản-lý-điểm-danh)
  - [Quản lý Bài tập](#quản-lý-bài-tập)
  - [Quản lý Nộp bài](#quản-lý-nộp-bài)
  - [Quản lý Bảng điểm](#quản-lý-bảng-điểm)
  - [Quản lý Thông báo](#quản-lý-thông-báo)
  - [Quản lý Vi phạm](#quản-lý-vi-phạm)
  - [Quản lý Kỷ luật](#quản-lý-kỷ-luật)
  - [Hệ thống Chat](#hệ-thống-chat)
- [Cơ sở dữ liệu](#cơ-sở-dữ-liệu)
  - [Thực thể (Entities)](#thực-thể-entities)
  - [Quan hệ thực thể](#quan-hệ-thực-thể)
- [API Endpoints](#api-endpoints)
- [Tính năng](#tính-năng)

## Tổng quan

Hệ thống quản lý lớp học toàn diện cho trường học, hỗ trợ quản lý sinh viên, giảng viên, lớp học, bài tập, điểm danh, bảng điểm, và các quy trình kỷ luật học sinh.

## Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js** - REST API server
- **MongoDB** - Database (standalone mode, không dùng replica set)
- **JWT** - Authentication & Authorization
- **bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service
- **Socket.io** - Real-time notifications

### Frontend
- **React.js** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Toastify** - Toast notifications
- **CSS3** - Modern UI/UX với animations

### Security
- **Helmet** - HTTP headers security
- **CORS** - Cross-origin resource sharing
- **Rate limiting** - API rate limiting
- **Input sanitization** - XSS protection

## Phân quyền

| Role    | Mô tả                                                    |
|---------|----------------------------------------------------------|
| Admin   | Quản trị toàn hệ thống, tạo tài khoản, phân công, kỷ luật |
| Teacher | Quản lý lớp học, bài tập, điểm số, điểm danh, báo cáo vi phạm |
| Student | Xem thông tin, nộp bài, theo dõi kết quả học tập, kháng cáo |


## Cài đặt

### Yêu cầu hệ thống
- Node.js >= 14.x
- MongoDB >= 4.x
- npm hoặc yarn

### MongoDB
Đảm bảo MongoDB chạy trên `localhost:27017` (standalone mode).

```bash
# Khởi động MongoDB
mongod
```

### Backend Setup
```bash
cd backend
npm install

# Tạo file .env từ template
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
# PORT=5000
# MONGO_URI=mongodb://localhost:27017/school_management
# JWT_SECRET=your_jwt_secret
# JWT_REFRESH_SECRET=your_refresh_secret
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your_email@gmail.com
# EMAIL_PASS=your_app_password

# Seed dữ liệu mẫu (tạo tài khoản mặc định, khoa, môn học)
npm run seed

# Khởi động server
npm run dev
```

Server chạy tại: `http://localhost:5000`

### Frontend Setup
```bash
cd frontend
npm install

# Tạo file .env
echo "REACT_APP_API_URL=http://localhost:5000/api" > .env

# Khởi động ứng dụng
npm start
```

Ứng dụng chạy tại: `http://localhost:3000`

## Tài khoản mặc định

Sau khi chạy `npm run seed`, các tài khoản sau sẽ được tạo:

| Role    | Email                | Mật khẩu | Mô tả                    |
|---------|----------------------|----------|--------------------------|
| Admin   | admin@school.vn      | 123456   | Quản trị viên hệ thống   |
| Teacher | giangvien@school.vn  | 123456   | Giảng viên mẫu           |
| Student | sinhvien@school.vn   | 123456   | Sinh viên mẫu            |

**Lưu ý**: Đổi mật khẩu ngay sau lần đăng nhập đầu tiên trong môi trường production.


## Nghiệp vụ hệ thống

### 1. Quản lý Người dùng (User Management)

#### Thực thể: User
- **Mô tả**: Thông tin người dùng trong hệ thống
- **Thuộc tính**:
  - `name`: Họ và tên (bắt buộc)
  - `email`: Email đăng nhập (bắt buộc, duy nhất)
  - `password`: Mật khẩu đã hash (bắt buộc)
  - `role`: Vai trò (admin/teacher/student, bắt buộc)
  - `avatar`: Link ảnh đại diện
  - `phone`: Số điện thoại
  - `studentCode`: Mã sinh viên (cho role student)
  - `teacherCode`: Mã giảng viên (cho role teacher)
  - `isLocked`: Trạng thái khóa tài khoản
  - `status`: Trạng thái (active/on_leave/dismissed/suspended)
  - `isDeleted`: Đã xóa (soft delete)
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Student
- **Mô tả**: Thông tin chi tiết sinh viên
- **Thuộc tính**:
  - `userId`: ID User tham chiếu (bắt buộc, duy nhất)
  - `studentCode`: Mã sinh viên (bắt buộc, duy nhất)
  - `classId`: ID lớp học hiện tại
  - `dateOfBirth`: Ngày sinh
  - `address`: Địa chỉ
  - `phone`: Số điện thoại
  - `gpa`: Điểm trung bình tích lũy
  - `enrollmentYear`: Năm nhập học
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Teacher
- **Mô tả**: Thông tin chi tiết giảng viên
- **Thuộc tính**:
  - `userId`: ID User tham chiếu (bắt buộc, duy nhất)
  - `teacherCode`: Mã giảng viên (bắt buộc, duy nhất)
  - `department`: Bộ môn/Khoa
  - `degree`: Học vị (Thạc sĩ/Tiến sĩ)
  - `specialization`: Chuyên môn
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Đăng ký tài khoản**: Admin tạo tài khoản cho teacher và student
- **Đăng nhập**: Xác thực email/password, trả JWT token
- **Quên mật khẩu**: Gửi OTP qua email để reset
- **Đổi mật khẩu**: Cập nhật mật khẩu mới
- **Cập nhật profile**: Thay đổi thông tin cá nhân
- **Khóa/Mở khóa tài khoản**: Admin quản lý trạng thái tài khoản
- **Xóa tài khoản**: Soft delete, giữ dữ liệu liên quan
- **Import hàng loạt**: Import từ CSV file

#### Quy tắc nghiệp vụ:
- Email phải duy nhất trong hệ thống
- Password được hash bằng bcrypt (10 rounds)
- Admin có thể tạo tất cả loại tài khoản
- Teacher/Student không thể tự đăng ký
- Soft delete để giữ dữ liệu liên quan
- Mã sinh viên và mã giảng viên phải duy nhất

### 2. Quản lý Khoa (Faculty Management)

#### Thực thể: Faculty
- **Mô tả**: Đơn vị học thuật trong trường
- **Thuộc tính**:
  - `name`: Tên khoa (bắt buộc)
  - `code`: Mã khoa (duy nhất)
  - `description`: Mô tả chi tiết
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Tạo khoa**: Admin tạo mới khoa
- **Danh sách khoa**: Xem tất cả khoa đang hoạt động
- **Cập nhật khoa**: Sửa thông tin khoa
- **Xóa khoa**: Soft delete khi không còn môn học liên quan

#### Quy tắc nghiệp vụ:
- Mã khoa phải duy nhất
- Không thể xóa khoa khi còn môn học đang sử dụng
- Khoa được dùng để phân loại môn học

---

### 3. Quản lý Môn học (Subject Management)

#### Thực thể: Subject
- **Mô tả**: Môn học trong chương trình đào tạo
- **Thuộc tính**:
  - `name`: Tên môn học (bắt buộc)
  - `code`: Mã môn học (duy nhất)
  - `credits`: Số tín chỉ (mặc định 3)
  - `facultyId`: ID khoa tham chiếu
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Tạo môn học**: Admin/giảng viên tạo môn học mới
- **Danh sách môn học**: Xem theo khoa hoặc tất cả
- **Cập nhật môn học**: Sửa thông tin môn học
- **Xóa môn học**: Soft delete khi không còn lớp học sử dụng

#### Quy tắc nghiệp vụ:
- Mã môn học phải duy nhất
- Môn học phải thuộc một khoa
- Không thể xóa khi còn lớp học đang hoạt động
- Số tín chỉ mặc định là 3

### 4. Quản lý Lớp học (Class Management)

#### Thực thể: Class
- **Mô tả**: Lớp học cụ thể của một môn học trong một học kỳ
- **Thuộc tính**:
  - `name`: Tên lớp (bắt buộc)
  - `code`: Mã lớp (duy nhất)
  - `subjectId`: ID môn học tham chiếu (bắt buộc)
  - `teacherId`: ID giảng viên phụ trách (bắt buộc)
  - `semester`: Học kỳ (HK1/HK2/HK3, bắt buộc)
  - `year`: Năm học (2023-2024, bắt buộc)
  - `status`: Trạng thái (active/closed/upcoming, mặc định active)
  - `maxStudents`: Số sinh viên tối đa (mặc định 50)
  - `totalLessons`: Tổng số buổi học
  - `scheduledLessons`: Số buổi đã lên lịch
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Enrollment
- **Mô tả**: Ghi danh sinh viên vào lớp học
- **Thuộc tính**:
  - `classId`: ID lớp học (bắt buộc)
  - `studentId`: ID sinh viên (bắt buộc)
  - `status`: Trạng thái (active/completed/dropped/on_leave, mặc định active)
  - `enrolledAt`: Thời gian ghi danh
  - `completedAt`: Thời gian hoàn thành
  - `cancelledAt`: Thời gian hủy
  - `cancelReason`: Lý do hủy
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Tạo lớp học**: Admin/giảng viên tạo lớp mới
- **Danh sách lớp học**: 
  - Admin: Xem tất cả lớp
  - Teacher: Xem lớp mình phụ trách
  - Student: Xem lớp mình đã ghi danh
- **Cập nhật lớp học**: Sửa thông tin lớp
- **Xóa lớp học**: Soft delete khi không còn sinh viên
- **Import sinh viên**: Import từ file Excel
- **Ghi danh sinh viên**: Thêm/xóa sinh viên khỏi lớp
- **Quản lý trạng thái sinh viên**: Đi học/Bảo lưu/Đuổi học/Đình chỉ

#### Quy tắc nghiệp vụ:
- Mỗi lớp chỉ có một giảng viên phụ trách
- Giảng viên chỉ quản lý lớp mình phụ trách
- Sinh viên chỉ xem lớp mình đã ghi danh
- scheduledLessons không thể vượt quá totalLessons
- Lớp học có thể ở các trạng thái: active, closed, upcoming
- Enrollment có unique index trên (classId, studentId)


### 5. Quản lý Bài tập (Assignment Management)

#### Thực thể: Assignment
- **Mô tả**: Bài tập/bài kiểm tra của lớp học
- **Thuộc tính**:
  - `classId`: ID lớp học (bắt buộc)
  - `title`: Tiêu đề bài tập (bắt buộc)
  - `description`: Mô tả chi tiết
  - `deadline`: Hạn nộp bài (bắt buộc)
  - `maxScore`: Điểm tối đa (mặc định 10)
  - `type`: Loại bài tập (individual/group, mặc định individual)
  - `mode`: Hình thức (file/quiz, mặc định file)
  - `durationMinutes`: Thời gian làm bài (phút, mặc định 60)
  - `status`: Trạng thái (draft/published/closed, mặc định draft)
  - `attachments`: File đính kèm [{url, name}]
  - `lockedStudents`: Sinh viên bị khóa [{studentId, lockedAt, reason}]
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Question
- **Mô tả**: Câu hỏi cho bài tập trắc nghiệm
- **Thuộc tính**:
  - `assignmentId`: ID bài tập (bắt buộc)
  - `content`: Nội dung câu hỏi (bắt buộc)
  - `options`: Lựa chọn [{text, isCorrect}]
  - `type`: Loại câu hỏi (single/multiple)
  - `points`: Điểm câu hỏi (mặc định 1)
  - `order`: Thứ tự hiển thị
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Submission
- **Mô tả**: Bài nộp của sinh viên cho bài tập
- **Thuộc tính**:
  - `assignmentId`: ID bài tập (bắt buộc)
  - `studentId`: ID sinh viên (bắt buộc)
  - `content`: Nội dung bài làm (text)
  - `files`: File nộp [{url, name}]
  - `status`: Trạng thái (submitted/late/graded, mặc định submitted)
  - `submittedAt`: Thời gian nộp bài
  - `score`: Điểm đạt được
  - `feedback`: Nhận xét của giảng viên
  - `gradedBy`: ID giảng viên chấm điểm
  - `gradedAt`: Thời gian chấm điểm
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: SubmissionAnswer
- **Mô tả**: Câu trả lời cho bài tập trắc nghiệm
- **Thuộc tính**:
  - `submissionId`: ID bài nộp (bắt buộc)
  - `questionId`: ID câu hỏi (bắt buộc)
  - `selectedOptions`: Lựa chọn sinh viên đã chọn
  - `isCorrect`: Đáp án có đúng không
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Tạo bài tập**: Giảng viên tạo bài tập mới
- **Soạn thảo bài tập**: Lưu nháp (status: draft)
- **Xuất bản bài tập**: Đăng bài tập cho sinh viên (status: published)
- **Đóng bài tập**: Ngừng nhận nộp bài (status: closed)
- **Quản lý câu hỏi**: Thêm/sửa/xóa câu hỏi trắc nghiệm
- **Upload file đính kèm**: Tài liệu cho bài tập
- **Khóa sinh viên**: Ngăn sinh viên nộp bài
- **Danh sách bài tập**: Xem theo lớp, trạng thái
- **Nộp bài tập**: Sinh viên nộp bài trước deadline
- **Nộp bài muộn**: Hệ thống đánh dấu late nếu sau deadline
- **Upload file**: Nộp nhiều file cho bài tập
- **Làm bài trắc nghiệm**: Làm và nộp bài trắc nghiệm trực tuyến
- **Chấm điểm**: Giảng viên chấm điểm bài tập file
- **Tự động chấm điểm**: Trắc nghiệm tự động chấm
- **Xem bài nộp**: Sinh viên xem bài đã nộp và điểm
- **Nhận xét**: Giảng viên gửi nhận xét cho sinh viên

#### Quy tắc nghiệp vụ:
- Bài tập phải có hạn nộp bài
- Giảng viên có thể soạn thảo trước khi xuất bản
- Sinh viên chỉ thấy bài tập đã xuất bản
- Bài tập trắc nghiệm tự động chấm điểm
- Bài tập file cần giảng viên chấm điểm thủ công
- Có thể khóa sinh viên khỏi bài tập (với lý do)
- Mỗi sinh viên chỉ nộp một lần cho mỗi bài tập
- Hệ thống tự động đánh dấu late nếu nộp sau deadline
- Trắc nghiệm tự động chấm điểm ngay khi nộp
- Giảng viên có thể chấm lại nếu cần
- Sinh viên có thể xem nhận xét sau khi được chấm điểm

### 6. Quản lý Bảng điểm (Gradebook Management)

#### Thực thể: Gradebook
- **Mô tả**: Điểm tổng kết của sinh viên trong một lớp học
- **Thuộc tính**:
  - `classId`: ID lớp học (bắt buộc)
  - `studentId`: ID sinh viên (bắt buộc)
  - `qt`: Điểm quá trình (mặc định 0)
  - `gk`: Điểm giữa kỳ (mặc định 0)
  - `ck`: Điểm cuối kỳ (mặc định 0)
  - `total`: Điểm tổng kết (tự động tính)
  - `averageScore`: Điểm trung bình bài tập (mặc định 0)
  - `dismissedMarker`: Đánh dấu đuổi học
    - `isDismissed`: Đã đuổi học
    - `dismissedAt`: Thời gian đuổi
    - `expulsionRecordId`: ID bản ghi đuổi học
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Nhập điểm**: Giảng viên nhập điểm QT, GK, CK
- **Tự động tính tổng**: Hệ thống tự động tính điểm tổng kết
- **Công thức tính**: Total = (QT × 0.3 + GK × 0.2 + CK × 0.5)
- **Cập nhật điểm**: Sửa điểm khi có sai sót
- **Xem bảng điểm**: Sinh viên xem điểm của mình
- **Xuất bảng điểm**: Export ra file Excel
- **Thống kê điểm**: Báo cáo điểm theo lớp
- **Tính điểm trung bình**: Tự động tính từ các bài trắc nghiệm

#### Quy tắc nghiệp vụ:
- Công thức tính điểm tổng kết cố định: QT×30% + GK×20% + CK×50%
- Điểm được làm tròn đến 1 chữ số thập phân
- Mỗi sinh viên chỉ có một dòng điểm cho mỗi lớp
- Giảng viên có thể cập nhật điểm bất cứ lúc nào
- Điểm trung bình bài tập được tính từ các bài trắc nghiệm
- Unique index trên (classId, studentId) để tránh trùng lặp
- Điểm total được tự động tính trong pre-save hook

### 7. Quản lý Điểm danh (Attendance Management)

#### Thực thể: AttendanceSession
- **Mô tả**: Buổi điểm danh của một lớp học
- **Thuộc tính**:
  - `classId`: ID lớp học (bắt buộc)
  - `date`: Ngày điểm danh (bắt buộc)
  - `shift`: Ca học (sáng/chiều/tối)
  - `code`: Mã QR code cho điểm danh
  - `codeExpiredAt`: Thời gian hết hạn QR code
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: AttendanceRecord
- **Mô tả**: Ghi nhận điểm danh của sinh viên
- **Thuộc tính**:
  - `sessionId`: ID buổi điểm danh (bắt buộc)
  - `studentId`: ID sinh viên (bắt buộc)
  - `status`: Trạng thái (present/absent/late, mặc định present)
  - `checkedAt`: Thời gian điểm danh
  - `checkInMethod`: Phương thức (manual/qr, mặc định manual)
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: AttendanceWarning
- **Mô tả**: Cảnh cáo về tỷ lệ vắng học
- **Thuộc tính**:
  - `studentId`: ID sinh viên (bắt buộc)
  - `classId`: ID lớp học (bắt buộc)
  - `warningLevel`: Mức độ cảnh cáo (warning/critical, bắt buộc)
  - `absenceRate`: Tỷ lệ vắng học (bắt buộc, 0-100)
  - `totalSessions`: Tổng số buổi học (bắt buộc)
  - `absentSessions`: Số buổi vắng (bắt buộc)
  - `notifiedAt`: Thời gian gửi thông báo
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Chức năng:
- **Tạo buổi điểm danh**: Giảng viên tạo session điểm danh
- **Tạo QR code**: Tạo mã QR 6 số, có thời hạn 5 phút
- **Điểm danh QR**: Sinh viên quét mã QR để điểm danh
- **Điểm danh thủ công**: Giảng viên điểm danh thủ công cho sinh viên
- **Điểm danh trực tiếp**: Sinh viên tự điểm danh dựa lịch học
- **Xem lịch điểm danh**: Xem các buổi điểm danh của lớp
- **Báo cáo điểm danh**: Thống kê tỷ lệ điểm danh
- **Tự động cảnh cáo**: Tự động tạo cảnh cáo khi vắng > 20%
- **Tính tỷ lệ điểm danh**: Tự động tính cho từng sinh viên và lớp
- **Quản lý trạng thái**: present/absent/late/excused

#### Quy tắc nghiệp vụ:
- QR code có định dạng 6 chữ số
- QR code hết hạn sau 5 phút
- Sinh viên chỉ được điểm danh một lần mỗi buổi
- Sinh viên không thuộc lớp không thể điểm danh
- Điểm danh sau 15 phút tính là muộn (late)
- Tự động tạo cảnh cáo khi tỷ lệ vắng > 20%
- Giảng viên có thể điểm danh thủ công khi cần
- Unique index trên (sessionId, studentId) để tránh trùng lặp
- Hệ thống tự động tính tỷ lệ vắng học và tạo cảnh cáo


### 8. Quản lý Lịch học (Schedule Management)

#### Tạo lịch học
- Teacher/Admin tạo lịch học cho lớp
- Thông tin: Thứ trong tuần, ngày bắt đầu, giờ bắt đầu, giờ kết thúc, phòng học
- Kiểm tra trùng lặp: Không cho phép tạo 2 lịch cùng thứ và cùng ngày

#### Quản lý lịch
- Teacher sửa lịch học (bao gồm cả ngày)
- Teacher xóa lịch học
- Tạo/xóa hàng loạt lịch học
- Tính số buổi học còn lại

#### Xem lịch
- Teacher xem lịch dạy của mình
- Student xem lịch học của mình
- Lọc lịch theo ngày
- Phân trang 5 lịch/trang cho sinh viên

### 9. Quản lý Thông báo (Notification Management)

#### Thực thể: Announcement
- **Mô tả**: Thông báo của lớp học
- **Thuộc tính**:
  - `classId`: ID lớp học (bắt buộc)
  - `teacherId`: ID giảng viên tạo (bắt buộc)
  - `title`: Tiêu đề thông báo (bắt buộc)
  - `content`: Nội dung chi tiết (bắt buộc)
  - `isPinned`: Ghim thông báo (mặc định false)
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Thực thể: Notification
- **Mô tả**: Thông báo hệ thống cho người dùng
- **Thuộc tính**:
  - `title`: Tiêu đề thông báo (bắt buộc)
  - `content`: Nội dung chi tiết (bắt buộc)
  - `type`: Loại thông báo (info/warning/error/success)
  - `recipientId`: ID người nhận
  - `senderId`: ID người gửi
  - `isRead`: Đã đọc (mặc định false)
  - `priority`: Mức độ ưu tiên (low/medium/high)
  - `actionUrl`: Link hành động (nếu có)
  - `expiresAt`: Thời gian hết hạn
  - `relatedId`: ID thực thể liên quan (bài tập, điểm, v.v.)
  - `relatedType`: Loại thực thể liên quan
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Thực thể: NotificationRead
- **Mô tả**: Theo dõi trạng thái đọc thông báo
- **Thuộc tính**:
  - `notificationId`: ID thông báo (bắt buộc)
  - `userId`: ID người dùng (bắt buộc)
  - `readAt`: Thời gian đọc
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Chức năng:
- **Tạo thông báo lớp**: Giảng viên tạo thông báo cho lớp
- **Tạo thông báo hệ thống**: Hệ thống tự động gửi thông báo
- **Thông báo real-time**: Dùng Socket.io để推送 real-time
- **Đánh dấu đã đọc**: Người dùng đánh dấu đã đọc
- **Đánh dấu tất cả đã đọc**: Đánh dấu tất cả thông báo là đã đọc
- **Danh sách thông báo**: Xem tất cả thông báo
- **Lọc thông báo**: Theo loại, trạng thái đọc, mức độ ưu tiên
- **Xóa thông báo**: Xóa thông báo đã đọc
- **Thông báo hàng loạt**: Gửi cho nhiều người dùng
- **Ghim thông báo**: Ghim thông báo quan trọng
- **Tự động hết hạn**: Xóa thông báo sau thời gian quy định

#### Quy tắc nghiệp vụ:
- Thông báo được推送 real-time qua Socket.io
- Thông báo có thể có mức độ ưu tiên khác nhau
- Thông báo có thể hết hạn (tự động xóa)
- Hệ thống tự động tạo thông báo cho các sự kiện quan trọng
- Người dùng nhận thông báo theo vai trò và quyền
- Thông báo lớp chỉ gửi cho sinh viên trong lớp
- Có thể liên kết với các thực thể khác (bài tập, điểm, v.v.)
- Thông báo có thể được ghim để hiển thị ưu tiên

### 10. Quản lý Bảo lưu (Academic Leave Management)

#### Thực thể: AcademicLeave
- **Mô tả**: Xin nghỉ học tạm thời
- **Thuộc tính**:
  - `studentId`: ID sinh viên (bắt buộc)
  - `type`: Loại nghỉ (medical/personal/family, bắt buộc)
  - `reason`: Lý do xin nghỉ (bắt buộc)
  - `startDate`: Ngày bắt đầu nghỉ (bắt buộc)
  - `endDate`: Ngày kết thúc nghỉ (bắt buộc)
  - `duration`: Số ngày nghỉ
  - `status`: Trạng thái (pending/approved/rejected, mặc định pending)
  - `approvedBy`: ID người duyệt
  - `approvedAt`: Thời gian duyệt
  - `rejectionReason`: Lý do từ chối
  - `documents`: Giấy tờ kèm theo [{url, name, type}]
  - `isDeleted`: Đã xóa
  - `createdAt`, `updatedAt`: Timestamps

#### Chức năng:
- **Yêu cầu bảo lưu**: Sinh viên xin nghỉ học
- **Duyệt bảo lưu**: Admin duyệt các quyết định bảo lưu
- **Từ chối bảo lưu**: Admin từ chối với lý do
- **Quản lý giấy tờ**: Upload và quản lý documents
- **Theo dõi trạng thái**: Xem tiến trình xử lý
- **Lịch sử bảo lưu**: Xem các lần bảo lưu của sinh viên
- **Tự động kết thúc**: Hệ thống tự động kết thúc khi hết hạn
- **Kết thúc sớm**: Admin có thể kết thúc bảo lưu sớm

#### Quy tắc nghiệp vụ:
- Sinh viên phải cung cấp lý do rõ ràng
- Cần có giấy tờ chứng minh (nếu là medical leave)
- Admin là người duyệt quyết định bảo lưu
- Khi được duyệt, trạng thái sinh viên chuyển sang "on_leave"
- Sinh viên bảo lưu bị hạn chế truy cập các chức năng học tập
- Hệ thống tự động khôi phục quyền khi hết hạn bảo lưu
- Có thể từ chối nếu lý do không hợp lệ
- Phải có ngày bắt đầu và kết thúc rõ ràng
- Duration được tự động tính từ startDate và endDate


### 11. Quản lý Kỷ luật & Đuổi học (Expulsion & Discipline Management)

#### Thực thể: AcademicWarning
- **Mô tả**: Cảnh cáo học thuật cho sinh viên
- **Thuộc tính**:
  - `studentId`: ID sinh viên (bắt buộc)
  - `type`: Loại cảnh cáo (academic/attendance/disciplinary, bắt buộc)
  - `reason`: Lý do cảnh cáo (bắt buộc)
  - `severity`: Mức độ (warning/critical, bắt buộc)
  - `status`: Trạng thái (active/resolved/expired, mặc định active)
  - `resolvedAt`: Thời gian giải quyết
  - `notes`: Ghi chú thêm
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Thực thể: ViolationReport
- **Mô tả**: Báo cáo vi phạm của sinh viên
- **Thuộc tính**:
  - `studentId`: ID sinh viên vi phạm (bắt buộc)
  - `reporterId`: ID người báo cáo (bắt buộc)
  - `classId`: ID lớp học liên quan
  - `type`: Loại vi phạm (academic/disciplinary/attendance, bắt buộc)
  - `description`: Mô tả chi tiết (bắt buộc)
  - `evidence`: Bằng chứng [{url, name, type}]
  - `severity`: Mức độ nghiêm trọng (low/medium/high/critical)
  - `status`: Trạng thái (pending/investigated/resolved/dismissed)
  - `resolvedAt`: Thời gian giải quyết
  - `resolution`: Kết quả giải quyết
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Thực thể: ExpulsionRecord
- **Mô tả**: Quyết định đuổi học sinh viên
- **Thuộc tính**:
  - `studentId`: ID sinh viên (bắt buộc)
  - `classId`: ID lớp học liên quan
  - `reason`: Lý do đuổi học (bắt buộc)
  - `type`: Loại đuổi (academic/disciplinary/voluntary, bắt buộc)
  - `effectiveDate`: Ngày có hiệu lực
  - `academicYear`: Năm học
  - `semester`: Học kỳ
  - `status`: Trạng thái (pending/approved/cancelled, mặc định pending)
  - `approvedBy`: ID người duyệt
  - `approvedAt`: Thời gian duyệt
  - `appealDeadline`: Hạn kháng cáo
  - `appealReason`: Lý do kháng cáo
  - `appealDocuments`: Tài liệu kháng cáo [{url, name, type}]
  - `appealStatus`: Trạng thái kháng cáo (pending/approved/rejected)
  - `appealResolvedAt`: Thời gian giải quyết kháng cáo
  - `documents`: Tài liệu đính kèm [{url, name, type}]
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Chức năng:
- **Tạo cảnh cáo**: Admin tạo cảnh cáo học thuật
- **Tự động cảnh cáo**: Hệ thống tự động tạo cảnh cáo khi điểm < 4.0 hoặc vắng > 20%
- **Báo cáo vi phạm**: Giảng viên/teacher báo cáo vi phạm
- **Điều tra vi phạm**: Admin điều tra các báo cáo
- **Quản lý bằng chứng**: Upload file bằng chứng
- **Đuổi học**: Admin ra quyết định đuổi học
- **Xin nghỉ học**: Sinh viên xin nghỉ học
- **Duyệt kỷ luật**: Admin duyệt các quyết định kỷ luật
- **Kháng cáo**: Sinh viên kháng cáo quyết định
- **Theo dõi kỷ luật**: Xem lịch sử kỷ luật
- **Thống kê kỷ luật**: Báo cáo và thống kê các trường hợp kỷ luật

#### Quy tắc nghiệp vụ:
- Cảnh cáo có thể là warning hoặc critical
- Đuổi học cần có lý do rõ ràng và bằng chứng
- Sinh viên có quyền kháng cáo trong thời hạn quy định
- Quyết định kỷ luật ảnh hưởng đến trạng thái sinh viên
- Hệ thống tự động cập nhật trạng thái sinh viên
- Cảnh cáo học tập: điểm tổng kết < 4.0 (warning), < 2.0 (critical)
- Cảnh cáo điểm danh: vắng > 20% (warning), > 30% (critical)
- Bất kỳ ai cũng có thể báo cáo vi phạm
- Báo cáo cần có mô tả chi tiết và bằng chứng
- Admin là người điều tra và giải quyết
- Sinh viên được kháng cáo quyết định
- Hệ thống lưu lịch sử tất cả các vi phạm


### 12. Hệ thống Chat (Chat System)

#### Thực thể: Conversation
- **Mô tả**: Cuộc trò chuyện giữa người dùng
- **Thuộc tính**:
  - `participants`: Danh sách người tham gia [userId]
  - `type`: Loại cuộc trò chuyện (direct/group/class, bắt buộc)
  - `classId`: ID lớp học (nếu là chat lớp)
  - `title`: Tiêu đề (cho nhóm)
  - `lastMessage`: Thông tin tin nhắn cuối cùng
  - `isActive`: Đang hoạt động (mặc định true)
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo
  - `updatedAt`: Thời gian cập nhật

#### Thực thể: Message
- **Mô tả**: Tin nhắn trong cuộc trò chuyện
- **Thuộc tính**:
  - `conversationId`: ID cuộc trò chuyện (bắt buộc)
  - `senderId`: ID người gửi (bắt buộc)
  - `content`: Nội dung tin nhắn (bắt buộc)
  - `type`: Loại tin nhắn (text/file/image, mặc định text)
  - `fileUrl`: Link file (nếu là tin nhắn file)
  - `fileName`: Tên file
  - `fileSize`: Kích thước file
  - `isRead`: Đã đọc (mặc định false)
  - `readAt`: Thời gian đọc
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian gửi
  - `updatedAt`: Thời gian cập nhật

#### Thực thể: MessageRead
- **Mô tả**: Theo dõi trạng thái đọc tin nhắn
- **Thuộc tính**:
  - `messageId`: ID tin nhắn (bắt buộc)
  - `userId`: ID người dùng (bắt buộc)
  - `readAt`: Thời gian đọc
  - `isDeleted`: Đã xóa
  - `createdAt`: Thời gian tạo

#### Chức năng:
- **Chat trực tiếp**: Chat 1-1 giữa người dùng
- **Chat nhóm**: Tạo nhóm chat cho nhiều người
- **Chat lớp học**: Chat cho tất cả thành viên lớp
- **Gửi tin nhắn real-time**: Dùng Socket.io
- **Gửi file**: Upload file trong chat
- **Thông báo đã đọc**: Hiển thị trạng thái đọc
- **Lịch sử chat**: Xem lại tin nhắn cũ
- **Tìm kiếm tin nhắn**: Tìm trong cuộc trò chuyện
- **Online status**: Hiển thị trạng thái online/offline
- **Typing indicators**: Hiển thị khi người khác đang gõ
- **Unread count**: Đếm số tin nhắn chưa đọc
- **Tìm kiếm người dùng**: Tìm để bắt đầu cuộc trò chuyện mới

#### Quy tắc nghiệp vụ:
- Chat hoạt động real-time qua Socket.io
- Tin nhắn được lưu trữ để xem lại
- Người dùng chỉ thấy chat của mình tham gia
- File được upload và lưu trữ an toàn
- Hệ thống thông báo khi có tin nhắn mới
- Có thể tạo chat 1-1, nhóm, hoặc chat lớp
- Tin nhắn có thể là text, file, hoặc image
- Hệ thống theo dõi trạng thái đọc của từng người dùng
- Chat lớp tự động tạo khi có sinh viên trong lớp
- Người dùng có thể rời khỏi nhóm chat

---

### 13. Dashboard & Thống kê

#### Admin Dashboard
- Tổng số người dùng (Admin, Teacher, Student)
- Tổng số lớp học (active, completed, cancelled)
- Tổng số khoa và môn học
- Thống kê kỷ luật (cảnh cáo, vi phạm, đuổi học)
- Danh sách yêu cầu bảo lưu chờ duyệt
- Hoạt động gần đây

#### Teacher Dashboard
- Số lớp đang dạy
- Tổng số sinh viên
- Số bài tập chưa chấm
- Tỷ lệ điểm danh trung bình các lớp
- Danh sách lớp học với thống kê nhanh
- Lịch dạy hôm nay

#### Student Dashboard
- Số lớp đang học
- Số bài tập chưa nộp/đã nộp
- Điểm trung bình tất cả các lớp
- Tỷ lệ điểm danh
- Cảnh cáo (nếu có)
- Lịch học hôm nay
- Thông báo mới


## API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/auth/login` | ❌ | All | Đăng nhập với email/password |
| POST | `/auth/logout` | ❌ | All | Đăng xuất, xóa refresh token |
| POST | `/auth/refresh-token` | ❌ | All | Làm mới access token |
| POST | `/auth/forgot-password` | ❌ | All | Gửi OTP qua email |
| POST | `/auth/verify-otp` | ❌ | All | Xác thực OTP |
| POST | `/auth/reset-password` | ❌ | All | Đặt lại mật khẩu |
| GET | `/auth/me` | ✅ | All | Lấy thông tin người dùng hiện tại |
| PUT | `/auth/me` | ✅ | All | Cập nhật thông tin cá nhân |
| PUT | `/auth/change-password` | ✅ | All | Đổi mật khẩu |
| PUT | `/auth/me/avatar` | ✅ | All | Upload avatar |

### User Management (`/api/users`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/users` | ✅ | Admin | Danh sách người dùng |
| POST | `/users` | ✅ | Admin | Tạo người dùng mới |
| GET | `/users/:id` | ✅ | Admin | Chi tiết người dùng |
| PUT | `/users/:id` | ✅ | Admin | Cập nhật người dùng |
| DELETE | `/users/:id` | ✅ | Admin | Xóa người dùng |
| PATCH | `/users/:id/lock` | ✅ | Admin | Khóa tài khoản |
| PATCH | `/users/:id/unlock` | ✅ | Admin | Mở khóa tài khoản |
| PATCH | `/users/:id/reset-password` | ✅ | Admin | Reset mật khẩu |
| POST | `/users/import` | ✅ | Admin | Import từ CSV |

### Faculty Management (`/api/faculties`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/faculties` | ✅ | All | Danh sách khoa |
| POST | `/faculties` | ✅ | Admin | Tạo khoa mới |
| GET | `/faculties/:id` | ✅ | All | Chi tiết khoa |
| PUT | `/faculties/:id` | ✅ | Admin | Cập nhật khoa |
| DELETE | `/faculties/:id` | ✅ | Admin | Xóa khoa |

### Subject Management (`/api/subjects`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/subjects` | ✅ | All | Danh sách môn học |
| POST | `/subjects` | ✅ | Admin | Tạo môn học mới |
| GET | `/subjects/:id` | ✅ | All | Chi tiết môn học |
| PUT | `/subjects/:id` | ✅ | Admin | Cập nhật môn học |
| DELETE | `/subjects/:id` | ✅ | Admin | Xóa môn học |
| GET | `/subjects/faculty/:facultyId` | ✅ | All | Môn học theo khoa |

### Class Management (`/api/classes`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes` | ✅ | All | Danh sách lớp học |
| POST | `/classes` | ✅ | Admin | Tạo lớp mới |
| GET | `/classes/:id` | ✅ | All | Chi tiết lớp học |
| PUT | `/classes/:id` | ✅ | Admin | Cập nhật lớp |
| DELETE | `/classes/:id` | ✅ | Admin | Xóa lớp |
| GET | `/classes/my-classes` | ✅ | Teacher, Student | Lớp của tôi |
| GET | `/classes/:id/students` | ✅ | All | Danh sách sinh viên |
| POST | `/classes/:id/students` | ✅ | Admin | Thêm sinh viên |
| DELETE | `/classes/:id/students/:studentId` | ✅ | Admin | Xóa sinh viên |
| POST | `/classes/:id/import-students` | ✅ | Admin | Import sinh viên CSV |

### Assignment Management (`/api/assignments`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/assignments` | ✅ | All | Danh sách bài tập lớp |
| POST | `/classes/:classId/assignments` | ✅ | Teacher | Tạo bài tập |
| GET | `/assignments/:id` | ✅ | All | Chi tiết bài tập |
| PUT | `/assignments/:id` | ✅ | Teacher | Cập nhật bài tập |
| DELETE | `/assignments/:id` | ✅ | Teacher | Xóa bài tập |
| PATCH | `/assignments/:id/publish` | ✅ | Teacher | Xuất bản bài tập |
| PATCH | `/assignments/:id/close` | ✅ | Teacher | Đóng bài tập |
| GET | `/assignments/:id/questions` | ✅ | Teacher | Danh sách câu hỏi |
| POST | `/assignments/:id/questions` | ✅ | Teacher | Thêm câu hỏi |

### Submission Management (`/api/submissions`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/assignments/:id/submit` | ✅ | Student | Nộp bài |
| PUT | `/assignments/:id/resubmit` | ✅ | Student | Nộp lại |
| GET | `/assignments/:id/my-submission` | ✅ | Student | Bài nộp của tôi |
| GET | `/assignments/:id/submissions` | ✅ | Teacher | Danh sách bài nộp |
| GET | `/submissions/:id` | ✅ | Teacher, Student | Chi tiết bài nộp |
| POST | `/submissions/:id/grade` | ✅ | Teacher | Chấm điểm |
| PUT | `/submissions/:id/grade` | ✅ | Teacher | Cập nhật điểm |

### Gradebook Management (`/api/gradebook`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/gradebook` | ✅ | Teacher, Student | Bảng điểm lớp |
| PUT | `/classes/:classId/gradebook/:studentId` | ✅ | Teacher | Cập nhật điểm |
| POST | `/classes/:classId/gradebook/bulk` | ✅ | Teacher | Cập nhật hàng loạt |
| GET | `/classes/:classId/gradebook/export` | ✅ | Teacher | Xuất Excel |
| GET | `/students/my-grades` | ✅ | Student | Điểm của tôi |

### Attendance Management (`/api/attendance`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/attendance/sessions` | ✅ | All | Danh sách buổi điểm danh |
| POST | `/classes/:classId/attendance/sessions` | ✅ | Teacher | Tạo buổi điểm danh |
| POST | `/attendance/sessions/:id/generate-code` | ✅ | Teacher | Tạo QR code |
| POST | `/attendance/check-in` | ✅ | Student | Điểm danh QR |
| POST | `/attendance/manual-check-in` | ✅ | Teacher | Điểm danh thủ công |
| GET | `/classes/:classId/attendance/report` | ✅ | Teacher | Báo cáo điểm danh |
| GET | `/attendance/my-attendance/:classId` | ✅ | Student | Điểm danh của tôi |

### Notification Management (`/api/notifications`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/notifications` | ✅ | All | Danh sách thông báo |
| POST | `/notifications` | ✅ | Admin | Gửi thông báo |
| PATCH | `/notifications/:id/read` | ✅ | All | Đánh dấu đã đọc |
| PATCH | `/notifications/read-all` | ✅ | All | Đọc tất cả |
| DELETE | `/notifications/:id` | ✅ | All | Xóa thông báo |

### Chat System (`/api/chat`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/chat/conversations` | ✅ | All | Danh sách cuộc trò chuyện |
| POST | `/chat/conversations` | ✅ | All | Tạo cuộc trò chuyện |
| GET | `/chat/conversations/:id` | ✅ | All | Chi tiết cuộc trò chuyện |
| GET | `/chat/conversations/:id/messages` | ✅ | All | Danh sách tin nhắn |
| POST | `/chat/conversations/:id/messages` | ✅ | All | Gửi tin nhắn |
| PATCH | `/chat/conversations/:id/read` | ✅ | All | Đánh dấu đã đọc |
| GET | `/chat/users/search` | ✅ | All | Tìm kiếm người dùng |
| GET | `/chat/unread-count` | ✅ | All | Số tin nhắn chưa đọc |

### Academic Leave (`/api/academic-leave`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/academic-leave` | ✅ | Student | Gửi yêu cầu bảo lưu |
| GET | `/academic-leave/my-requests` | ✅ | Student | Yêu cầu của tôi |
| GET | `/academic-leave` | ✅ | Admin | Danh sách yêu cầu |
| PUT | `/academic-leave/:id/approve` | ✅ | Admin | Phê duyệt |
| PUT | `/academic-leave/:id/reject` | ✅ | Admin | Từ chối |

### Discipline Management (`/api/discipline`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/discipline/warnings` | ✅ | Admin, Teacher | Danh sách cảnh cáo |
| POST | `/discipline/violations` | ✅ | Teacher | Báo cáo vi phạm |
| GET | `/discipline/violations` | ✅ | Admin | Danh sách vi phạm |
| POST | `/discipline/expulsions` | ✅ | Admin | Tạo quyết định đuổi học |
| GET | `/discipline/expulsions` | ✅ | Admin | Danh sách đuổi học |
| PUT | `/discipline/expulsions/:id/appeal` | ✅ | Student | Kháng cáo |
| PUT | `/discipline/expulsions/:id/approve-appeal` | ✅ | Admin | Chấp nhận kháng cáo |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/dashboard/admin` | ✅ | Admin | Dashboard Admin |
| GET | `/dashboard/teacher` | ✅ | Teacher | Dashboard Teacher |
| GET | `/dashboard/student` | ✅ | Student | Dashboard Student |

### Admin User Management (`/api/admin`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/admin/users` | ✅ | Admin | Danh sách người dùng |
| POST | `/admin/users` | ✅ | Admin | Tạo người dùng mới |
| POST | `/admin/users/import-csv` | ✅ | Admin | Import người dùng từ CSV |
| GET | `/admin/users/:id` | ✅ | Admin | Chi tiết người dùng |
| PUT | `/admin/users/:id` | ✅ | Admin | Cập nhật người dùng |
| DELETE | `/admin/users/:id` | ✅ | Admin | Xóa người dùng |
| PATCH | `/admin/users/:id/lock` | ✅ | Admin | Khóa tài khoản |
| PATCH | `/admin/users/:id/unlock` | ✅ | Admin | Mở khóa tài khoản |
| PATCH | `/admin/users/:id/reset-password` | ✅ | Admin | Reset mật khẩu |

### User Management (`/api/users`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/users/:id/reset-password` | ✅ | Teacher, Admin | Reset mật khẩu sinh viên |
| GET | `/users` | ✅ | Admin | Danh sách người dùng |
| POST | `/users` | ✅ | Admin | Tạo người dùng |
| GET | `/users/:id` | ✅ | Admin | Chi tiết người dùng |
| PUT | `/users/:id` | ✅ | Admin | Cập nhật người dùng |
| DELETE | `/users/:id` | ✅ | Admin | Xóa người dùng |
| PATCH | `/users/:id/status` | ✅ | Admin | Cập nhật trạng thái |
| PATCH | `/users/:id/reset-password` | ✅ | Admin | Reset mật khẩu |

### Faculties (`/api/faculties`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/faculties` | ✅ | All | Danh sách khoa |
| POST | `/faculties` | ✅ | Admin | Tạo khoa mới |
| PUT | `/faculties/:id` | ✅ | Admin | Cập nhật khoa |
| DELETE | `/faculties/:id` | ✅ | Admin | Xóa khoa |

### Subjects (`/api/subjects`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/subjects` | ✅ | All | Danh sách môn học |
| POST | `/subjects` | ✅ | Admin | Tạo môn học mới |
| GET | `/subjects/:id` | ✅ | All | Chi tiết môn học |
| PUT | `/subjects/:id` | ✅ | Admin | Cập nhật môn học |
| DELETE | `/subjects/:id` | ✅ | Admin | Xóa môn học |

### Academic Years (`/api/academic-years`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/academic-years` | ✅ | Admin, Teacher | Danh sách năm học |
| POST | `/academic-years` | ✅ | Admin | Tạo năm học mới |
| PUT | `/academic-years/:id` | ✅ | Admin | Cập nhật năm học |
| DELETE | `/academic-years/:id` | ✅ | Admin | Xóa năm học |

### Semesters (`/api/semesters`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/semesters` | ✅ | Admin, Teacher | Danh sách học kỳ |
| POST | `/semesters` | ✅ | Admin | Tạo học kỳ mới |
| PUT | `/semesters/:id` | ✅ | Admin | Cập nhật học kỳ |
| DELETE | `/semesters/:id` | ✅ | Admin | Xóa học kỳ |


### Classes (`/api/classes`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes` | ✅ | All | Danh sách lớp học |
| GET | `/classes/my-classes` | ✅ | Teacher, Student | Lớp của tôi |
| POST | `/classes` | ✅ | Admin | Tạo lớp mới |
| GET | `/classes/:id` | ✅ | All | Chi tiết lớp học |
| PUT | `/classes/:id` | ✅ | Admin | Cập nhật lớp |
| DELETE | `/classes/:id` | ✅ | Admin | Xóa lớp |
| PATCH | `/classes/:id/status` | ✅ | Admin | Cập nhật trạng thái lớp |
| GET | `/classes/:id/students` | ✅ | All | Danh sách sinh viên trong lớp |
| GET | `/classes/:id/my-enrollment` | ✅ | Student | Thông tin đăng ký của tôi |
| POST | `/classes/:id/students` | ✅ | Admin | Thêm sinh viên vào lớp |
| POST | `/classes/:id/students/import` | ✅ | Admin | Import sinh viên từ CSV |
| DELETE | `/classes/:id/students/:userId` | ✅ | Admin | Xóa sinh viên khỏi lớp |

### Assignments (`/api/assignments`, `/api/classes/:classId/assignments`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/assignments` | ✅ | All | Danh sách bài tập của lớp |
| POST | `/classes/:classId/assignments` | ✅ | Teacher | Tạo bài tập mới |
| GET | `/assignments/:id` | ✅ | All | Chi tiết bài tập |
| PUT | `/assignments/:id` | ✅ | Teacher | Cập nhật bài tập |
| DELETE | `/assignments/:id` | ✅ | Teacher | Xóa bài tập |
| POST | `/assignments/:id/attachments` | ✅ | Teacher | Thêm file đính kèm |
| GET | `/assignments/download/:filename` | ✅ | All | Tải file đính kèm |
| GET | `/assignments/:id/answer-key` | ✅ | Teacher | Tải đáp án |
| PATCH | `/assignments/:id/publish` | ✅ | Teacher | Xuất bản bài tập |
| PATCH | `/assignments/:id/close` | ✅ | Teacher | Đóng bài tập |
| PATCH | `/assignments/:id/status` | ✅ | Teacher | Cập nhật trạng thái |

### Submissions (`/api/assignments/:id/submit`, `/api/submissions`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/assignments/:id/submit` | ✅ | Student | Nộp bài |
| PUT | `/assignments/:id/resubmit` | ✅ | Student | Nộp lại bài |
| GET | `/assignments/:id/my-submission` | ✅ | Student | Bài nộp của tôi |
| GET | `/assignments/:id/submissions` | ✅ | Teacher | Danh sách bài nộp |
| GET | `/submissions/:id` | ✅ | Teacher, Student | Chi tiết bài nộp |
| GET | `/submissions/:id/download` | ✅ | Teacher | Tải bài nộp |
| POST | `/submissions/:id/grade` | ✅ | Teacher | Chấm điểm |
| PUT | `/submissions/:id/grade` | ✅ | Teacher | Cập nhật điểm |

### Gradebook (`/api/classes/:classId/gradebook`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/gradebook` | ✅ | Teacher, Student | Bảng điểm lớp |
| PUT | `/classes/:classId/gradebook/:studentId` | ✅ | Teacher | Cập nhật điểm sinh viên |
| POST | `/classes/:classId/gradebook/bulk` | ✅ | Teacher | Cập nhật hàng loạt |
| GET | `/classes/:classId/gradebook/export` | ✅ | Teacher | Xuất Excel |

### Scores (`/api/scores`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/scores` | ✅ | All | Danh sách điểm |
| POST | `/scores` | ✅ | Admin, Teacher | Tạo điểm mới |
| PUT | `/scores/:id` | ✅ | Admin, Teacher | Cập nhật điểm |
| DELETE | `/scores/:id` | ✅ | Admin | Xóa điểm |
| PATCH | `/scores/:id/lock` | ✅ | Admin, Teacher | Khóa điểm |
| POST | `/scores/import` | ✅ | Admin, Teacher | Import điểm từ file |
| GET | `/scores/export` | ✅ | Admin, Teacher | Xuất điểm ra file |

### Student Grades (`/api/students`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/students/my-grades` | ✅ | Student | Điểm của tôi (tất cả lớp) |
| GET | `/students/my-grades/:classId` | ✅ | Student | Điểm của tôi (theo lớp) |


### Attendance (`/api/attendance`, `/api/classes/:classId/attendance`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/classes/:classId/attendance/sessions` | ✅ | Teacher | Tạo buổi điểm danh |
| GET | `/classes/:classId/attendance/sessions` | ✅ | All | Danh sách buổi điểm danh |
| PUT | `/attendance/sessions/:sessionId` | ✅ | Teacher | Cập nhật buổi điểm danh |
| POST | `/attendance/sessions/:sessionId/generate-code` | ✅ | Teacher | Tạo mã điểm danh |
| GET | `/attendance/sessions/:sessionId/records` | ✅ | Teacher | Danh sách điểm danh buổi |
| POST | `/attendance/sessions/:sessionId/manual` | ✅ | Teacher | Điểm danh thủ công 1 sinh viên |
| PUT | `/attendance/sessions/:sessionId/manual` | ✅ | Teacher | Điểm danh thủ công hàng loạt |
| POST | `/attendance/check-in` | ✅ | Student | Điểm danh bằng mã |
| POST | `/classes/:classId/attendance/direct-checkin` | ✅ | Student | Điểm danh trực tiếp |
| GET | `/classes/:classId/attendance/student-status` | ✅ | Student | Trạng thái điểm danh của tôi |
| GET | `/classes/:classId/attendance/report` | ✅ | Teacher | Báo cáo điểm danh lớp |
| GET | `/attendance/my-attendance/:classId` | ✅ | Student | Điểm danh của tôi |
| GET | `/attendance/statistics/:classId` | ✅ | All | Thống kê điểm danh lớp |
| GET | `/attendance/rate/:classId` | ✅ | Student | Tỷ lệ điểm danh của tôi |
| GET | `/attendance/teacher-rates` | ✅ | Teacher | Tỷ lệ điểm danh các lớp |
| GET | `/attendance/teacher-rates/:teacherId` | ✅ | Admin | Tỷ lệ điểm danh giảng viên |
| GET | `/attendance/validate-schedule/:classId` | ✅ | Teacher | Kiểm tra lịch học hợp lệ |

### Schedules (`/api/schedules`, `/api/classes/:classId/schedules`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/schedules` | ✅ | All | Danh sách lịch học lớp |
| POST | `/classes/:classId/schedules` | ✅ | Teacher | Tạo lịch học |
| POST | `/classes/:id/schedules/bulk` | ✅ | Teacher | Tạo hàng loạt lịch học |
| DELETE | `/classes/:id/schedules/bulk` | ✅ | Teacher | Xóa hàng loạt lịch học |
| PUT | `/schedules/:id` | ✅ | Teacher | Cập nhật lịch học |
| DELETE | `/schedules/:id` | ✅ | Teacher | Xóa lịch học |
| GET | `/schedules/my-schedule` | ✅ | Teacher, Student | Lịch của tôi |
| GET | `/classes/:id/remaining-lessons` | ✅ | Teacher | Số buổi học còn lại |

### Announcements (`/api/announcements`, `/api/classes/:classId/announcements`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/classes/:classId/announcements` | ✅ | All | Danh sách thông báo lớp |
| POST | `/classes/:classId/announcements` | ✅ | Teacher | Tạo thông báo |
| DELETE | `/announcements/:id` | ✅ | Teacher | Xóa thông báo |

### Notifications (`/api/notifications`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/notifications` | ✅ | All | Danh sách thông báo của tôi |
| PATCH | `/notifications/read-all` | ✅ | All | Đánh dấu tất cả đã đọc |
| PATCH | `/notifications/:id/read` | ✅ | All | Đánh dấu đã đọc |
| DELETE | `/notifications/:id` | ✅ | All | Xóa thông báo |

### Teachers (`/api/teachers`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/teachers` | ✅ | Admin, Teacher | Danh sách giảng viên |
| GET | `/teachers/:id` | ✅ | Admin | Chi tiết giảng viên |
| PUT | `/teachers/:id` | ✅ | Admin | Cập nhật giảng viên |
| GET | `/teachers/:id/classes` | ✅ | Admin, Teacher | Lớp của giảng viên |


### Academic Leave (`/api/leave`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/students/leave/request` | ✅ | Student | Gửi yêu cầu bảo lưu |
| GET | `/students/leave/my-requests` | ✅ | Student | Yêu cầu bảo lưu của tôi |
| GET | `/admin/leave-requests` | ✅ | Admin | Danh sách yêu cầu bảo lưu |
| PUT | `/admin/leave-requests/:id/approve` | ✅ | Admin | Phê duyệt bảo lưu |
| PUT | `/admin/leave-requests/:id/reject` | ✅ | Admin | Từ chối bảo lưu |

### Expulsion Management (`/api/expulsions`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/admin/expulsions` | ✅ | Admin | Tạo quyết định đuổi học |
| GET | `/admin/expulsions` | ✅ | Admin | Danh sách quyết định đuổi học |
| GET | `/admin/expulsions/:id` | ✅ | Admin | Chi tiết quyết định |
| PUT | `/admin/expulsions/:id/approve-appeal` | ✅ | Admin | Chấp nhận kháng cáo |
| PUT | `/admin/expulsions/:id/reject-appeal` | ✅ | Admin | Từ chối kháng cáo |
| GET | `/students/expulsions/me` | ✅ | Student | Quyết định đuổi học của tôi |
| PUT | `/students/expulsions/:id/appeal` | ✅ | Student | Gửi kháng cáo |

### Warning Management (`/api/warnings`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/admin/warnings` | ✅ | Admin | Danh sách cảnh cáo (tất cả) |
| GET | `/students/warnings/me` | ✅ | Student | Cảnh cáo của tôi |
| GET | `/teachers/warnings/class/:classId` | ✅ | Teacher | Cảnh cáo của lớp |

### Violation Reports (`/api/violations`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| POST | `/teachers/violations` | ✅ | Teacher | Báo cáo vi phạm |
| GET | `/admin/violations` | ✅ | Admin | Danh sách báo cáo vi phạm |
| PUT | `/admin/violations/:id/convert` | ✅ | Admin | Chuyển thành quyết định đuổi học |
| PUT | `/admin/violations/:id/dismiss` | ✅ | Admin | Bác bỏ báo cáo |

### Statistics (`/api/statistics`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/admin/statistics/expulsions` | ✅ | Admin | Thống kê đuổi học |

### Chat (`/api/chat`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/chat/conversations` | ✅ | All | Danh sách cuộc trò chuyện |
| POST | `/chat/conversations` | ✅ | All | Tạo cuộc trò chuyện mới |
| GET | `/chat/conversations/:id` | ✅ | All | Chi tiết cuộc trò chuyện |
| GET | `/chat/conversations/:id/messages` | ✅ | All | Danh sách tin nhắn |
| POST | `/chat/conversations/:id/read` | ✅ | All | Đánh dấu đã đọc |
| GET | `/chat/users/search` | ✅ | All | Tìm kiếm người dùng |
| GET | `/chat/unread-count` | ✅ | All | Số tin nhắn chưa đọc |
| GET | `/chat/online-users` | ✅ | All | Danh sách người dùng online |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Auth | Role | Mô tả |
|--------|----------|------|------|-------|
| GET | `/dashboard/admin` | ✅ | Admin | Dashboard Admin |
| GET | `/dashboard/teacher` | ✅ | Teacher | Dashboard Teacher |
| GET | `/dashboard/student` | ✅ | Student | Dashboard Student |


## Tính năng

### Bảo mật
- ✅ JWT Authentication với Access Token (15 phút) và Refresh Token (7 ngày)
- ✅ Password hashing với bcrypt (10 rounds)
- ✅ OTP verification cho forgot password (6 số, hiệu lực 10 phút)
- ✅ Role-based access control (Admin, Teacher, Student)
- ✅ Input sanitization chống XSS
- ✅ Helmet.js cho HTTP headers security
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ File upload validation (type, size)

### Quản lý người dùng
- ✅ CRUD người dùng (Admin, Teacher, Student)
- ✅ Import hàng loạt từ CSV
- ✅ Khóa/mở khóa tài khoản
- ✅ Reset mật khẩu
- ✅ Cập nhật thông tin cá nhân
- ✅ Upload avatar
- ✅ Quên mật khẩu với OTP qua email

### Quản lý lớp học
- ✅ Tạo, sửa, xóa lớp học
- ✅ Thêm/xóa sinh viên vào lớp
- ✅ Import sinh viên từ CSV
- ✅ Hiển thị trạng thái sinh viên (Đi học, Bảo lưu, Đuổi học, Đình chỉ)
- ✅ Quản lý enrollment
- ✅ Lọc và tìm kiếm sinh viên

### Quản lý bài tập
- ✅ Tạo bài tập tự luận và trắc nghiệm
- ✅ Đính kèm file tài liệu
- ✅ Xuất bản/đóng bài tập
- ✅ Nộp bài với file đính kèm
- ✅ Nộp lại bài nhiều lần
- ✅ Tự động chấm bài trắc nghiệm
- ✅ Chấm điểm thủ công với nhận xét
- ✅ Tìm kiếm và lọc bài tập
- ✅ Phân trang

### Quản lý bảng điểm
- ✅ Nhập điểm từng sinh viên
- ✅ Nhập hàng loạt
- ✅ Tự động tính điểm tổng kết
- ✅ Xuất bảng điểm ra Excel
- ✅ Sinh viên xem điểm của mình

### Quản lý điểm danh
- ✅ Tạo buổi điểm danh theo lịch học
- ✅ Điểm danh bằng QR Code
- ✅ Điểm danh bằng mã số
- ✅ Điểm danh thủ công
- ✅ Điểm danh trực tiếp (không cần mã)
- ✅ Thống kê tỷ lệ điểm danh
- ✅ Báo cáo chi tiết
- ✅ Cảnh báo sinh viên vắng nhiều
- ✅ Phân trang cho sinh viên

### Quản lý lịch học
- ✅ Tạo, sửa, xóa lịch học
- ✅ Tạo/xóa hàng loạt
- ✅ Kiểm tra trùng lặp (thứ + ngày)
- ✅ Lọc lịch theo ngày
- ✅ Xem lịch của giảng viên/sinh viên
- ✅ Tính số buổi học còn lại

### Thông báo
- ✅ Thông báo lớp học (Announcement)
- ✅ Thông báo hệ thống (Notification)
- ✅ Real-time với Socket.io
- ✅ Đánh dấu đã đọc/chưa đọc
- ✅ Tìm kiếm thông báo
- ✅ Broadcast thông báo toàn hệ thống (Admin)

### Chat & Nhắn tin
- ✅ Chat real-time giữa người dùng
- ✅ Tạo cuộc trò chuyện 1-1
- ✅ Tìm kiếm người dùng để chat
- ✅ Hiển thị trạng thái online/offline
- ✅ Đánh dấu tin nhắn đã đọc
- ✅ Hiển thị số tin nhắn chưa đọc
- ✅ Real-time với Socket.io

### Quản lý bảo lưu
- ✅ Sinh viên gửi yêu cầu bảo lưu
- ✅ Admin phê duyệt/từ chối
- ✅ Hạn chế truy cập sinh viên bảo lưu
- ✅ Tự động cập nhật trạng thái khi hết hạn

### Quản lý kỷ luật
- ✅ Cảnh cáo học tập tự động (điểm thấp)
- ✅ Cảnh cáo điểm danh tự động (vắng nhiều)
- ✅ Giảng viên báo cáo vi phạm
- ✅ Admin tạo quyết định đuổi học
- ✅ Chuyển vi phạm thành đuổi học
- ✅ Sinh viên gửi kháng cáo
- ✅ Admin xử lý kháng cáo
- ✅ Hạn chế truy cập sinh viên bị đuổi
- ✅ Thống kê kỷ luật

### Dashboard
- ✅ Dashboard riêng cho từng role
- ✅ Thống kê tổng quan
- ✅ Biểu đồ và số liệu
- ✅ Hoạt động gần đây
- ✅ Lịch học hôm nay

### UI/UX
- ✅ Giao diện hiện đại với animations
- ✅ Responsive design
- ✅ Loading spinner toàn cục
- ✅ Toast notifications
- ✅ Modal với backdrop blur
- ✅ Hover effects và transitions
- ✅ Color-coded badges
- ✅ Dark mode support
- ✅ Custom scrollbar
- ✅ Gradient backgrounds

### Tìm kiếm & Lọc
- ✅ Tìm kiếm sinh viên (tên, MSSV, email)
- ✅ Tìm kiếm bài tập (tiêu đề)
- ✅ Tìm kiếm thông báo (tiêu đề, nội dung)
- ✅ Tìm kiếm người dùng để chat
- ✅ Lọc lịch học theo ngày
- ✅ Phân trang cho tất cả danh sách

### File Management
- ✅ Upload avatar người dùng
- ✅ Upload file đính kèm bài tập
- ✅ Upload file bài nộp sinh viên
- ✅ Upload file bằng chứng vi phạm
- ✅ Upload file đính kèm quyết định đuổi học
- ✅ Import CSV sinh viên
- ✅ Export Excel bảng điểm
- ✅ Validation file type và size

### Real-time Features
- ✅ Real-time notifications với Socket.io
- ✅ Real-time chat messages
- ✅ Real-time online status
- ✅ Real-time typing indicators
- ✅ Auto-refresh dashboard data

## Cơ sở dữ liệu

### Thực thể (Entities)

#### 1. User (Người dùng)
- **Mục đích**: Lưu trữ thông tin xác thực người dùng
- **Key fields**: email, password, role, name, status
- **Indexes**: email (unique), role, studentCode, teacherCode
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 2. Student (Sinh viên)
- **Mục đích**: Lưu trữ thông tin chi tiết sinh viên
- **Key fields**: userId (ref User), studentCode, classId, gpa
- **Indexes**: userId (unique), studentCode (unique)
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 3. Teacher (Giảng viên)
- **Mục đích**: Lưu trữ thông tin chi tiết giảng viên
- **Key fields**: userId (ref User), teacherCode, department, degree
- **Indexes**: userId (unique), teacherCode (unique)
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 4. Faculty (Khoa)
- **Mục đích**: Phân loại môn học theo khoa
- **Key fields**: name, code, description
- **Indexes**: code (unique)
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 5. Subject (Môn học)
- **Mục đích**: Lưu trữ thông tin môn học
- **Key fields**: name, code, credits, facultyId
- **Indexes**: code (unique)
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 6. Class (Lớp học)
- **Mục đích**: Lớp học cụ thể của môn học
- **Key fields**: name, subjectId, teacherId, semester, year, status
- **Indexes**: teacherId, subjectId, isDeleted
- **Soft delete**: isDeleted flag
- **Validation**: scheduledLessons ≤ totalLessons
- **Timestamps**: createdAt, updatedAt

#### 7. Enrollment (Ghi danh)
- **Mục đích**: Quan hệ sinh viên - lớp học
- **Key fields**: classId, studentId, status, enrolledAt
- **Indexes**: (classId, studentId) unique, studentId, classId
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 8. AttendanceSession (Buổi điểm danh)
- **Mục đích**: Buổi điểm danh của lớp học
- **Key fields**: classId, date, code, codeExpiredAt, shift
- **Indexes**: classId, date, isDeleted
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 9. AttendanceRecord (Ghi nhận điểm danh)
- **Mục đích**: Ghi nhận điểm danh sinh viên
- **Key fields**: sessionId, studentId, status, checkInMethod, checkedAt
- **Indexes**: (sessionId, studentId) unique
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 10. AttendanceWarning (Cảnh cáo điểm danh)
- **Mục đích**: Cảnh cáo về tỷ lệ vắng học
- **Key fields**: studentId, classId, warningLevel, absenceRate
- **Indexes**: studentId, classId, warningLevel
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt

#### 11. Assignment (Bài tập)
- **Mục đích**: Bài tập/bài kiểm tra của lớp học
- **Key fields**: classId, title, deadline, type, mode, status
- **Indexes**: classId, deadline, isDeleted
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 12. Question (Câu hỏi)
- **Mục đích**: Câu hỏi cho bài tập trắc nghiệm
- **Key fields**: assignmentId, content, options, type, points
- **Indexes**: assignmentId, order
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 13. Submission (Bài nộp)
- **Mục đích**: Bài nộp của sinh viên
- **Key fields**: assignmentId, studentId, status, score, submittedAt
- **Indexes**: (assignmentId, studentId) unique
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 14. Gradebook (Bảng điểm)
- **Mục đích**: Điểm tổng kết sinh viên
- **Key fields**: classId, studentId, qt, gk, ck, total
- **Indexes**: (classId, studentId) unique
- **Soft delete**: isDeleted flag
- **Auto-calculation**: total = (qt × 0.3 + gk × 0.2 + ck × 0.5)
- **Timestamps**: createdAt, updatedAt

#### 15. Announcement (Thông báo lớp)
- **Mục đích**: Thông báo của lớp học
- **Key fields**: classId, teacherId, title, content
- **Indexes**: classId, teacherId, isDeleted
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 16. Notification (Thông báo hệ thống)
- **Mục đích**: Thông báo hệ thống
- **Key fields**: title, content, recipientId, type, priority
- **Indexes**: recipientId, isRead, createdAt
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt

#### 17. AcademicWarning (Cảnh cáo học thuật)
- **Mục đích**: Cảnh cáo về kết quả học tập
- **Key fields**: studentId, type, reason, severity, status
- **Indexes**: studentId, type, status
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt

#### 18. ViolationReport (Báo cáo vi phạm)
- **Mục đích**: Báo cáo vi phạm kỷ luật
- **Key fields**: studentId, reporterId, type, severity, status
- **Indexes**: studentId, reporterId, status
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt

#### 19. ExpulsionRecord (Quyết định đuổi học)
- **Mục đích**: Quyết định đuổi học sinh viên
- **Key fields**: studentId, classId, reason, type, status
- **Indexes**: studentId, status, effectiveDate
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt

#### 20. AcademicLeave (Nghỉ học)
- **Mục đích**: Xin nghỉ học tạm thời
- **Key fields**: studentId, type, startDate, endDate, status
- **Indexes**: studentId, status, startDate
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 21. Conversation (Cuộc trò chuyện)
- **Mục đích**: Cuộc trò chuyện chat
- **Key fields**: participants, type, classId, lastMessage
- **Indexes**: participants, type, isActive
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

#### 22. Message (Tin nhắn)
- **Mục đích**: Tin nhắn trong cuộc trò chuyện
- **Key fields**: conversationId, senderId, content, type
- **Indexes**: conversationId, senderId, createdAt
- **Soft delete**: isDeleted flag
- **Timestamps**: createdAt, updatedAt

### Quan hệ thực thể

#### Core Relationships:
1. **User ↔ Student**: 1-1 (userId)
2. **User ↔ Teacher**: 1-1 (userId)
3. **Faculty → Subject**: 1-N (facultyId)
4. **Subject → Class**: 1-N (subjectId)
5. **User (Teacher) → Class**: 1-N (teacherId)
6. **User (Student) ↔ Class**: N-M (qua Enrollment)
7. **Class → AttendanceSession**: 1-N (classId)
8. **AttendanceSession → AttendanceRecord**: 1-N (sessionId)
9. **User (Student) → AttendanceRecord**: 1-N (studentId)
10. **Class → Assignment**: 1-N (classId)
11. **Assignment → Question**: 1-N (assignmentId)
12. **Assignment → Submission**: 1-N (assignmentId)
13. **User (Student) → Submission**: 1-N (studentId)
14. **Class → Gradebook**: 1-N (classId)
15. **User (Student) → Gradebook**: 1-N (studentId)
16. **Class → Announcement**: 1-N (classId)
17. **User → Notification**: 1-N (recipientId/senderId)
18. **User (Student) → AcademicWarning**: 1-N (studentId)
19. **User (Student) → ViolationReport**: 1-N (studentId)
20. **User (Student) → ExpulsionRecord**: 1-N (studentId)
21. **User (Student) → AcademicLeave**: 1-N (studentId)
22. **Conversation → Message**: 1-N (conversationId)
23. **User → Message**: 1-N (senderId)
24. **Class → Conversation**: 1-N (classId, cho chat lớp)

#### Business Rules:
- **Soft Delete**: Tất cả các thực thể đều dùng soft delete (isDeleted)
- **Timestamps**: Tất cả đều có createdAt, updatedAt
- **Unique Constraints**: Đảm bảo tính toàn vẹn dữ liệu
- **Indexing**: Tối ưu performance cho các query thường dùng
- **Referential Integrity**: Dùng ObjectId references để đảm bảo liên kết

### Mối quan hệ giữa Collections

#### User Relationships
- User → Student (1:1) - Thông tin sinh viên
- User → Teacher (1:1) - Thông tin giảng viên
- Student → Faculty (N:1) - Sinh viên thuộc khoa
- Teacher → Faculty (N:1) - Giảng viên thuộc khoa

#### Academic Structure
- Subject → Faculty (N:1) - Môn học thuộc khoa
- AcademicYear → Semesters (1:N) - Năm học có nhiều học kỳ
- Semester → Classes (1:N) - Học kỳ có nhiều lớp
- Class → Subject (N:1) - Lớp học thuộc môn học
- Class → Teacher (N:1) - Lớp học có giảng viên phụ trách

#### Enrollment & Learning
- Class → Enrollments (1:N) - Lớp có nhiều sinh viên đăng ký
- Student → Enrollments (1:N) - Sinh viên đăng ký nhiều lớp
- Class → Assignments (1:N) - Lớp có nhiều bài tập
- Assignment → Submissions (1:N) - Bài tập có nhiều bài nộp
- Assignment → Questions (1:N) - Bài tập có nhiều câu hỏi (trắc nghiệm)
- Class → Gradebook (1:N) - Lớp có bảng điểm cho từng sinh viên
- Class → Schedules (1:N) - Lớp có nhiều lịch học
- Class → Announcements (1:N) - Lớp có nhiều thông báo

#### Attendance System
- Class → AttendanceSessions (1:N) - Lớp có nhiều buổi điểm danh
- AttendanceSession → AttendanceRecords (1:N) - Buổi điểm danh có nhiều bản ghi

#### Communication
- User → Notifications (1:N) - Người dùng nhận nhiều thông báo
- Conversations → Messages (1:N) - Cuộc trò chuyện có nhiều tin nhắn
- Conversations → Users (N:M) - Cuộc trò chuyện có nhiều người tham gia

#### Discipline System
- Student → AcademicWarnings (1:N) - Sinh viên có nhiều cảnh cáo học tập
- Student → AttendanceWarnings (1:N) - Sinh viên có nhiều cảnh cáo điểm danh
- Student → ViolationReports (1:N) - Sinh viên có nhiều báo cáo vi phạm
- Student → ExpulsionRecords (1:N) - Sinh viên có thể có quyết định đuổi học
- Student → AcademicLeave (1:N) - Sinh viên có thể có yêu cầu bảo lưu

## Quy trình nghiệp vụ chi tiết

### 1. Quy trình Đăng ký & Quản lý Lớp học

#### Bước 1: Admin tạo cấu trúc học tập
1. **Tạo Khoa**: Admin tạo các khoa với thông tin cơ bản
2. **Tạo Môn học**: Admin tạo môn học thuộc các khoa
3. **Tạo Năm học**: Admin tạo năm học (2024-2025)
4. **Tạo Học kỳ**: Admin tạo học kỳ trong năm học (HK1, HK2, HK3)

#### Bước 2: Admin tạo Lớp học
1. **Chọn học kỳ** đang hoạt động
2. **Nhập thông tin lớp**: tên, mã lớp, môn học, giảng viên
3. **Thiết lập giới hạn** số lượng sinh viên
4. **Trạng thái lớp** mặc định là "active"

#### Bước 3: Admin thêm sinh viên vào lớp
1. **Thêm thủ công**: chọn từng sinh viên
2. **Import CSV**: upload file danh sách sinh viên
3. **Xác nhận đăng ký**: hệ thống tạo enrollment records

### 2. Quy trình Quản lý Bài tập & Nộp bài

#### Teacher tạo bài tập
1. **Chọn lớp học** và nhập thông tin bài tập
2. **Loại bài tập**: essay hoặc multiple_choice
3. **Đính kèm tài liệu** (PDF, DOCX, PPT)
4. **Thiết lập hạn nộp** và điểm tối đa
5. **Trạng thái**: draft → published → closed

#### Sinh viên nộp bài
1. **Xem danh sách bài tập** trong lớp
2. **Tải tài liệu** và làm bài
3. **Nộp bài** trước hạn với file đính kèm
4. **Nộp lại** nếu cần (ghi nhận lần nộp cuối)

#### Teacher chấm điểm
1. **Xem danh sách bài nộp**
2. **Tự động chấm** bài trắc nghiệm
3. **Chấm thủ công** bài essay với điểm và nhận xét
4. **Sinh viên nhận thông báo** khi bài được chấm

### 3. Quy trình Điểm danh

#### Teacher tạo buổi điểm danh
1. **Kiểm tra lịch học** hợp lệ (không trùng)
2. **Tạo buổi điểm danh** với thông tin: ngày, tiết, phòng
3. **Chọn phương thức**: QR Code, mã số, thủ công, trực tiếp

#### Sinh viên điểm danh
1. **QR Code**: quét mã từ teacher
2. **Mã số**: nhập 6 số từ teacher
3. **Trực tiếp**: điểm danh dựa vào lịch học
4. **Thủ công**: teacher điểm danh trực tiếp

#### Hệ thống xử lý
1. **Ghi nhận thời gian** điểm danh
2. **Cập nhật trạng thái**: present, absent, late, excused
3. **Tính tỷ lệ điểm danh** tự động
4. **Tạo cảnh cáo** nếu vắng >20%

### 4. Quy trình Quản lý Bảng điểm

#### Teacher nhập điểm
1. **Nhập điểm từng sinh viên** hoặc hàng loạt
2. **Các cột điểm**: Chuyên cần (10%), Giữa kỳ (30%), Cuối kỳ (60%)
3. **Tự động tính** điểm tổng kết
4. **Khóa điểm** sau khi hoàn thành

#### Xuất báo cáo
1. **Xuất Excel** bảng điểm chi tiết
2. **Bao gồm**: MSSV, Họ tên, các cột điểm, tổng kết
3. **Sinh viên xem điểm** của mình trong từng lớp

### 5. Quy trình Kỷ luật & Đuổi học

#### Tự động cảnh cáo
1. **Cảnh cáo học tập**: điểm tổng kết <4.0 (low), <2.0 (critical)
2. **Cảnh cáo điểm danh**: vắng >20% (medium), >30% (high)
3. **Ghi nhận vào hồ sơ** sinh viên

#### Teacher báo cáo vi phạm
1. **Tạo báo cáo** với loại vi phạm và mức độ
2. **Đính kèm bằng chứng** (tối đa 5 file)
3. **Admin xem xét** báo cáo

#### Quyết định đuổi học
1. **Admin tạo quyết định** với lý do và ngày hiệu lực
2. **Hạn chế truy cập** sinh viên bị đuổi
3. **Sinh viên gửi kháng cáo** nếu cần
4. **Admin xử lý kháng cáo**: chấp nhận hoặc từ chối

### 6. Quy trình Bảo lưu

#### Sinh viên gửi yêu cầu
1. **Điền đơn** với lý do và thời gian bảo lưu
2. **Admin xem xét** yêu cầu
3. **Phê duyệt/Từ chối** với lý do

#### Hạn chế truy cập
1. **Sinh viên bảo lưu** không thể:
   - Xem chi tiết lớp học
   - Nộp bài tập
   - Điểm danh
   - Xem bảng điểm chi tiết
2. **Vẫn có thể**: đăng nhập, xem danh sách lớp, xem trạng thái bảo lưu

#### Kết thúc bảo lưu
1. **Tự động cập nhật** khi hết hạn
2. **Admin có thể** kết thúc sớm
3. **Khôi phục quyền truy cập** sinh viên

### 7. Quy trình Thông báo & Chat

#### Thông báo hệ thống
1. **Tự động tạo** khi có sự kiện:
   - Bài tập mới
   - Điểm mới
   - Bài nộp được chấm
   - Cảnh cáo
   - Quyết định kỷ luật
2. **Real-time** qua Socket.io
3. **Đánh dấu đã đọc/chưa đọc**

#### Chat real-time
1. **Tìm kiếm người dùng** để chat
2. **Tạo cuộc trò chuyện** 1-1
3. **Real-time messages** với typing indicators
4. **Online status** và unread count

## Security & Performance

### Authentication & Authorization
- **JWT Access Token**: 15 phút expiry
- **JWT Refresh Token**: 7 ngày expiry
- **Role-based Access Control**: Admin, Teacher, Student
- **Middleware Protection**: protect, authorize, checkExpelledStatus
- **Password Security**: bcrypt hashing (10 rounds)

### Input Validation & Sanitization
- **Joi Validation**: Schema validation cho tất cả inputs
- **XSS Protection**: xss library sanitize HTML content
- **File Upload Validation**: Type và size limits
- **SQL Injection Prevention**: Mongoose ODM protection

### Rate Limiting
- **Global Rate Limit**: 100 requests/15 phút (production)
- **Login Rate Limit**: 20 requests/15 phút
- **Development Mode**: 1000 requests/15 phút

### Security Headers
- **Helmet.js**: HTTP headers security
- **CORS Configuration**: Cross-origin resource sharing
- **Content Security Policy**: Prevent XSS attacks

### Performance Optimization
- **Database Indexing**: Tối ưu query performance
- **Pagination**: Giảm load cho large datasets
- **File Compression**: Optimize file uploads
- **Caching Strategy**: Redis cho session management
- **Lazy Loading**: Components và data

### Error Handling
- **Global Error Handler**: Centralized error processing
- **Custom Error Classes**: Specific error types
- **Error Logging**: Track và monitor errors
- **User-friendly Messages**: Clear error communication

## Testing & Deployment

### Testing Strategy
- **Unit Tests**: Jest cho individual functions
- **Integration Tests**: API endpoint testing
- **Property-based Testing**: Fast-check for edge cases
- **Test Coverage**: Monitor code coverage

### Environment Configuration
- **Development**: Local MongoDB, hot reload
- **Production**: MongoDB Atlas, optimized build
- **Environment Variables**: Secure configuration
- **Docker Support**: Containerized deployment

### Monitoring & Logging
- **Application Logs**: Track user activities
- **Error Monitoring**: Real-time error tracking
- **Performance Metrics**: Monitor response times
- **Database Queries**: Optimize slow queries

---

## Tổng kết

Hệ thống Quản Lý Lớp Học này là một giải pháp toàn diện cho việc quản lý giáo dục, được xây dựng với kiến trúc MERN Stack hiện đại và các best practices về security, performance, và scalability.

### Điểm nổi bật:
- **Phân quyền chi tiết** với 3 vai trò (Admin, Teacher, Student)
- **Quy trình nghiệp vụ hoàn chỉnh** từ quản lý lớp học đến kỷ luật sinh viên
- **Real-time features** với Socket.io cho notifications và chat
- **Security多层次** với JWT, rate limiting, input validation
- **Responsive UI/UX** với modern design và animations
- **Comprehensive API** với 100+ endpoints
- **Database structure** được thiết kế tối ưu với relationships rõ ràng
- **Business logic** tự động hóa cho cảnh cáo và kỷ luật
- **File management** với upload/download và validation
- **Testing & monitoring** cho production readiness

### Công nghệ sử dụng:
- **Backend**: Node.js, Express.js, MongoDB, Socket.io
- **Frontend**: React.js, CSS3, Axios
- **Security**: JWT, bcrypt, Helmet, CORS, Rate Limiting
- **Testing**: Jest, Fast-check
- **File Processing**: Multer, ExcelJS
- **Real-time**: Socket.io, Redis

Hệ thống đã sẵn sàng cho deployment và có thể mở rộng để phục vụ các trường học với quy mô lớn.

## License

MIT License - Đồ án tốt nghiệp

---

**Phát triển bởi**: [Tên của bạn]  
**Năm**: 2024-2025  
**Công nghệ**: MERN Stack (MongoDB, Express, React, Node.js)
