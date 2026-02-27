import pkg from 'nodemailer';
const { createTransport } = pkg;

// Create reusable transporter
const createTransporter = () => {
  return createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send schedule notification email
export const sendScheduleNotification = async ({ students, className, schedule }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email notification.');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayLabel = DAYS[schedule.dayOfWeek] || `Thứ ${schedule.dayOfWeek}`;
    
    // Prepare email content
    const subject = `[${className}] Thông báo lịch học mới`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2196f3; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">
          📅 Thông Báo Lịch Học Mới
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Giảng viên vừa tạo lịch học mới cho lớp <strong>${className}</strong>:
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 120px;">
                <strong>Thứ:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${dayLabel}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Giờ học:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${schedule.startTime} - ${schedule.endTime}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Phòng học:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${schedule.room || 'Chưa xác định'}
              </td>
            </tr>
            ${schedule.shift ? `
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Ca học:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${schedule.shift}
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="font-size: 14px; color: #666; margin-top: 20px;">
          Vui lòng sắp xếp thời gian để tham gia lớp học đúng giờ.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    // Send email to each student in parallel (faster)
    const emailPromises = students.map(student => 
      transporter.sendMail({
        from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
        to: student.email,
        subject: subject,
        html: htmlContent,
      }).then(() => {
        console.log(`✅ Email sent to ${student.email}`);
        return { success: true, email: student.email };
      }).catch(error => {
        console.error(`❌ Failed to send email to ${student.email}:`, error.message);
        return { success: false, email: student.email, error: error.message };
      })
    );
    
    // Wait for all emails to be sent
    const results = await Promise.all(emailPromises);
    const sentCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    return {
      success: true,
      sentCount,
      failedCount,
      total: students.length
    };
    
  } catch (error) {
    console.error('Email service error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
