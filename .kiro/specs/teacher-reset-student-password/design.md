# Design Document: Teacher Reset Student Password

## Overview

Tính năng này cho phép giáo viên và admin đặt lại mật khẩu cho sinh viên trong hệ thống quản lý sinh viên. Hệ thống đảm bảo:

- Chỉ giáo viên và admin có quyền đặt lại mật khẩu
- Giáo viên chỉ có thể đặt lại mật khẩu cho sinh viên trong lớp của mình
- Admin có thể đặt lại mật khẩu cho bất kỳ sinh viên nào
- Mật khẩu mới được hash bằng bcrypt trước khi lưu vào database
- Sinh viên nhận email thông báo chứa mật khẩu mới
- Tất cả các thao tác được ghi log để audit

Tính năng này tích hợp vào trang ClassDetail hiện có, thêm nút "Đặt lại MK" cho mỗi sinh viên trong danh sách.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ClassDetail Component                                  │ │
│  │  ├─ Student List Table                                  │ │
│  │  │  └─ "Đặt lại MK" Button (per student)              │ │
│  │  └─ ResetPasswordModal Component (new)                 │ │
│  │     ├─ Password Input Field                            │ │
│  │     ├─ Validation Display                              │ │
│  │     └─ Submit/Cancel Buttons                           │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP POST /api/users/:userId/reset-password
                            │ Authorization: Bearer <JWT>
                            │ Body: { newPassword: string }
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js + Express)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                       │ │
│  │  ├─ protect (JWT verification)                         │ │
│  │  └─ authorize(['teacher', 'admin'])                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  userController.resetStudentPassword                    │ │
│  │  ├─ Validate password (min 6 chars)                    │ │
│  │  ├─ Check authorization (class membership for teacher) │ │
│  │  ├─ Hash password with bcrypt                          │ │
│  │  ├─ Update User in MongoDB                             │ │
│  │  ├─ Send email notification                            │ │
│  │  └─ Log audit trail                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                            │                                 │
│                            ↓                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  External Services                                      │ │
│  │  ├─ MongoDB (User collection)                          │ │
│  │  ├─ Nodemailer (Email service)                         │ │
│  │  └─ Console Logger (Audit logs)                        │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

1. **User Action**: Teacher clicks "Đặt lại MK" button for a student
2. **Modal Display**: ResetPasswordModal opens with password input
3. **Form Submission**: Teacher enters new password and submits
4. **Client Validation**: Frontend validates password length (≥6 chars)
5. **API Request**: POST to `/api/users/:userId/reset-password` with JWT token
6. **Authentication**: Middleware verifies JWT token
7. **Authorization**: Middleware checks user role (teacher/admin)
8. **Class Membership Check**: For teachers, verify student is in their class
9. **Password Validation**: Backend validates password requirements
10. **Password Hashing**: Hash password with bcrypt (salt rounds: 12)
11. **Database Update**: Save hashed password to User document
12. **Email Notification**: Send email to student with new password
13. **Audit Logging**: Log reset action with teacher ID, student ID, timestamp
14. **Response**: Return success/error to frontend
15. **UI Feedback**: Display success message and close modal, or show error

## Components and Interfaces

### Backend Components

#### 1. API Route
**File**: `backend/src/routes/userRoutes.js`

```javascript
// Add new route
router.post('/:id/reset-password', 
  protect, 
  authorize('teacher', 'admin'), 
  resetStudentPassword
);
```

#### 2. Controller Function
**File**: `backend/src/controllers/userController.js`

