# Hệ thống Quản Lý Lớp Học (MERN Stack)

Đồ án tốt nghiệp - Stack: ReactJS + Node.js (Express) + MongoDB + JWT

## Mục lục
- [Tổng quan](#tổng-quan)
- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Phân quyền](#phân-quyền)
- [Cài đặt](#cài-đặt)
- [Tài khoản mặc định](#tài-khoản-mặc-định)
- [Nghiệp vụ hệ thống](#nghiệp-vụ-hệ-thống)
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

### 1. Quản lý Xác thực & Tài khoản (Authentication & User Management)

#### Đăng nhập & Bảo mật
- Đăng nhập bằng email và mật khẩu
- JWT token với access token (15 phút) và refresh token (7 ngày)
- Tự động refresh token khi access token hết hạn
- Logout xóa refresh token khỏi database

#### Quên mật khẩu
1. Người dùng nhập email
2. Hệ thống gửi mã OTP (6 số) qua email
3. OTP có hiệu lực 10 phút
4. Xác thực OTP và đặt lại mật khẩu mới

#### Quản lý tài khoản
- Admin tạo tài khoản cho Teacher và Student
- Admin import hàng loạt từ file CSV
- Admin khóa/mở khóa tài khoản
- Admin reset mật khẩu người dùng
- Teacher/Admin có thể reset mật khẩu sinh viên
- Người dùng tự đổi mật khẩu
- Người dùng cập nhật thông tin cá nhân và avatar

### 2. Quản lý Khoa & Môn học (Faculties & Subjects)

#### Khoa (Faculty)
- Admin tạo, sửa, xóa khoa
- Mỗi khoa có: tên, mã khoa, mô tả
- Giảng viên và sinh viên thuộc về một khoa

#### Môn học (Subject)
- Admin tạo, sửa, xóa môn học
- Mỗi môn học có: tên, mã môn, số tín chỉ, khoa phụ trách
- Môn học được gán vào lớp học

### 3. Quản lý Năm học & Học kỳ (Academic Years & Semesters)

#### Năm học
- Admin tạo năm học (VD: 2024-2025)
- Mỗi năm học có ngày bắt đầu và kết thúc
- Đánh dấu năm học hiện tại

#### Học kỳ
- Admin tạo học kỳ thuộc năm học (HK1, HK2, HK3)
- Mỗi học kỳ có ngày bắt đầu và kết thúc
- Lớp học được tạo trong học kỳ cụ thể

### 4. Quản lý Lớp học (Class Management)

#### Tạo & Cấu hình lớp
- Admin tạo lớp học với: tên, mã lớp, môn học, giảng viên, học kỳ
- Trạng thái lớp: active, completed, cancelled
- Giới hạn số lượng sinh viên tối đa

#### Quản lý sinh viên trong lớp
- Admin thêm sinh viên vào lớp (thủ công hoặc import CSV)
- Admin xóa sinh viên khỏi lớp
- Hiển thị danh sách sinh viên với trạng thái: Đi học, Bảo lưu, Đuổi học, Đình chỉ
- Sinh viên bị đuổi học hoặc bảo lưu bị hạn chế truy cập

#### Xem lớp học
- Teacher xem danh sách lớp mình phụ trách
- Student xem danh sách lớp đã đăng ký
- Hiển thị thông tin chi tiết lớp: sinh viên, bài tập, bảng điểm, điểm danh, lịch học, thông báo


### 5. Quản lý Bài tập (Assignment Management)

#### Tạo bài tập
- Teacher tạo bài tập cho lớp với: tiêu đề, mô tả, hạn nộp, điểm tối đa
- Loại bài tập: essay (tự luận), multiple_choice (trắc nghiệm)
- Đính kèm file tài liệu (PDF, DOCX, PPT, v.v.)
- Trạng thái: draft (nháp), published (đã xuất bản), closed (đã đóng)

#### Bài tập trắc nghiệm
- Teacher tạo câu hỏi với 4 đáp án (A, B, C, D)
- Đánh dấu đáp án đúng
- Hệ thống tự động chấm điểm khi sinh viên nộp

#### Nộp bài
- Student nộp bài trước hạn (có thể nộp lại nhiều lần)
- Đính kèm file bài làm
- Trả lời câu hỏi trắc nghiệm
- Trạng thái: submitted (đã nộp), graded (đã chấm), late (nộp muộn)

#### Chấm điểm
- Teacher xem danh sách bài nộp
- Tự động chấm bài trắc nghiệm
- Thủ công chấm bài tự luận với điểm và nhận xét
- Sinh viên nhận thông báo khi bài được chấm

### 6. Quản lý Bảng điểm (Gradebook Management)

#### Cấu trúc điểm
- Mỗi sinh viên trong lớp có bảng điểm riêng
- Các cột điểm: Chuyên cần, Giữa kỳ, Cuối kỳ, Điểm tổng kết
- Công thức: `Tổng kết = (Chuyên cần * 0.1) + (Giữa kỳ * 0.3) + (Cuối kỳ * 0.6)`

#### Nhập điểm
- Teacher nhập điểm từng sinh viên
- Teacher nhập hàng loạt (bulk update)
- Điểm từ 0-10, làm tròn 2 chữ số thập phân

#### Xuất bảng điểm
- Teacher xuất bảng điểm ra file Excel
- Bao gồm: MSSV, Họ tên, Email, các cột điểm, điểm tổng kết

#### Xem điểm
- Student xem điểm của mình trong từng lớp
- Student xem tổng hợp điểm tất cả các lớp

### 7. Quản lý Điểm danh (Attendance Management)

#### Tạo buổi điểm danh
- Teacher tạo buổi điểm danh cho lớp theo lịch học
- Chọn ngày, tiết học, phòng học
- Hệ thống kiểm tra trùng lặp lịch học

#### Phương thức điểm danh
1. **Mã QR Code**: Teacher tạo mã QR, sinh viên quét mã để điểm danh
2. **Mã số**: Teacher tạo mã 6 số, sinh viên nhập mã để điểm danh
3. **Thủ công**: Teacher điểm danh trực tiếp cho từng sinh viên
4. **Điểm danh trực tiếp**: Sinh viên tự điểm danh không cần mã (dựa vào lịch học)

#### Trạng thái điểm danh
- **present**: Có mặt
- **absent**: Vắng mặt
- **late**: Đi muộn
- **excused**: Vắng có phép

#### Thống kê điểm danh
- Tỷ lệ điểm danh của từng sinh viên trong lớp
- Tỷ lệ điểm danh trung bình của lớp
- Báo cáo chi tiết theo buổi học
- Cảnh báo sinh viên vắng nhiều (>20% số buổi)


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

### 9. Quản lý Thông báo (Notification & Announcement)

#### Thông báo lớp (Announcement)
- Teacher tạo thông báo cho lớp
- Nội dung: Tiêu đề, nội dung chi tiết
- Tất cả sinh viên trong lớp nhận thông báo
- Teacher xóa thông báo

#### Thông báo hệ thống (Notification)
- Tự động gửi khi có sự kiện: bài tập mới, điểm mới, bài nộp được chấm, v.v.
- Real-time qua Socket.io
- Đánh dấu đã đọc/chưa đọc
- Đánh dấu tất cả là đã đọc
- Xóa thông báo

### 10. Quản lý Bảo lưu (Academic Leave Management)

#### Yêu cầu bảo lưu
- Student gửi yêu cầu bảo lưu với: lý do, ngày bắt đầu, ngày kết thúc
- Trạng thái: pending (chờ duyệt), approved (đã duyệt), rejected (từ chối)

#### Duyệt bảo lưu
- Admin xem danh sách yêu cầu bảo lưu
- Admin phê duyệt hoặc từ chối với lý do
- Khi được duyệt, trạng thái sinh viên chuyển sang "on_leave"

#### Hạn chế truy cập
- Sinh viên bảo lưu không thể:
  - Xem chi tiết lớp học
  - Nộp bài tập
  - Điểm danh
  - Xem bảng điểm chi tiết
- Sinh viên bảo lưu vẫn có thể:
  - Đăng nhập
  - Xem danh sách lớp (nhưng không vào được)
  - Xem trạng thái bảo lưu của mình

#### Kết thúc bảo lưu
- Hệ thống tự động cập nhật trạng thái khi hết thời gian bảo lưu
- Admin có thể kết thúc bảo lưu sớm


### 11. Quản lý Kỷ luật & Đuổi học (Expulsion & Discipline Management)

#### Cảnh cáo học tập (Academic Warning)
- Hệ thống tự động tạo cảnh cáo khi:
  - Điểm tổng kết < 4.0: Cảnh cáo học tập
  - Điểm tổng kết < 2.0: Cảnh cáo học vụ nghiêm trọng
- Mức độ: low (thấp), medium (trung bình), high (cao), critical (nghiêm trọng)
- Ghi nhận vào hồ sơ sinh viên

#### Cảnh cáo điểm danh (Attendance Warning)
- Hệ thống tự động tạo cảnh cáo khi:
  - Vắng > 20% số buổi: Cảnh cáo chuyên cần
  - Vắng > 30% số buổi: Cảnh cáo nghiêm trọng
- Mức độ tương tự cảnh cáo học tập

#### Báo cáo vi phạm (Violation Report)
- Teacher báo cáo vi phạm của sinh viên với:
  - Loại vi phạm: academic_dishonesty (gian lận), misconduct (hành vi sai trái), attendance_violation (vi phạm điểm danh), other (khác)
  - Mức độ nghiêm trọng: low, medium, high, critical
  - Mô tả chi tiết
  - Bằng chứng (file đính kèm, tối đa 5 file)
- Trạng thái: pending (chờ xử lý), under_review (đang xem xét), converted_to_expulsion (chuyển thành đuổi học), dismissed (bác bỏ)

#### Quyết định đuổi học (Expulsion)
- Admin tạo quyết định đuổi học với:
  - Sinh viên bị đuổi
  - Lý do đuổi học
  - Ngày có hiệu lực
  - Tài liệu đính kèm (quyết định chính thức)
- Hoặc Admin chuyển báo cáo vi phạm thành quyết định đuổi học
- Trạng thái: active (đang hiệu lực), appealed (đang kháng cáo), appeal_approved (kháng cáo được chấp nhận), appeal_rejected (kháng cáo bị từ chối)

#### Hạn chế truy cập sinh viên bị đuổi
- Sinh viên bị đuổi học không thể:
  - Xem dashboard
  - Xem danh sách lớp
  - Truy cập bất kỳ chức năng học tập nào
- Sinh viên bị đuổi học chỉ có thể:
  - Đăng nhập
  - Xem quyết định đuổi học
  - Gửi kháng cáo

#### Kháng cáo (Appeal)
- Sinh viên bị đuổi có thể gửi kháng cáo với:
  - Lý do kháng cáo
  - Bằng chứng hỗ trợ (file đính kèm)
- Admin xem xét kháng cáo:
  - Chấp nhận: Hủy quyết định đuổi học, khôi phục quyền truy cập
  - Từ chối: Giữ nguyên quyết định với lý do từ chối

#### Thống kê kỷ luật
- Admin xem thống kê:
  - Tổng số sinh viên bị đuổi học
  - Số lượng theo lý do
  - Số lượng kháng cáo (chờ xử lý, chấp nhận, từ chối)
  - Xu hướng theo thời gian


### 12. Dashboard & Thống kê

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
| POST | `/auth/login` | ❌ | All | Đăng nhập |
| POST | `/auth/logout` | ❌ | All | Đăng xuất |
| POST | `/auth/refresh-token` | ❌ | All | Làm mới access token |
| POST | `/auth/forgot-password` | ❌ | All | Gửi OTP qua email |
| POST | `/auth/verify-otp` | ❌ | All | Xác thực OTP |
| POST | `/auth/reset-password` | ❌ | All | Đặt lại mật khẩu |
| GET | `/auth/me` | ✅ | All | Lấy thông tin người dùng hiện tại |
| PUT | `/auth/me` | ✅ | All | Cập nhật thông tin cá nhân |
| PUT | `/auth/change-password` | ✅ | All | Đổi mật khẩu |
| PUT | `/auth/me/avatar` | ✅ | All | Upload avatar |

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

## Cấu trúc Database

### Collections chính

#### Users
- Thông tin người dùng: email, password, role, status
- Liên kết với Student/Teacher collection
- Trạng thái: active, on_leave, dismissed, suspended

#### Students
- Thông tin sinh viên: studentCode, faculty, enrollmentYear
- Liên kết với User

#### Teachers
- Thông tin giảng viên: teacherCode, faculty, specialization
- Liên kết với User

#### Faculties
- Khoa: name, code, description

#### Subjects
- Môn học: name, code, credits, faculty

#### AcademicYears
- Năm học: name, startDate, endDate, isCurrent

#### Semesters
- Học kỳ: name, academicYear, startDate, endDate

#### Classes
- Lớp học: name, code, subject, teacher, semester, status
- Giới hạn số lượng sinh viên
- Trạng thái: active, completed, cancelled

#### Enrollments
- Đăng ký lớp học: student, class, status
- Trạng thái: enrolled, on_leave, dismissed, suspended

#### Assignments
- Bài tập: title, description, class, dueDate, maxScore, type
- Loại: essay, multiple_choice
- Trạng thái: draft, published, closed

#### Questions
- Câu hỏi trắc nghiệm: assignment, question, options, correctAnswer

#### Submissions
- Bài nộp: assignment, student, content, score, feedback
- File đính kèm, thời gian nộp

#### Gradebooks
- Bảng điểm: student, class, attendance, midterm, final, total

#### AttendanceSessions
- Buổi điểm danh: class, date, room, code, qrCode

#### AttendanceRecords
- Bản ghi điểm danh: session, student, status, checkInTime

#### Schedules
- Lịch học: class, dayOfWeek, startDate, startTime, endTime, room

#### Announcements
- Thông báo lớp: class, title, content, teacher

#### Notifications
- Thông báo hệ thống: user, title, content, type, isRead

#### AcademicLeave
- Yêu cầu bảo lưu: student, reason, startDate, endDate, status

#### AcademicWarnings
- Cảnh cáo học tập: student, class, type, level, reason

#### AttendanceWarnings
- Cảnh cáo điểm danh: student, class, level, absenceRate

#### ViolationReports
- Báo cáo vi phạm: student, teacher, type, severity, description
- File bằng chứng, trạng thái xử lý

#### ExpulsionRecords
- Quyết định đuổi học: student, reason, effectiveDate, status
- File đính kèm, thông tin kháng cáo

#### Otp
- Mã OTP: email, code, expiresAt, isUsed

#### Conversations
- Cuộc trò chuyện: participants, lastMessage, createdAt

#### Messages
- Tin nhắn: conversation, sender, content, readAt

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
