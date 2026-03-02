import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';
import User from '../models/User.js';
import scheduleValidator from '../services/scheduleValidator.js';
import attendanceService from '../services/attendanceService.js';

const canAccessClass = async (user, classId) => {
  const cls = await Class.findById(classId);
  if (!cls || cls.isDeleted) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && cls.teacherId.toString() === user._id.toString()) return true;
  if (user.role === 'student') {
    const en = await Enrollment.findOne({ classId, studentId: user._id });
    return !!en;
  }
  return false;
};

export const createSession = async (req, res) => {
  try {
    // Validate classId references a valid class
    const classExists = await Class.findById(req.params.classId);
    if (!classExists || classExists.isDeleted) {
      return res.status(400).json({ success: false, message: 'Invalid class ID' });
    }
    
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false, message: 'Access denied' });
    
    // Validate schedule and time window
    const validation = await scheduleValidator.validateScheduleAndTime(req.params.classId);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message,
        code: validation.code
      });
    }
    
    const session = await AttendanceSession.create({ ...req.body, classId: req.params.classId });
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessions = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed) return res.status(403).json({ success: false });

    const { page, limit } = req.query;
    const filter = { classId: req.params.classId, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const result = await paginate(
      AttendanceSession,
      filter,
      {
        page,
        limit,
        sort: { date: -1 }
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSession = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session || session.isDeleted) return res.status(404).json({ success: false });
    const allowed = await canAccessClass(req.user, session.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const updated = await AttendanceSession.findByIdAndUpdate(req.params.sessionId, req.body, { new: true });
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const manualCheck = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session || session.isDeleted) return res.status(404).json({ success: false, message: 'Session not found' });
    
    const allowed = await canAccessClass(req.user, session.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false, message: 'Access denied' });
    
    const { studentId, status } = req.body;
    
    // Validate studentId references a valid student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ success: false, message: 'Invalid student ID' });
    }
    
    // Validate student is enrolled in the class
    const enrollment = await Enrollment.findOne({ classId: session.classId, studentId });
    if (!enrollment) {
      return res.status(400).json({ success: false, message: 'Student not enrolled in this class' });
    }
    
    const record = await AttendanceRecord.findOneAndUpdate(
      { sessionId: req.params.sessionId, studentId },
      { status: status || 'present', checkedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkManual = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session || session.isDeleted) return res.status(404).json({ success: false });
    const allowed = await canAccessClass(req.user, session.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const { records } = req.body;
    for (const r of records) {
      await AttendanceRecord.findOneAndUpdate(
        { sessionId: req.params.sessionId, studentId: r.studentId },
        { status: r.status || 'present' },
        { upsert: true }
      );
    }
    const all = await AttendanceRecord.find({ sessionId: req.params.sessionId }).populate('studentId', 'name email');
    res.json({ success: true, data: all });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateCode = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session || session.isDeleted) return res.status(404).json({ success: false });
    const allowed = await canAccessClass(req.user, session.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + (req.body.minutes || 5) * 60 * 1000);
    session.code = code;
    session.codeExpiredAt = expiresAt;
    await session.save();
    res.json({ success: true, data: { code, expiresAt } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { code, sessionId } = req.body;
    const session = await AttendanceSession.findById(sessionId);
    if (!session || !session.code || session.code !== code) return res.status(400).json({ success: false, message: 'Mã không hợp lệ' });
    if (session.codeExpiredAt < new Date()) return res.status(400).json({ success: false, message: 'Mã đã hết hạn' });
    
    // Validate schedule and time window
    const validation = await scheduleValidator.validateScheduleAndTime(session.classId);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message,
        code: validation.code
      });
    }
    
    const en = await Enrollment.findOne({ classId: session.classId, studentId: req.user._id });
    if (!en) return res.status(403).json({ success: false, message: 'Bạn không được ghi danh vào lớp học này' });
    const record = await AttendanceRecord.findOneAndUpdate(
      { sessionId, studentId: req.user._id },
      { status: 'present', checkInMethod: 'qr', checkedAt: new Date() },
      { new: true, upsert: true }
    );
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSessionRecords = async (req, res) => {
  try {
    const session = await AttendanceSession.findById(req.params.sessionId);
    if (!session || session.isDeleted) return res.status(404).json({ success: false });
    const allowed = await canAccessClass(req.user, session.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const records = await AttendanceRecord.find({ sessionId: req.params.sessionId }).populate('studentId', 'name email studentCode');
    res.json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReport = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) return res.status(403).json({ success: false });
    const sessions = await AttendanceSession.find({ classId: req.params.classId, isDeleted: false });
    const students = await Enrollment.find({ classId: req.params.classId }).populate('studentId', 'name email studentCode');
    const records = await AttendanceRecord.find({ sessionId: { $in: sessions.map(s => s._id) } });
    const report = students.map(s => {
      const studentRecords = records.filter(r => r.studentId.toString() === s.studentId._id.toString());
      const present = studentRecords.filter(r => r.status === 'present').length;
      const absent = studentRecords.filter(r => r.status === 'absent').length;
      const late = studentRecords.filter(r => r.status === 'late').length;
      return {
        student: s.studentId,
        total: sessions.length,
        present,
        absent,
        late,
      };
    });
    res.json({ success: true, data: { sessions, report } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const en = await Enrollment.findOne({ classId: req.params.classId, studentId: req.user._id });
    if (!en) return res.status(403).json({ success: false });

    const { page, limit } = req.query;
    const filter = { classId: req.params.classId, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const sessionsResult = await paginate(
      AttendanceSession,
      filter,
      {
        page,
        limit,
        sort: { date: -1 }
      }
    );

    // Get records for the paginated sessions
    const sessionIds = sessionsResult.data ? sessionsResult.data.map(s => s._id) : [];
    const records = await AttendanceRecord.find({
      sessionId: { $in: sessionIds },
      studentId: req.user._id
    });

    // Return both sessions and records with pagination metadata
    res.json({
      success: true,
      data: {
        sessions: sessionsResult.data,
        records
      },
      pagination: sessionsResult.pagination
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const validateSchedule = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed) return res.status(403).json({ success: false, message: 'Access denied' });

    const validation = await scheduleValidator.validateScheduleAndTime(req.params.classId);
    
    if (!validation.valid) {
      return res.json({
        success: true,
        valid: false,
        message: validation.message,
        code: validation.code,
        schedule: validation.schedule
      });
    }

    return res.json({
      success: true,
      valid: true,
      message: validation.message,
      code: validation.code,
      schedule: {
        dayOfWeek: validation.schedule.dayOfWeek,
        startTime: validation.schedule.startTime,
        endTime: validation.schedule.endTime,
        room: validation.schedule.room
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStatistics = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const statistics = await attendanceService.calculateStatistics(req.params.classId);
    res.json({ success: true, data: statistics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAttendanceRate = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.classId);
    if (!allowed || (req.user.role !== 'admin' && req.user.role !== 'teacher')) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const rate = await attendanceService.calculateAttendanceRate(req.params.classId);
    res.json({ success: true, data: rate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherAttendanceRates = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const teacherId = req.user.role === 'teacher' ? req.user._id : req.params.teacherId;
    const rates = await attendanceService.getTeacherClassesAttendanceRate(teacherId);
    res.json({ success: true, data: rates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const directCheckIn = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Validate student is enrolled
    const enrollment = await Enrollment.findOne({ classId, studentId: req.user._id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Bạn không được ghi danh vào lớp học này' });
    }
    
    // Validate schedule and time window
    const validation = await scheduleValidator.validateScheduleAndTime(classId);
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message,
        code: validation.code
      });
    }
    
    // Find or create today's attendance session
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let session = await AttendanceSession.findOne({
      classId,
      date: { $gte: today, $lt: tomorrow },
      isDeleted: false
    });
    
    if (!session) {
      // Auto-create session for today
      session = await AttendanceSession.create({
        classId,
        date: new Date(),
        shift: validation.schedule.shift || `${validation.schedule.startTime} - ${validation.schedule.endTime}`
      });
    }
    
    // Check if already checked in
    const existingRecord = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: req.user._id
    });
    
    if (existingRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bạn đã điểm danh cho buổi học này rồi' 
      });
    }
    
    // Create attendance record
    const record = await AttendanceRecord.create({
      sessionId: session._id,
      studentId: req.user._id,
      status: 'present',
      checkInMethod: 'manual',
      checkedAt: new Date()
    });
    
    res.json({ 
      success: true, 
      data: record,
      message: 'Điểm danh thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentAttendanceStatus = async (req, res) => {
  try {
    const { classId } = req.params;
    
    // Validate student is enrolled
    const enrollment = await Enrollment.findOne({ classId, studentId: req.user._id });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    
    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Find today's session
    const session = await AttendanceSession.findOne({
      classId,
      date: { $gte: today, $lt: tomorrow },
      isDeleted: false
    });
    
    if (!session) {
      return res.json({ 
        success: true, 
        hasCheckedIn: false,
        sessionExists: false
      });
    }
    
    // Check if student has attendance record for today
    const record = await AttendanceRecord.findOne({
      sessionId: session._id,
      studentId: req.user._id
    });
    
    res.json({ 
      success: true, 
      hasCheckedIn: !!record,
      sessionExists: true,
      record: record || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