```javascript
export const resetStudentPassword = async (req, res) => {
  try {
    const { id: studentId } = req.params;
    const { newPassword } = req.body;
    const requestingUser = req.user;

    // Validation
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu phải có ít nhất 6 ký tự'
      });
    }

    // Find student
    const student = await User.findById(studentId);
    if (!student || student.isDeleted || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Authorization check for teachers
    if (requestingUser.role === 'teacher') {
      const enrollment = await Enrollment.findOne({
        studentId: studentId
      }).populate('classId');

      const hasAccess = enrollment && 
        enrollment.classId.teacherId.toString() === requestingUser._id.toString();

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền đặt lại mật khẩu cho sinh viên này'
        });
      }
    }

    // Update password (will be hashed by pre-save hook)
    student.password = newPassword;
    await student.save();

    // Send email notification
    try {
      await sendPasswordResetEmail({
        email: student.email,
        name: student.name,
        newPassword: newPassword
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Continue even if email fails
    }

    // Audit log
    console.log(`[AUDIT] Password reset - Teacher: ${requestingUser._id}, Student: ${studentId}, Time: ${new Date().toISOString()}`);

    res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi đặt lại mật khẩu'
    });
  }
};
```

#### 3. Email Service Function
**File**: `backend/src/services/emailService.js`

```javascript
export const sendPasswordResetEmail = async ({ email, name, newPassword }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const subject = 'Thông báo đặt lại mật khẩu';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2196f3; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">
          🔐 Thông Báo Đặt Lại Mật Khẩu
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${name}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Giảng viên đã đặt lại mật khẩu cho tài khoản của bạn.
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #666;">Mật khẩu mới của bạn:</p>
          <p style="font-size: 24px; font-weight: bold; color: #2196f3; margin: 10px 0; font-family: monospace;">
            ${newPassword}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Vui lòng đăng nhập bằng mật khẩu mới và đổi mật khẩu ngay sau khi đăng nhập để bảo mật tài khoản.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Password reset email sent to ${email}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};
```

### Frontend Components

#### 1. ResetPasswordModal Component
**File**: `frontend/src/components/ResetPasswordModal.js` (new file)

```javascript
import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ResetPasswordModal = ({ student, onClose, onSuccess }) => {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/users/${student._id}/reset-password`, {
        newPassword
      });
      
      toast.success(`Đã đặt lại mật khẩu cho ${student.name}`);
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi đặt lại mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h3>Đặt lại mật khẩu</h3>
        <p>Sinh viên: <strong>{student.name}</strong> ({student.email})</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label>Mật khẩu mới:</label>
            <input
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              required
              autoFocus
            />
            <small style={{ color: '#666', display: 'block', marginTop: 4 }}>
              Mật khẩu phải có ít nhất 6 ký tự
            </small>
          </div>
          
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
```

#### 2. ClassDetail Component Updates
**File**: `frontend/src/pages/ClassDetail.js`

Thêm import:
```javascript
import ResetPasswordModal from '../components/ResetPasswordModal';
```

Thêm state:
```javascript
const [resetPasswordStudent, setResetPasswordStudent] = useState(null);
```

Cập nhật bảng sinh viên (trong tab 'students'):
```javascript
<table>
  <thead>
    <tr>
      <th>Mã SV</th>
      <th>Họ tên</th>
      <th>Email</th>
      {(user?.role === 'admin' || user?.role === 'teacher') && <th>Thao tác</th>}
    </tr>
  </thead>
  <tbody>
    {students.map((s) => (
      <tr key={s._id}>
        <td>{s.studentCode}</td>
        <td>{s.name}</td>
        <td>{s.email}</td>
        {(user?.role === 'admin' || user?.role === 'teacher') && (
          <td>
            <button 
              className="btn-primary" 
              onClick={() => setResetPasswordStudent(s)}
              style={{ marginRight: 8 }}
            >
              Đặt lại MK
            </button>
            {user?.role === 'admin' && (
              <button 
                className="btn-danger" 
                onClick={() => handleRemoveStudent(s._id)}
              >
                Xóa
              </button>
            )}
          </td>
        )}
      </tr>
    ))}
  </tbody>
</table>

{/* Reset Password Modal */}
{resetPasswordStudent && (
  <ResetPasswordModal
    student={resetPasswordStudent}
    onClose={() => setResetPasswordStudent(null)}
    onSuccess={() => {
      // Optionally refresh student list
      fetchStudents();
    }}
  />
)}
```

## Data Models

### User Model (Existing)
**File**: `backend/src/models/User.js`

```javascript
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
  avatar: { type: String, default: '' },
  phone: { type: String, default: '' },
  isLocked: { type: Boolean, default: false },
  studentCode: { type: String },
  teacherCode: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Pre-save hook for password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});
