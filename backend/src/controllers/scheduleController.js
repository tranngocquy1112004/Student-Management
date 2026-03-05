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

    const { page, limit, startDate, endDate } = req.query;
    
    // Use new service to get schedules with status
    const schedules = await scheduleService.getSchedulesWithStatus(req.params.classId, {
      startDate,
      endDate
    });
    
    // Apply pagination if needed
    if (page && limit) {
      const { paginate } = await import('../utils/pagination.js');
      const result = await paginate(
        Schedule,
        { classId: req.params.classId, isDeleted: false },
        {
          page,
          limit,
          sort: { date: 1, startTime: 1 }
        }
      );
      
      // Enrich with status
      result.data = result.data.map(s => ({
        ...s.toObject(),
        status: scheduleService.calculateSessionStatus(s)
      }));
      
      return res.json(result);
    }
    
    res.json({ success: true, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req, res) => {
  try {
    // Validate input
    const validation = await scheduleService.validateScheduleInput(
      req.params.classId,
      req.body,
      req.user
    );
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
        code: validation.code
      });
    }
    
    // Create schedule with auto-session creation
    const result = await scheduleService.createScheduleWithSession(
      req.params.classId,
      req.body,
      req.user._id
    );
    
    // Get class for email notification
    const cls = await Class.findById(req.params.classId);
    const enrollments = await Enrollment.find({ classId: req.params.classId }).populate('studentId');
    const students = enrollments.map(e => e.studentId).filter(s => s && s.email);
    
    // Send email notification in background
    if (students.length > 0) {
      console.log(`📧 Đang gửi email thông báo cho ${students.length} sinh viên...`);
      
      sendScheduleNotification({
        students,
        className: cls.name,
        schedule: result.schedule.toObject()
      }).then(emailResult => {
        if (emailResult.success) {
          console.log(`✅ Email đã gửi thành công: ${emailResult.sentCount}/${emailResult.total} sinh viên`);
        } else {
          console.log(`⚠️ Gửi email thất bại: ${emailResult.error}`);
        }
      }).catch(error => {
        console.error('❌ Lỗi khi gửi email:', error);
      });
    }
    
    res.status(201).json({
      success: true,
      data: result,
      message: students.length > 0 
        ? `Đã tạo lịch học và đang gửi email cho ${students.length} sinh viên`
        : 'Đã tạo lịch học thành công'
    });
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
    await scheduleService.deleteSchedule(req.params.id, req.user);
    res.json({ success: true, message: 'Đã xóa lịch học thành công' });
  } catch (error) {
    if (error.message === 'Schedule not found') {
      return res.status(404).json({ success: false, message: 'Không tìm thấy lịch học' });
    }
    if (error.message === 'Permission denied') {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xóa lịch học này' });
    }
    if (error.message.includes('Cannot delete past')) {
      return res.status(400).json({ success: false, message: error.message, code: 'CANNOT_DELETE_PAST_SCHEDULE' });
    }
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
