import emailjs from '@emailjs/browser';

// Cấu hình EmailJS - cần thay thế bằng thông tin của bạn
const EMAILJS_PUBLIC_KEY = 'JJISXs9R39y0CNQMe';
const EMAILJS_SERVICE_ID = 'service_79ubclp';
const EMAILJS_TEMPLATE_ID = 'template_t30i2d2';

// Khởi tạo EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

export const sendScheduleEmail = async (students, className, schedule) => {
  try {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayLabel = days[schedule.dayOfWeek] || `Thứ ${schedule.dayOfWeek + 1}`;
    
    const templateParams = {
      class_name: className,
      day_of_week: dayLabel,
      start_time: schedule.startTime,
      end_time: schedule.endTime,
      room: schedule.room,
      shift: schedule.shift || 'Chưa xác định',
      to_emails: students.map(s => s.email).join(','),
      student_names: students.map(s => s.name).join(', '),
    };

    // Gửi email cho tất cả sinh viên
    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log(`✅ EmailJS gửi thành công:`, response.status, response.text);
    return { success: true, sentCount: students.length, response };
    
  } catch (error) {
    console.error('❌ Lỗi khi gửi email với EmailJS:', error);
    return { success: false, error: error.message };
  }
};

export const testEmailJS = async () => {
  try {
    const testParams = {
      class_name: 'Test Class',
      day_of_week: 'Thứ 2',
      start_time: '08:00',
      end_time: '10:00',
      room: 'Phòng A101',
      shift: 'Ca 1',
      to_emails: 'test@example.com',
      student_names: 'Test Student',
    };

    const response = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      testParams
    );

    console.log('✅ EmailJS test thành công:', response);
    return true;
  } catch (error) {
    console.error('❌ EmailJS test thất bại:', error);
    return false;
  }
};