```

**Relevant Fields**:
- `password`: Hashed password (bcrypt with 12 salt rounds)
- `email`: Used for sending reset notification
- `role`: Must be 'student' for password reset target
- `isDeleted`: Soft delete flag (deleted users cannot have password reset)

### Enrollment Model (Existing)
**File**: `backend/src/models/Enrollment.js`

```javascript
const enrollmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  enrolledAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'dropped', 'completed'], default: 'active' }
});
```

**Usage**: Used to verify that a teacher has access to reset a student's password by checking if the student is enrolled in a class taught by that teacher.

### Class Model (Existing)
**File**: `backend/src/models/Class.js`

```javascript
const classSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  semester: { type: String, required: true },
  year: { type: String, required: true },
  status: { type: String, enum: ['active', 'closed', 'upcoming'], default: 'active' }
});
```

**Usage**: Used to verify teacher ownership of a class when checking authorization for password reset.

### API Request/Response Models

#### Request
```typescript
POST /api/users/:id/reset-password
Headers: {
  Authorization: "Bearer <JWT_TOKEN>"
}
Body: {
  newPassword: string  // minimum 6 characters
}
```

#### Success Response
```typescript
{
  success: true,
  message: "Đặt lại mật khẩu thành công"
}
```

#### Error Responses
```typescript
// 400 - Validation Error
{
  success: false,
  message: "Mật khẩu phải có ít nhất 6 ký tự"
}

// 401 - Authentication Error
{
  success: false,
  message: "Chưa đăng nhập" | "Token không hợp lệ hoặc đã hết hạn"
}

// 403 - Authorization Error
{
  success: false,
  message: "Không có quyền truy cập" | "Bạn không có quyền đặt lại mật khẩu cho sinh viên này"
}

// 404 - Not Found
{
  success: false,
  message: "Không tìm thấy sinh viên"
}

