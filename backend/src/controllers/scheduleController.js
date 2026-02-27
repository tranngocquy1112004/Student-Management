import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { sendScheduleNotification } from '../services/emailService.js';

const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const getSchedules = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    const schedules = await Schedule.find({ classId: req.params.classId, isDeleted: false });
    res.json({ success: true, data: schedules.map(s => ({ ...s.toObject(), dayLabel: DAYS[s.dayOfWeek] || `Thứ ${s.dayOfWeek + 1}` })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    
    const schedule = await Schedule.create({ ...req.body, classId: req.params.classId });
    
    // Get all students in the class
    const enrollments = await Enrollment.find({ classId: req.params.classId }).populate('studentId');
    const students = enrollments.map(e => e.studentId).filter(s => s && s.email);
    
    // Gửi email bất đồng bộ (không chờ kết quả) để API trả về ngay lập tức
    if (students.length > 0) {
      console.log(`📧 Đang gửi email thông báo cho ${students.length} sinh viên...`);
      
      // Gửi email trong background, không chờ kết quả
      sendScheduleNotification({
        students,
        className: cls.name,
        schedule: schedule.toObject()
      }).then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Email đã gửi thành công: ${emailResult.sentCount}/${emailResult.total} sinh viên`);
        } else {
          console.log(`⚠️ Gửi email thất bại: ${emailResult.error}`);
        }
      }).catch(error => {
        console.error('❌ Lỗi khi gửi email:', error);
      });
      
      // Trả về ngay lập tức, không chờ email
      res.status(201).json({ 
        success: true, 
        data: schedule,
        message: `Đã tạo lịch học và đang gửi email cho ${students.length} sinh viên`
      });
    } else {
      res.status(201).json({ 
        success: true, 
        data: schedule,
        message: 'Đã tạo lịch học thành công'
      });
    }
  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule || schedule.isDeleted) return res.status(404).json({ success: false });
    const cls = await Class.findById(schedule.classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    const updated = await Schedule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    if (!schedule || schedule.isDeleted) return res.status(404).json({ success: false });
    const cls = await Class.findById(schedule.classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    schedule.isDeleted = true;
    schedule.deletedAt = new Date();
    await schedule.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySchedule = async (req, res) => {
  try {
    let classIds = [];
    if (req.user.role === 'teacher') {
      const classes = await Class.find({ teacherId: req.user._id, isDeleted: false }).distinct('_id');
      classIds = classes;
    } else {
      classIds = await Enrollment.find({ studentId: req.user._id }).distinct('classId');
    }
    const schedules = await Schedule.find({ classId: { $in: classIds }, isDeleted: false }).populate({ path: 'classId', populate: 'subjectId' });
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
