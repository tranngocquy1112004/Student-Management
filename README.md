# Hệ thống Quản Lý Lớp Học (MERN)

Đồ án tốt nghiệp - Stack: ReactJS + Node.js (Express) + MongoDB + JWT

## Phân quyền 3 Role

| Role   | Mô tả                                           |
|--------|--------------------------------------------------|
| Admin  | Quản trị toàn hệ thống, tạo tài khoản, phân công |
| Teacher| Quản lý lớp, bài tập, điểm số của lớp mình       |
| Student| Xem thông tin, nộp bài, theo dõi kết quả học tập |

## Cài đặt

### MongoDB
Đảm bảo MongoDB chạy trên `localhost:27017`.

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run seed    # Tạo dữ liệu mẫu
npm run dev
```

### Frontend
```bash
cd frontend
npm install
# .env: REACT_APP_API_URL=http://localhost:5000/api
npm start
```

## Tài khoản mặc định

| Role   | Email             | Mật khẩu |
|--------|-------------------|----------|
| Admin  | admin@school.vn   | 123456   |
| Teacher| giangvien@school.vn| 123456  |
| Student| sinhvien@school.vn| 123456   |

## API

- **Auth**: `/api/auth/login`, `/auth/refresh-token`, `/auth/me`, `/auth/change-password`, `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`
- **Admin**: `/api/admin/users`, `/admin/users/import-csv`
- **Faculties**: `/api/faculties`
- **Subjects**: `/api/subjects`
- **Classes**: `/api/classes`, `/classes/:id`, `/classes/:id/students`, `/classes/my-classes`
- **Assignments**: `/api/classes/:classId/assignments`, `/assignments/:id`, submit, grade
- **Gradebook**: `/api/classes/:classId/gradebook`, export Excel
- **Attendance**: sessions, check-in, report
- **Schedules**: `/api/classes/:classId/schedules`, `/schedules/my-schedule`
- **Notifications**: `/api/notifications`
- **Dashboard**: `/api/dashboard/admin`, `/dashboard/teacher`, `/dashboard/student`

## Tính năng đã triển khai

- Auth (JWT, refresh token, forgot password OTP)
- Admin: CRUD users, import CSV, faculties, subjects, classes
- Classes: enrollment, assignments, gradebook, attendance, schedules, announcements
- Dashboard cho từng role
- Bảo mật: bcrypt, Helmet, CORS, rate limit
