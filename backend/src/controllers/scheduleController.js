import Schedule from '../models/Schedule.js';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import { sendScheduleNotification } from '../services/emailService.js';
import scheduleService from '../services/scheduleService.js';

const DAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export const getSchedules = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });

    const { page, limit } = req.query;
    const filter = { classId: req.params.classId, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const result = await paginate(
      Schedule,
      filter,
      {
        page,
        limit,
        sort: { startDate: 1 }
      }
    );

    // Add dayLabel to each schedule
    if (result.data) {
      result.data = result.data.map(s => ({
        ...s.toObject(),
        dayLabel: DAYS[s.dayOfWeek] || `Thứ ${s.dayOfWeek + 1}`
      }));
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    
    // Kiểm tra trùng lặp (dayOfWeek + startDate)
    const { dayOfWeek, startDate } = req.body;
    if (dayOfWeek !== undefined && startDate) {
      const duplicate = await Schedule.findOne({
        classId: req.params.classId,
        dayOfWeek: dayOfWeek,
        startDate: new Date(startDate),
        isDeleted: false
      });
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          message: `Đã tồn tại lịch học vào ${DAYS[dayOfWeek]} ngày ${new Date(startDate).toLocaleDateString('vi-VN')}` 
        });
      }
    }
    
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
    
    // Kiểm tra trùng lặp (dayOfWeek + startDate), loại trừ lịch hiện tại
    const { dayOfWeek, startDate } = req.body;
    if (dayOfWeek !== undefined && startDate) {
      const duplicate = await Schedule.findOne({
        classId: schedule.classId,
        dayOfWeek: dayOfWeek,
        startDate: new Date(startDate),
        _id: { $ne: req.params.id },
        isDeleted: false
      });
      if (duplicate) {
        return res.status(400).json({ 
          success: false, 
          message: `Đã tồn tại lịch học vào ${DAYS[dayOfWeek]} ngày ${new Date(startDate).toLocaleDateString('vi-VN')}` 
        });
      }
    }
    
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

    const { page, limit } = req.query;
    const filter = { classId: { $in: classIds }, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const result = await paginate(
      Schedule,
      filter,
      {
        page,
        limit,
        sort: { startDate: 1 },
        populate: { path: 'classId', populate: 'subjectId' }
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getRemainingLessons = async (req, res) => {
  try {
    // Validate class exists and is not deleted
    const classData = await Class.findById(req.params.id);
    
    if (!classData || classData.isDeleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }
    
    // Check if totalLessons is configured
    if (!classData.totalLessons) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lớp học chưa được cấu hình số tiết học' 
      });
    }
    
    // Call calculateRemainingLessons service
    const remainingLessons = await scheduleService.calculateRemainingLessons(req.params.id);
    
    // Return totalLessons, scheduledLessons, remainingLessons
    return res.status(200).json({
      success: true,
      data: {
        classId: classData._id,
        totalLessons: classData.totalLessons,
        scheduledLessons: classData.scheduledLessons,
        remainingLessons: remainingLessons
      }
    });
    
  } catch (error) {
    // Handle errors (500 for server errors)
    console.error('Get remaining lessons error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Đã xảy ra lỗi khi tính toán số tiết còn lại' 
    });
  }
};

export const bulkCreateSchedules = async (req, res) => {
  try {
    const classId = req.params.id;
    const { schedules } = req.body;

    // Validate class exists and is not deleted
    const classData = await Class.findById(classId);
    
    if (!classData || classData.isDeleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }

    // Check if totalLessons is set
    if (!classData.totalLessons) {
      return res.status(400).json({ 
        success: false, 
        message: 'Lớp học chưa được cấu hình số tiết học' 
      });
    }

    // Check authorization: teacher must own the class or be admin
    if (classData.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền tạo lịch học cho lớp này' 
      });
    }

    // Call validateBulkSchedules service
    const validationResult = await scheduleService.validateBulkSchedules(classId, schedules);
    
    if (!validationResult.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validationResult.error 
      });
    }

    // Call bulkInsertWithTransaction service
    const result = await scheduleService.bulkInsertWithTransaction(classId, schedules);

    // Return created schedules and updated class
    return res.status(201).json({
      success: true,
      message: `Đã tạo ${result.createdSchedules.length} lịch học thành công`,
      data: {
        createdSchedules: result.createdSchedules,
        updatedClass: {
          _id: result.updatedClass._id,
          scheduledLessons: result.updatedClass.scheduledLessons
        }
      }
    });

  } catch (error) {
    // Handle server errors (500)
    console.error('Bulk create schedules error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Không thể tạo lịch học, vui lòng thử lại' 
    });
  }
};

export const bulkDeleteSchedules = async (req, res) => {
  try {
    const classId = req.params.id;

    // Validate class exists and is not deleted
    const classData = await Class.findById(classId);
    
    if (!classData || classData.isDeleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Không tìm thấy lớp học' 
      });
    }

    // Check authorization: teacher must own the class or be admin
    if (classData.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Bạn không có quyền xóa lịch học cho lớp này' 
      });
    }

    // Count schedules to delete
    const scheduleCount = await Schedule.countDocuments({ 
      classId: classId, 
      isDeleted: false 
    });

    if (scheduleCount === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Không có lịch học nào để xóa' 
      });
    }

    // Soft delete all schedules for this class
    await Schedule.updateMany(
      { classId: classId, isDeleted: false },
      { 
        $set: { 
          isDeleted: true, 
          deletedAt: new Date() 
        } 
      }
    );

    // Reset scheduledLessons to 0
    await Class.findByIdAndUpdate(
      classId,
      { $set: { scheduledLessons: 0 } }
    );

    return res.status(200).json({
      success: true,
      message: `Đã xóa ${scheduleCount} lịch học thành công`,
      data: {
        deletedCount: scheduleCount
      }
    });

  } catch (error) {
    console.error('Bulk delete schedules error:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Không thể xóa lịch học, vui lòng thử lại' 
    });
  }
};
