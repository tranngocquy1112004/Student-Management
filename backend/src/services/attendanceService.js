import mongoose from 'mongoose';
import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Enrollment from '../models/Enrollment.js';
import { calculateSessionStatus } from './scheduleService.js';

/**
 * Attendance Service
 * Handles student check-in validation and attendance record management
 */

/**
 * Validate if student can check in
 * Checks time window, enrollment, and duplicates
 */
export const validateCheckInEligibility = async (classId, studentId, currentTime = null) => {
  // Find today's session for the class
  const now = currentTime || new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  const session = await AttendanceSession.findOne({
    classId,
    date: { $gte: todayStart, $lte: todayEnd },
    isDeleted: false
  });
  
  if (!session) {
    return {
      valid: false,
      message: 'No attendance session available today',
      code: 'NO_SESSION_TODAY'
    };
  }
  
  // Check time window
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (currentTimeStr < session.startTime) {
    return {
      valid: false,
      message: `Session has not started yet. Class starts at ${session.startTime}`,
      code: 'SESSION_NOT_STARTED'
    };
  }
  
  if (currentTimeStr > session.endTime) {
    return {
      valid: false,
      message: `Session has ended. Class ended at ${session.endTime}`,
      code: 'SESSION_EXPIRED'
    };
  }
  
  // Check enrollment
  const enrollment = await Enrollment.findOne({ classId, studentId });
  if (!enrollment) {
    return {
      valid: false,
      message: 'You are not enrolled in this class',
      code: 'NOT_ENROLLED'
    };
  }
  
  // Check for duplicate check-in
  const existingRecord = await AttendanceRecord.findOne({
    sessionId: session._id,
    studentId
  });
  
  if (existingRecord) {
    return {
      valid: false,
      message: 'You have already checked in for this session',
      code: 'DUPLICATE_CHECKIN'
    };
  }
  
  return {
    valid: true,
    session
  };
};

/**
 * Create attendance record for student
 * Note: Not using transactions for standalone MongoDB compatibility
 */
