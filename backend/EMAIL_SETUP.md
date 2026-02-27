# Cấu hình Email Service

## Hướng dẫn thiết lập Gmail SMTP

### 1. Bật 2FA cho tài khoản Gmail
1. Vào [Google Account](https://myaccount.google.com/)
2. Security → 2-Step Verification → Bật lên

### 2. Tạo App Password
1. Vào [App Passwords](https://myaccount.google.com/apppasswords)
2. Select app: "Other (Custom name)"
3. Đặt tên: "Classroom Management"
4. Copy password (16 ký tự)

### 3. Cấu hình .env
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

### 4. Test email connection
```javascript
import { testEmailConnection } from './src/services/emailService.js';
await testEmailConnection();
```

## Các Email Service khác

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

### Yahoo Mail
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_password
```

## Tính năng
- ✅ Gửi thông báo lịch học mới cho sinh viên
- ✅ Email template đẹp, responsive
- ✅ Hỗ trợ HTML và text format
- ✅ Error handling và logging
- ✅ Async gửi (không block API)

## Lưu ý
- Sử dụng App Password thay vì password thường
- Email gửi không chờ (async) để không làm chậm API
- Có thể test với các email service khác
- Template có thể tùy chỉnh trong `emailService.js`