// 500 - Server Error
{
  success: false,
  message: "Lỗi khi đặt lại mật khẩu"
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Role-based Authorization

*For any* user attempting to reset a student password, the system should only allow the operation if the user has role 'teacher' or 'admin', and should reject all other roles with a 403 authorization error.

**Validates: Requirements 1.1, 1.2, 1.3**

### Property 2: JWT Authentication Required

*For any* password reset request, the system should verify that a valid JWT token is present in the Authorization header, and should reject requests with missing or invalid tokens with a 401 authentication error.

**Validates: Requirements 1.4**

### Property 3: Teacher Class Membership Verification

*For any* teacher attempting to reset a student password, the system should verify that the student is enrolled in at least one class taught by that teacher, and should reject the request with a 403 permission error if no such enrollment exists.

**Validates: Requirements 2.1, 2.2**

### Property 4: Admin Bypass of Class Membership

*For any* admin user, the system should allow password reset for any student regardless of class enrollment, without performing class membership verification.

**Validates: Requirements 2.3**

### Property 5: Password Length Validation

*For any* password reset request, the system should validate that the new password has at least 6 characters, and should reject passwords with fewer than 6 characters with a 400 validation error.

**Validates: Requirements 3.1, 3.2**

### Property 6: Password Character Acceptance

*For any* password containing any combination of letters, numbers, and special characters, the system should accept it as valid as long as it meets the minimum length requirement of 6 characters.

**Validates: Requirements 3.3**

### Property 7: Password Hashing with Bcrypt

*For any* valid password reset, the system should hash the new password using bcrypt before storing it in the database, ensuring that the stored password is different from the plaintext and can be verified using bcrypt.compare().

**Validates: Requirements 4.1, 4.2, 4.3**

### Property 8: Success Response on Completion

*For any* successful password reset, the system should return a success response with HTTP 200 status and a confirmation message.

**Validates: Requirements 4.4**

### Property 9: Email Notification Sent

*For any* successful password reset, the system should send an email notification to the student's email address containing the new password.

**Validates: Requirements 5.1, 5.2**

### Property 10: Email Failure Does Not Block Reset

*For any* password reset where the email service fails, the system should still complete the password update in the database and log the email error, ensuring that email failures do not prevent password changes.

**Validates: Requirements 5.3**

### Property 11: HTTP 403 for Authorization Failures

*For any* password reset request that fails authorization checks (wrong role or no class access), the system should return HTTP 403 with an appropriate error message.

**Validates: Requirements 7.4**

### Property 12: HTTP 400 for Validation Failures

*For any* password reset request with invalid input (password too short), the system should return HTTP 400 with a validation error message.

**Validates: Requirements 7.5**

### Property 13: HTTP 404 for Non-existent Students

*For any* password reset request targeting a student ID that does not exist or is deleted, the system should return HTTP 404 with a not found error message.

**Validates: Requirements 7.6**

### Property 14: Audit Logging on Initiation

*For any* password reset attempt, the system should log the teacher/admin ID, student ID, and timestamp when the operation is initiated.

**Validates: Requirements 8.1**

### Property 15: Audit Logging on Completion

*For any* successful password reset, the system should log the completion status with relevant details.

**Validates: Requirements 8.2**

### Property 16: Audit Logging on Failure

*For any* failed password reset, the system should log the failure reason along with the teacher/admin ID and student ID.

**Validates: Requirements 8.3**

## Error Handling

### Validation Errors

**Password Too Short**
- Trigger: `newPassword.length < 6`
- Response: HTTP 400
- Message: "Mật khẩu phải có ít nhất 6 ký tự"
- Action: Return error immediately, do not proceed with reset

**Missing Password**
- Trigger: `!newPassword`
- Response: HTTP 400
- Message: "Mật khẩu phải có ít nhất 6 ký tự"
- Action: Return error immediately

### Authentication Errors

**Missing JWT Token**
- Trigger: No Authorization header or invalid format
- Response: HTTP 401
- Message: "Chưa đăng nhập"
- Handler: `protect` middleware
- Action: Reject request before reaching controller

**Invalid/Expired JWT Token**
- Trigger: JWT verification fails
- Response: HTTP 401
- Message: "Token không hợp lệ hoặc đã hết hạn"
- Handler: `protect` middleware
- Action: Reject request before reaching controller

**Locked or Deleted Account**
- Trigger: `user.isLocked || user.isDeleted`
- Response: HTTP 401
- Message: "Tài khoản không hợp lệ"
- Handler: `protect` middleware
- Action: Reject request before reaching controller

### Authorization Errors

**Insufficient Role**
- Trigger: User role is not 'teacher' or 'admin'
- Response: HTTP 403
- Message: "Không có quyền truy cập"
- Handler: `authorize` middleware
- Action: Reject request before reaching controller

**Teacher Without Class Access**
- Trigger: Teacher attempts to reset password for student not in their class
- Response: HTTP 403
- Message: "Bạn không có quyền đặt lại mật khẩu cho sinh viên này"
- Handler: Controller logic
- Action: Return error after checking enrollment

### Not Found Errors

**Student Not Found**
- Trigger: `!student || student.isDeleted`
- Response: HTTP 404
- Message: "Không tìm thấy sinh viên"
- Action: Return error, do not proceed

**Student Not a Student Role**
- Trigger: `student.role !== 'student'`
- Response: HTTP 404
- Message: "Không tìm thấy sinh viên"
- Action: Return error (treat as not found for security)

### Email Service Errors

**Email Configuration Missing**
- Trigger: `!process.env.EMAIL_USER || !process.env.EMAIL_PASS`
- Response: Log warning, continue with password reset
- Message: "Email credentials not configured"
- Action: Password reset succeeds, email not sent

**Email Send Failure**
- Trigger: SMTP error, network error, invalid email address
- Response: Log error, continue with password reset
- Message: Logged to console with error details
- Action: Password reset succeeds, email not sent

### Database Errors

**MongoDB Connection Error**
- Trigger: Database connection lost
- Response: HTTP 500
- Message: "Lỗi khi đặt lại mật khẩu"
- Action: Return generic error, log detailed error

**Save Operation Failure**
- Trigger: `student.save()` fails
- Response: HTTP 500
- Message: "Lỗi khi đặt lại mật khẩu"
- Action: Return generic error, log detailed error

### Error Logging Strategy

All errors should be logged with appropriate detail:

```javascript
// Validation errors - log at info level
console.log(`[INFO] Password reset validation failed: ${error.message}`);

// Authorization errors - log at warning level
console.warn(`[WARN] Unauthorized password reset attempt - User: ${userId}, Target: ${studentId}`);

// System errors - log at error level
console.error(`[ERROR] Password reset system error:`, error);

// Audit trail - log all attempts
console.log(`[AUDIT] Password reset - Teacher: ${teacherId}, Student: ${studentId}, Status: ${status}, Time: ${timestamp}`);
```

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

- **Unit tests**: Verify specific examples, edge cases, and error conditions
- **Property tests**: Verify universal properties across all inputs

### Unit Testing

**Test Framework**: Jest + Supertest (for API testing)

**Test Categories**:

1. **Authentication Tests**
   - Test with valid JWT token → should proceed
   - Test with missing JWT token → should return 401
   - Test with expired JWT token → should return 401
   - Test with invalid JWT token → should return 401

2. **Authorization Tests**
   - Test admin resetting any student password → should succeed
   - Test teacher resetting student in their class → should succeed
   - Test teacher resetting student not in their class → should return 403
   - Test student attempting to reset password → should return 403

3. **Validation Tests**
   - Test with 6-character password → should succeed
   - Test with 5-character password → should return 400
   - Test with empty password → should return 400
   - Test with password containing special characters → should succeed

4. **Password Hashing Tests**
   - Test that stored password is hashed (not plaintext)
   - Test that bcrypt.compare works with stored password
   - Test that password hash changes when reset

5. **Email Service Tests**
   - Test email sent on successful reset (mock email service)
   - Test email contains new password
   - Test password reset succeeds even if email fails

6. **Error Handling Tests**
   - Test with non-existent student ID → should return 404
   - Test with deleted student → should return 404
   - Test database error handling → should return 500

7. **Frontend Component Tests** (React Testing Library)
   - Test modal opens when button clicked
   - Test modal displays student information
   - Test form submission with valid password
   - Test form validation for short password
   - Test success message display
   - Test error message display

### Property-Based Testing

**Test Framework**: fast-check (JavaScript property-based testing library)

**Configuration**: Minimum 100 iterations per property test

**Property Tests**:

Each property test must be tagged with a comment referencing the design property:

```javascript
// Feature: teacher-reset-student-password, Property 1: Role-based Authorization
```

**Property Test 1: Role-based Authorization**
```javascript
// Feature: teacher-reset-student-password, Property 1: Role-based Authorization
test('only teachers and admins can reset passwords', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom('admin', 'teacher', 'student'),
      fc.string({ minLength: 6, maxLength: 20 }),
      async (role, password) => {
        const user = await createTestUser({ role });
        const student = await createTestStudent();
        const token = generateToken(user);
        
        const response = await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        if (role === 'admin' || role === 'teacher') {
          expect(response.status).not.toBe(403);
        } else {
          expect(response.status).toBe(403);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 2: Password Length Validation**
```javascript
// Feature: teacher-reset-student-password, Property 5: Password Length Validation
test('passwords must be at least 6 characters', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 0, maxLength: 20 }),
      async (password) => {
        const admin = await createTestUser({ role: 'admin' });
        const student = await createTestStudent();
        const token = generateToken(admin);
        
        const response = await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        if (password.length < 6) {
          expect(response.status).toBe(400);
          expect(response.body.message).toContain('6 ký tự');
        } else {
          expect(response.status).not.toBe(400);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 3: Password Hashing**
```javascript
// Feature: teacher-reset-student-password, Property 7: Password Hashing with Bcrypt
test('passwords are always hashed with bcrypt', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 6, maxLength: 20 }),
      async (password) => {
        const admin = await createTestUser({ role: 'admin' });
        const student = await createTestStudent();
        const token = generateToken(admin);
        
        await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        const updatedStudent = await User.findById(student._id).select('+password');
        
        // Password should not be stored as plaintext
        expect(updatedStudent.password).not.toBe(password);
        
        // Password should be verifiable with bcrypt
        const isValid = await bcrypt.compare(password, updatedStudent.password);
        expect(isValid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 4: Teacher Class Membership**
```javascript
// Feature: teacher-reset-student-password, Property 3: Teacher Class Membership Verification
test('teachers can only reset passwords for students in their classes', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.boolean(),
      fc.string({ minLength: 6, maxLength: 20 }),
      async (isInClass, password) => {
        const teacher = await createTestUser({ role: 'teacher' });
        const student = await createTestStudent();
        const cls = await createTestClass({ teacherId: teacher._id });
        
        if (isInClass) {
          await createEnrollment({ studentId: student._id, classId: cls._id });
        }
        
        const token = generateToken(teacher);
        
        const response = await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        if (isInClass) {
          expect(response.status).toBe(200);
        } else {
          expect(response.status).toBe(403);
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 5: Admin Bypass**
```javascript
// Feature: teacher-reset-student-password, Property 4: Admin Bypass of Class Membership
test('admins can reset any student password without class membership', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 6, maxLength: 20 }),
      async (password) => {
        const admin = await createTestUser({ role: 'admin' });
        const student = await createTestStudent();
        // No enrollment created - student not in any class
        
        const token = generateToken(admin);
        
        const response = await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        expect(response.status).toBe(200);
      }
    ),
    { numRuns: 100 }
  );
});
```

**Property Test 6: Email Failure Does Not Block Reset**
```javascript
// Feature: teacher-reset-student-password, Property 10: Email Failure Does Not Block Reset
test('password reset succeeds even when email fails', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 6, maxLength: 20 }),
      async (password) => {
        // Mock email service to fail
        jest.spyOn(emailService, 'sendPasswordResetEmail')
          .mockRejectedValue(new Error('Email service down'));
        
        const admin = await createTestUser({ role: 'admin' });
        const student = await createTestStudent();
        const token = generateToken(admin);
        
        const response = await request(app)
          .post(`/api/users/${student._id}/reset-password`)
          .set('Authorization', `Bearer ${token}`)
          .send({ newPassword: password });
        
        // Reset should succeed despite email failure
        expect(response.status).toBe(200);
        
        // Password should be updated in database
        const updatedStudent = await User.findById(student._id).select('+password');
        const isValid = await bcrypt.compare(password, updatedStudent.password);
        expect(isValid).toBe(true);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Test Scenarios**:

1. **End-to-End Flow**
   - Teacher logs in → navigates to class → clicks reset button → enters password → submits
   - Verify: Password updated, email sent, success message shown

2. **Cross-Component Integration**
   - Test interaction between ClassDetail and ResetPasswordModal
   - Test API call from frontend to backend
   - Test middleware chain (protect → authorize → controller)

3. **Database Integration**
   - Test with real MongoDB instance (test database)
   - Verify password hashing pre-save hook works
   - Verify enrollment queries work correctly

### Test Coverage Goals

- **Line Coverage**: ≥ 90%
- **Branch Coverage**: ≥ 85%
- **Function Coverage**: 100% for new functions
- **Property Test Iterations**: 100 per property

### Mocking Strategy

**Mock External Services**:
- Email service (Nodemailer) - mock in unit tests, real in integration tests
- JWT token generation - use test tokens with short expiry

**Do Not Mock**:
- Database operations (use test database)
- Bcrypt hashing (test real hashing)
- Mongoose models (test real models)

### Test Data Management

**Test Fixtures**:
```javascript
const testUsers = {
  admin: { role: 'admin', email: 'admin@test.com' },
  teacher: { role: 'teacher', email: 'teacher@test.com' },
  student: { role: 'student', email: 'student@test.com' }
};

const testPasswords = {
  valid: ['123456', 'password123', 'P@ssw0rd!'],
  invalid: ['12345', '', 'abc', '1']
};
```

**Cleanup Strategy**:
- Clear test database before each test suite
- Remove test users after each test
- Reset mocks after each test

