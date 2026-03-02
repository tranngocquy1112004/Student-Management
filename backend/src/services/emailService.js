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

// Send password reset notification email
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

// Send leave approval notification email
export const sendLeaveApprovalEmail = async (leaveRequest, adminId) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email notification.');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    // Get admin info
    const User = (await import('../models/User.js')).default;
    const admin = await User.findById(adminId).select('name email');
    
    // Format dates
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    // Translate reason
    const reasonMap = {
      voluntary: 'Tự nguyện',
      medical: 'Y tế',
      military: 'Nghĩa vụ quân sự',
      financial: 'Tài chính',
      personal: 'Cá nhân'
    };
    
    const subject = 'Đơn xin bảo lưu đã được phê duyệt';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
          ✅ Đơn Xin Bảo Lưu Đã Được Phê Duyệt
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${leaveRequest.studentId.name}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Đơn xin bảo lưu của bạn đã được phê duyệt.
        </p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Thông tin bảo lưu:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 150px;">
                <strong>Lý do:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${reasonMap[leaveRequest.reason] || leaveRequest.reason}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Thời gian:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${formatDate(leaveRequest.startDate)} đến ${formatDate(leaveRequest.endDate)}
              </td>
            </tr>
            ${leaveRequest.reviewNote ? `
            <tr>
              <td style="padding: 8px 0; color: #666; vertical-align: top;">
                <strong>Ghi chú:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${leaveRequest.reviewNote}
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Trong thời gian bảo lưu, bạn sẽ không thể truy cập các lớp học. Vui lòng liên hệ phòng đào tạo nếu có thắc mắc.
        </p>
        
        ${admin ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Người phê duyệt:</strong> ${admin.name}<br>
            <strong>Email liên hệ:</strong> ${admin.email}
          </p>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
      to: leaveRequest.studentId.email,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Leave approval email sent to ${leaveRequest.studentId.email}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send leave rejection notification email
export const sendLeaveRejectionEmail = async (leaveRequest, adminId) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email notification.');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    // Get admin info
    const User = (await import('../models/User.js')).default;
    const admin = await User.findById(adminId).select('name email');
    
    const subject = 'Đơn xin bảo lưu đã bị từ chối';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #f44336; border-bottom: 2px solid #f44336; padding-bottom: 10px;">
          ❌ Đơn Xin Bảo Lưu Đã Bị Từ Chối
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${leaveRequest.studentId.name}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Đơn xin bảo lưu của bạn đã bị từ chối.
        </p>
        
        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h3 style="margin-top: 0; color: #333;">Lý do từ chối:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            ${leaveRequest.reviewNote}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Nếu bạn có thắc mắc hoặc muốn nộp đơn mới, vui lòng liên hệ phòng đào tạo.
        </p>
        
        ${admin ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #e3f2fd; border-radius: 8px;">
          <p style="margin: 0; font-size: 14px; color: #666;">
            <strong>Người xét duyệt:</strong> ${admin.name}<br>
            <strong>Email liên hệ:</strong> ${admin.email}
          </p>
        </div>
        ` : ''}
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    await transporter.sendMail({
      from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
      to: leaveRequest.studentId.email,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Leave rejection email sent to ${leaveRequest.studentId.email}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send expulsion notification email
export const sendExpulsionNotification = async ({ to, studentName, reason, reasonType, effectiveDate }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const reasonTypeMap = {
      low_gpa: 'Điểm trung bình thấp',
      discipline_violation: 'Vi phạm kỷ luật',
      excessive_absence: 'Vắng học quá nhiều',
      expired_leave: 'Hết hạn bảo lưu'
    };
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };
    
    const subject = '⚠️ Thông báo quyết định đuổi học';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #d32f2f; border-bottom: 2px solid #d32f2f; padding-bottom: 10px;">
          ⚠️ Thông Báo Quyết Định Đuổi Học
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${studentName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Nhà trường thông báo quyết định đuổi học đối với bạn.
        </p>
        
        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <h3 style="margin-top: 0; color: #333;">Thông tin quyết định:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 150px;">
                <strong>Loại vi phạm:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${reasonTypeMap[reasonType] || reasonType}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; vertical-align: top;">
                <strong>Lý do chi tiết:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${reason}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Ngày hiệu lực:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${formatDate(effectiveDate)}
              </td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #333;">Quyền khiếu nại:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            Nếu bạn không đồng ý với quyết định này, bạn có quyền gửi đơn khiếu nại trong vòng 15 ngày kể từ ngày nhận được thông báo. 
            Vui lòng đăng nhập vào hệ thống để xem chi tiết và gửi đơn khiếu nại.
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Để biết thêm chi tiết hoặc có thắc mắc, vui lòng liên hệ phòng đào tạo.
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
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Expulsion notification sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send academic warning email
export const sendAcademicWarningEmail = async ({ to, studentName, gpa, threshold, warningLevel, semester }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const levelText = {
      1: 'Cảnh báo lần 1',
      2: 'Cảnh báo lần 2',
      3: 'Cảnh báo lần 3 (Nguy cơ đuổi học)'
    };
    
    const subject = `⚠️ Cảnh báo học tập - ${levelText[warningLevel]}`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">
          ⚠️ Cảnh Báo Học Tập
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${studentName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Hệ thống ghi nhận điểm trung bình của bạn trong học kỳ <strong>${semester}</strong> thấp hơn ngưỡng quy định.
        </p>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #333;">${levelText[warningLevel]}</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 150px;">
                <strong>Điểm TB hiện tại:</strong>
              </td>
              <td style="padding: 8px 0; color: #d32f2f; font-size: 18px; font-weight: bold;">
                ${gpa.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Ngưỡng tối thiểu:</strong>
              </td>
              <td style="padding: 8px 0; color: #333; font-size: 18px; font-weight: bold;">
                ${threshold.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Học kỳ:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${semester}
              </td>
            </tr>
          </table>
        </div>
        
        ${warningLevel === 3 ? `
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p style="margin: 0; color: #d32f2f; font-weight: bold;">
            ⚠️ Cảnh báo nghiêm trọng: Nếu điểm trung bình không cải thiện trong học kỳ tiếp theo, bạn có nguy cơ bị đuổi học.
          </p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #666;">
          Vui lòng nỗ lực học tập để cải thiện kết quả. Nếu cần hỗ trợ, hãy liên hệ với giảng viên hoặc phòng đào tạo.
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
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Academic warning email sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send attendance warning email
export const sendAttendanceWarningEmail = async ({ to, studentName, className, absenceRate, warningLevel }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const levelText = warningLevel === 'critical' ? 'Cảnh báo nghiêm trọng' : 'Cảnh báo';
    const color = warningLevel === 'critical' ? '#d32f2f' : '#ff9800';
    
    const subject = `⚠️ ${levelText} - Vắng học quá nhiều`;
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: ${color}; border-bottom: 2px solid ${color}; padding-bottom: 10px;">
          ⚠️ ${levelText} - Vắng Học
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${studentName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Hệ thống ghi nhận tỷ lệ vắng học của bạn trong lớp <strong>${className}</strong> vượt quá mức cho phép.
        </p>
        
        <div style="background-color: ${warningLevel === 'critical' ? '#ffebee' : '#fff3e0'}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
          <h3 style="margin-top: 0; color: #333;">Thông tin vắng học:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; width: 150px;">
                <strong>Lớp học:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${className}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Tỷ lệ vắng:</strong>
              </td>
              <td style="padding: 8px 0; color: ${color}; font-size: 18px; font-weight: bold;">
                ${absenceRate.toFixed(1)}%
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">
                <strong>Mức cho phép:</strong>
              </td>
              <td style="padding: 8px 0; color: #333;">
                ${warningLevel === 'critical' ? '30%' : '20%'}
              </td>
            </tr>
          </table>
        </div>
        
        ${warningLevel === 'critical' ? `
        <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d32f2f;">
          <p style="margin: 0; color: #d32f2f; font-weight: bold;">
            ⚠️ Cảnh báo nghiêm trọng: Tỷ lệ vắng học của bạn đã vượt quá 30%. Bạn có nguy cơ bị đuổi học nếu tiếp tục vắng.
          </p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #666;">
          Vui lòng tham gia lớp học đầy đủ. Nếu có lý do chính đáng, hãy liên hệ với giảng viên để được hỗ trợ.
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
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Attendance warning email sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send appeal submitted notification to admin
export const sendAppealSubmittedNotification = async ({ studentName, studentEmail, appealReason, expulsionId }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    // Get admin emails
    const User = (await import('../models/User.js')).default;
    const admins = await User.find({ role: 'admin', isDeleted: false }).select('email');
    
    if (admins.length === 0) {
      console.warn('No admin users found');
      return { success: false, error: 'No admins' };
    }
    
    const subject = '📝 Đơn khiếu nại quyết định đuổi học mới';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2196f3; border-bottom: 2px solid #2196f3; padding-bottom: 10px;">
          📝 Đơn Khiếu Nại Mới
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Sinh viên <strong>${studentName}</strong> (${studentEmail}) đã gửi đơn khiếu nại quyết định đuổi học.
        </p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #333;">Lý do khiếu nại:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            ${appealReason}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Vui lòng đăng nhập vào hệ thống để xem chi tiết và xét duyệt đơn khiếu nại.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    // Send to all admins
    const emailPromises = admins.map(admin => 
      transporter.sendMail({
        from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: subject,
        html: htmlContent,
      })
    );
    
    await Promise.all(emailPromises);
    console.log(`✅ Appeal submitted notification sent to ${admins.length} admins`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send appeal approved notification to student
export const sendAppealApprovedNotification = async ({ to, studentName, reviewNote }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const subject = '✅ Đơn khiếu nại đã được chấp nhận';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #4caf50; border-bottom: 2px solid #4caf50; padding-bottom: 10px;">
          ✅ Đơn Khiếu Nại Đã Được Chấp Nhận
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${studentName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Đơn khiếu nại quyết định đuổi học của bạn đã được xét duyệt và chấp nhận. Quyết định đuổi học đã được hủy bỏ.
        </p>
        
        ${reviewNote ? `
        <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
          <h3 style="margin-top: 0; color: #333;">Ghi chú từ ban quản lý:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            ${reviewNote}
          </p>
        </div>
        ` : ''}
        
        <p style="font-size: 14px; color: #666;">
          Bạn có thể tiếp tục học tập bình thường. Vui lòng đăng nhập vào hệ thống để truy cập các lớp học.
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
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Appeal approved notification sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send appeal rejected notification to student
export const sendAppealRejectedNotification = async ({ to, studentName, reviewNote }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    const subject = '❌ Đơn khiếu nại đã bị từ chối';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #f44336; border-bottom: 2px solid #f44336; padding-bottom: 10px;">
          ❌ Đơn Khiếu Nại Đã Bị Từ Chối
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Xin chào <strong>${studentName}</strong>,
        </p>
        
        <p style="font-size: 16px; color: #333;">
          Đơn khiếu nại quyết định đuổi học của bạn đã được xét duyệt và bị từ chối. Quyết định đuổi học vẫn có hiệu lực.
        </p>
        
        <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
          <h3 style="margin-top: 0; color: #333;">Lý do từ chối:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            ${reviewNote}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Nếu bạn có thắc mắc, vui lòng liên hệ phòng đào tạo để được giải đáp.
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
      to: to,
      subject: subject,
      html: htmlContent,
    });
    
    console.log(`✅ Appeal rejected notification sent to ${to}`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Send violation report notification to admin
export const sendViolationReportNotification = async ({ studentName, teacherName, description }) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured');
      return { success: false, error: 'Email not configured' };
    }

    const transporter = createTransporter();
    
    // Get admin emails
    const User = (await import('../models/User.js')).default;
    const admins = await User.find({ role: 'admin', isDeleted: false }).select('email');
    
    if (admins.length === 0) {
      console.warn('No admin users found');
      return { success: false, error: 'No admins' };
    }
    
    const subject = '⚠️ Báo cáo vi phạm kỷ luật mới';
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #ff9800; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">
          ⚠️ Báo Cáo Vi Phạm Kỷ Luật
        </h2>
        
        <p style="font-size: 16px; color: #333;">
          Giảng viên <strong>${teacherName}</strong> đã báo cáo vi phạm kỷ luật của sinh viên <strong>${studentName}</strong>.
        </p>
        
        <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
          <h3 style="margin-top: 0; color: #333;">Mô tả vi phạm:</h3>
          <p style="margin: 0; color: #333; font-size: 15px;">
            ${description}
          </p>
        </div>
        
        <p style="font-size: 14px; color: #666;">
          Vui lòng đăng nhập vào hệ thống để xem chi tiết và xử lý báo cáo.
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        
        <p style="font-size: 12px; color: #999; text-align: center;">
          Email này được gửi tự động từ Hệ thống Quản lý Sinh viên.<br>
          Vui lòng không trả lời email này.
        </p>
      </div>
    `;
    
    // Send to all admins
    const emailPromises = admins.map(admin => 
      transporter.sendMail({
        from: `"Hệ thống Quản lý Sinh viên" <${process.env.EMAIL_USER}>`,
        to: admin.email,
        subject: subject,
        html: htmlContent,
      })
    );
    
    await Promise.all(emailPromises);
    console.log(`✅ Violation report notification sent to ${admins.length} admins`);
    return { success: true };
    
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error: error.message };
  }
};

// Export default object for compatibility
export default {
  sendScheduleNotification,
  sendPasswordResetEmail,
  sendLeaveApprovalEmail,
  sendLeaveRejectionEmail,
  sendExpulsionNotification,
  sendAcademicWarningEmail,
  sendAttendanceWarningEmail,
  sendAppealSubmittedNotification,
  sendAppealApprovedNotification,
  sendAppealRejectedNotification,
  sendViolationReportNotification
};