export const checkInStudent = async (sessionId, studentId) => {
  try {
    const record = await AttendanceRecord.create({
      sessionId,
      studentId,
      status: 'present',
      checkedAt: new Date(),
      checkInMethod: 'manual'
    });
    
    return {
      success: true,
      data: record
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get attendance status for a student in a class
 * Returns whether student has checked in today
 */
export const getStudentAttendanceStatus = async (classId, studentId, date = null) => {
  const targetDate = date || new Date();
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  // Find session for the date
  const session = await AttendanceSession.findOne({
    classId,
    date: { $gte: dayStart, $lte: dayEnd },
    isDeleted: false
  }).populate('scheduleId');
  
  if (!session) {
    return {
      hasSession: false,
      hasCheckedIn: false,
      sessionStatus: null,
      session: null
    };
  }
  
  // Check if student has checked in
  const record = await AttendanceRecord.findOne({
    sessionId: session._id,
    studentId
  });
  
  // Calculate session status
  const scheduleData = session.scheduleId || {
    date: session.date,
    startTime: session.startTime,
    endTime: session.endTime
  };
  
  const status = calculateSessionStatus(scheduleData);
  
  return {
    hasSession: true,
    hasCheckedIn: !!record,
    sessionStatus: status,
    session: {
      _id: session._id,
      date: session.date,
      startTime: session.startTime,
      endTime: session.endTime
    },
    checkInTime: record ? record.checkedAt : null
  };
};

/**
 * Generate attendance report
 * Supports filtering by class, student, or date range
 */
export const getAttendanceReport = async (filters = {}) => {
  const query = {};
  
  // Build query based on filters
  if (filters.classId) {
    const sessions = await AttendanceSession.find({
      classId: filters.classId,
      isDeleted: false
    }).select('_id');
    query.sessionId = { $in: sessions.map(s => s._id) };
  }
  
  if (filters.studentId) {
    query.studentId = filters.studentId;
  }
  
  if (filters.startDate || filters.endDate) {
    // Need to join with sessions to filter by date
    const sessionQuery = { isDeleted: false };
    if (filters.startDate) {
      sessionQuery.date = { $gte: new Date(filters.startDate) };
    }
    if (filters.endDate) {
      sessionQuery.date = sessionQuery.date || {};
      sessionQuery.date.$lte = new Date(filters.endDate);
    }
    
    const sessions = await AttendanceSession.find(sessionQuery).select('_id');
    query.sessionId = { $in: sessions.map(s => s._id) };
  }
  
  // Fetch records with populated data
  const records = await AttendanceRecord.find(query)
    .populate('studentId', 'name email studentCode')
    .populate({
      path: 'sessionId',
      select: 'date startTime endTime classId'
    })
    .sort({ 'sessionId.date': -1, checkedAt: -1 })
    .lean();
  
  return records;
};

/**
 * Calculate attendance statistics for a class
 * Returns today's attendance statistics
 */
export const calculateStatistics = async (classId) => {
  // Get class info
  const Class = (await import('../models/Class.js')).default;
  const classInfo = await Class.findById(classId).select('name');
  
  // Get today's date range
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);
  
  // Get today's session for the class
  const todaySession = await AttendanceSession.findOne({
    classId,
    date: { $gte: todayStart, $lte: todayEnd },
    isDeleted: false
  });
  
  // Get total enrolled students
  const enrollments = await Enrollment.find({ classId });
  const totalStudents = enrollments.length;
  
  // If no session today, return 0 attendance
  if (!todaySession) {
    return {
      className: classInfo?.name || 'Unknown',
      totalStudents,
      studentsAttended: 0,
      attendanceRate: 0
    };
  }
  
  // Get attendance records for today's session
  const records = await AttendanceRecord.find({
    sessionId: todaySession._id,
    status: 'present'
  });
  
  const studentsAttended = records.length;
  const attendanceRate = totalStudents > 0 ? (studentsAttended / totalStudents) * 100 : 0;
  
  return {
    className: classInfo?.name || 'Unknown',
    totalStudents,
    studentsAttended,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  };
};

/**
 * Calculate overall attendance statistics for a class
 * Returns total attendance rate across all sessions
 */
export const calculateOverallStatistics = async (classId) => {
  // Get all sessions for the class
  const sessions = await AttendanceSession.find({
    classId,
    isDeleted: false
  });
  
  const sessionIds = sessions.map(s => s._id);
  
  // Get all attendance records
  const records = await AttendanceRecord.find({
    sessionId: { $in: sessionIds }
  });
  
  // Get total enrolled students
  const enrollments = await Enrollment.find({ classId });
  const totalStudents = enrollments.length;
  
  // Calculate statistics
  const totalSessions = sessions.length;
  const totalCheckIns = records.filter(r => r.status === 'present').length;
  const expectedCheckIns = totalSessions * totalStudents;
  const attendanceRate = expectedCheckIns > 0 ? (totalCheckIns / expectedCheckIns) * 100 : 0;
  
  return {
    totalSessions,
    totalCheckIns,
    totalStudents,
    expectedCheckIns,
    attendanceRate: Math.round(attendanceRate * 100) / 100
  };
};

/**
 * Get detailed attendance statistics by date
 * Returns attendance data for each session with student details
 */
export const getDetailedAttendanceStatistics = async (classId) => {
  const Class = (await import('../models/Class.js')).default;
  const Student = (await import('../models/Student.js')).default;
  
  // Get class info
  const classInfo = await Class.findById(classId).select('name');
  
  // Get all sessions for the class (sorted from oldest to newest)
  const sessions = await AttendanceSession.find({
    classId,
    isDeleted: false
  }).populate('scheduleId').sort({ date: 1 });
  
  // Get all enrolled students
  const enrollments = await Enrollment.find({ classId }).populate({
    path: 'studentId',
    select: 'name email studentCode'
  });
  
  const totalStudents = enrollments.length;
  const allStudents = enrollments.map(e => e.studentId);
  
  // Build detailed statistics for each session
  const detailedStats = await Promise.all(
    sessions.map(async (session) => {
      // Get attendance records for this session
      const records = await AttendanceRecord.find({
        sessionId: session._id,
        status: 'present'
      }).populate('studentId', 'name email studentCode');
      
      const attendedStudentIds = records.map(r => r.studentId._id.toString());
      
      // Separate attended and absent students
      const attendedStudents = records.map(r => ({
        _id: r.studentId._id,
        name: r.studentId.name,
        email: r.studentId.email,
        studentCode: r.studentId.studentCode,
        checkedAt: r.checkedAt
      }));
      
      const absentStudents = allStudents
        .filter(s => !attendedStudentIds.includes(s._id.toString()))
        .map(s => ({
          _id: s._id,
          name: s.name,
          email: s.email,
          studentCode: s.studentCode
        }));
      
      const attendanceRate = totalStudents > 0 
        ? Math.round((attendedStudents.length / totalStudents) * 100) 
        : 0;
      
      return {
        sessionId: session._id,
        date: session.date,
        dayOfWeek: new Date(session.date).getDay(),
        startTime: session.startTime,
        endTime: session.endTime,
        room: session.scheduleId?.room || '-',
        totalStudents,
        studentsAttended: attendedStudents.length,
        studentsAbsent: absentStudents.length,
        attendanceRate,
        attendedStudents,
        absentStudents
      };
    })
  );
  
  return {
    className: classInfo?.name || 'Unknown',
    totalStudents,
    sessions: detailedStats
  };
};

/**
 * Calculate attendance rate for a class
 * Returns percentage of students who attended vs expected
 */
export const calculateAttendanceRate = async (classId) => {
  const stats = await calculateOverallStatistics(classId);
  return {
    classId,
    attendanceRate: stats.attendanceRate,
    totalSessions: stats.totalSessions,
    totalCheckIns: stats.totalCheckIns
  };
};

/**
 * Get attendance rates for all classes taught by a teacher
 * Returns array of class attendance statistics
 */
export const getTeacherClassesAttendanceRate = async (teacherId) => {
  const Class = (await import('../models/Class.js')).default;
  
  // Find all classes taught by this teacher
  const classes = await Class.find({
    teacherId,
    isDeleted: false
  }).select('_id name code');
  
  // Calculate attendance rate for each class
  const rates = await Promise.all(
    classes.map(async (cls) => {
      const stats = await calculateOverallStatistics(cls._id);
      return {
        classId: cls._id,
        className: cls.name,
        classCode: cls.code,
        attendanceRate: stats.attendanceRate,
        totalSessions: stats.totalSessions,
        totalCheckIns: stats.totalCheckIns,
        totalStudents: stats.totalStudents
      };
    })
  );
  
  return rates;
};

export default {
  validateCheckInEligibility,
  checkInStudent,
  getStudentAttendanceStatus,
  getAttendanceReport,
  calculateStatistics,
  calculateOverallStatistics,
  getDetailedAttendanceStatistics,
  calculateAttendanceRate,
  getTeacherClassesAttendanceRate
};
