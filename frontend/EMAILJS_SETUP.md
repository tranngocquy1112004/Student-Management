# Cấu hình EmailJS cho gửi thông báo lịch học

## EmailJS là gì?
EmailJS là dịch vụ gửi email miễn phí, không cần backend, dễ tích hợp vào frontend. Hoàn hảo cho các dự án nhỏ và prototype.

## Hướng dẫn setup

### 1. Đăng ký tài khoản EmailJS
1. Vào [EmailJS](https://www.emailjs.com/)
2. Đăng ký tài khoản miễn phí
3. Verify email của bạn

### 2. Tạo Email Service
1. Dashboard → Email Services → Add New Service
2. Chọn provider (Gmail, Outlook, etc.)
3. Connect với tài khoản email của bạn
4. **Lưu lại Service ID**

### 3. Tạo Email Template
1. Dashboard → Email Templates → Create New Template
2. Template ID: Đặt tên dễ nhớ (ví dụ: `schedule_notification`)
3. Subject: `📚 Thông báo lịch học mới - {{class_name}}`

#### Template Content (HTML):
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thông báo lịch học mới</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
    <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1a237e 0%, #2e7d32 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📚 Thông báo lịch học mới</h1>
            <p style="margin: 10px 0 0; font-size: 16px; opacity: 0.9;">Hệ thống Quản Lý Lớp Học</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
            <h2 style="color: #1a237e; margin-bottom: 20px;">Thông tin lịch học</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0 0 10px; font-size: 16px;"><strong>Lớp học:</strong> {{class_name}}</p>
                <p style="margin: 0 0 10px; font-size: 16px;"><strong>Thời gian:</strong> {{day_of_week}}, {{start_time}} - {{end_time}}</p>
                <p style="margin: 0 0 10px; font-size: 16px;"><strong>Phòng học:</strong> {{room}}</p>
                <p style="margin: 0; font-size: 16px;"><strong>Ca học:</strong> {{shift}}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #2e7d32;">
                <p style="margin: 0; font-size: 14px; color: #2e7d32;">
                    <strong>⏰ Lưu ý:</strong> Vui lòng có mặt đúng giờ để chuẩn bị cho buổi học. 
                    Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ giảng viên.
                </p>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e0e0e0;">
            <p style="margin: 0; font-size: 12px; color: #666;">
                Email này được gửi tự động từ Hệ thống Quản Lý Lớp Học.<br>
                Vui lòng không trả lời email này.
            </p>
        </div>
    </div>
</body>
</html>
```

### 4. Lấy Public Key
1. Dashboard → Account → API Keys
2. Copy **Public Key**

### 5. Cấu hình trong code
Mở file `frontend/src/services/emailjsService.js`:

```javascript
const EMAILJS_PUBLIC_KEY = 'your_public_key_here';        // Thay bằng Public Key
const EMAILJS_SERVICE_ID = 'your_service_id_here';        // Thay bằng Service ID  
const EMAILJS_TEMPLATE_ID = 'your_template_id_here';       // Thay bằng Template ID
```

### 6. Test EmailJS
Mở browser console và chạy:
```javascript
import { testEmailJS } from './src/services/emailjsService.js';
await testEmailJS();
```

## Ưu điểm EmailJS
- ✅ **Miễn phí**: 200 emails/tháng, 1000 emails/ngày
- ✅ **Không cần backend**: Gửi trực tiếp từ frontend
- ✅ **Dễ setup**: Chỉ cần 3 thông tin (Public Key, Service ID, Template ID)
- ✅ **Template đẹp**: Hỗ trợ HTML template
- ✅ **Secure**: Không expose email credentials

## Hạn chế
- ❌ Giới hạn số lượng email (miễn phí)
- ❌ Phải có template trước
- ❌ Không gửi file attachment

## Các biến có sẵn trong template
- `{{class_name}}` - Tên lớp học
- `{{day_of_week}}` - Thứ trong tuần
- `{{start_time}}` - Thời gian bắt đầu
- `{{end_time}}` - Thời gian kết thúc
- `{{room}}` - Phòng học
- `{{shift}}` - Ca học
- `{{to_emails}}` - Email recipients (dùng cho testing)
- `{{student_names}}` - Tên sinh viên

## Troubleshooting
1. **"Refused to connect"**: Kiểm tra CORS trong EmailJS dashboard
2. **"Invalid template"**: Kiểm tra template variables có khớp không
3. **"Service not found"**: Kiểm tra Service ID có đúng không
4. **"Email not sent"**: Kiểm tra email provider đã connect chưa

## Production Tips
- Sử dụng custom domain cho email
- Monitor email quota
- Setup email tracking
- Test với multiple recipients
