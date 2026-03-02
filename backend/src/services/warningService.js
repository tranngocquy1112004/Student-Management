import AcademicWarning from '../models/AcademicWarning.js';
import AttendanceWarning from '../models/AttendanceWarning.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import Gradebook from '../models/Gradebook.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import AttendanceSession from '../models/AttendanceSession.js';
import emailService from './emailService.js';

class WarningService {
  /**
   * Check and create academic warning if needed
   */
  async checkAcademicWarning(studentId, semester) {
    try {
      // Calculate GPA for the semester
      const gpa = await this.calculateGPA(studentId, semester);
      const threshold = 4.0;

      // Check if GPA is below threshold
      if (gpa >= threshold) {
        return null; // No warning needed
      }

      // Count consecutive semesters with low GPA
      const warningLevel = await this.determineAcademicWarningLevel(studentId, semester, gpa, threshold);

      // Check if warning already exists for this semester and level
      const existingWarning = await AcademicWarning.findOne({
        studentId,
        semester,
        warningLevel
      });

      if (existingWarning) {
        return existingWarning; // Warning already exists
      }

      // Create new academic warning
      const warning = new AcademicWarning({
        studentId,
        warningType: 'low_gpa',
        warningLevel,
        gpa,
        threshold,
        semester,
        createdBy: null // System-generated
      });

      await warning.save();

      // Send notifications
      await this.sendAcademicWarningNotifications(warning);

      return warning;
    } catch (error) {
      console.error('Error checking academic warning:', error);
      throw error;
    }
  }

  /**
   * Determine academic warning level based on consecutive semesters
   */
  async determineAcademicWarningLevel(studentId, currentSemester, gpa, threshold) {
    // Get all previous warnings for this student
    const previousWarnings = await AcademicWarning.find({
      studentId,
      semester: { $ne: currentSemester }
    }).sort({ createdAt: -1 }).limit(2);

    // If no previous warnings, this is level 1
    if (previousWarnings.length === 0) {
      return 1;
    }

    // If 1 previous warning, this is level 2
    if (previousWarnings.length === 1) {
      return 2;
    }

    // If 2 or more previous warnings, this is level 3
    return 3;
  }

  /**
   * Check and create attendance warning if needed
   */
  async checkAttendanceWarning(studentId, classId) {
    try {
      // Calculate absence rate
      const { absenceRate, totalSessions, absentSessions } = await this.calculateAbsenceRate(studentId, classId);

      let warningLevel = null;

      // Determine warning level
      if (absenceRate > 30) {
        warningLevel = 'critical';
      } else if (absenceRate > 20) {
        warningLevel = 'warning';
      } else {
        return null; // No warning needed
      }

      // Check if warning already exists
      const existingWarning = await AttendanceWarning.findOne({
        studentId,
        classId,
        warningLevel
      });

      if (existingWarning) {
        return existingWarning;
      }

      // Create new attendance warning
      const warning = new AttendanceWarning({
        studentId,
        classId,
        absenceRate,
        totalSessions,
        absentSessions,
        warningLevel
      });

      await warning.save();

      // Send notifications
      await this.sendAttendanceWarningNotifications(warning);

      return warning;
    } catch (error) {
      console.error('Error checking attendance warning:', error);
      throw error;
    }
  }

  /**
   * Calculate student GPA for a semester
   */
  async calculateGPA(studentId, semester) {
    // Get all gradebooks for student in this semester
    // Note: This is a simplified calculation. In a real system, you'd need to:
    // 1. Get all classes for the semester
    // 2. Get gradebook entries for those classes
    // 3. Calculate weighted average based on credits

    const gradebooks = await Gradebook.find({
      studentId,
      isDeleted: false
    }).populate({
      path: 'classId',
      select: 'semester'
    });

    // Filter by semester (assuming semester is stored in Class model)
    const semesterGradebooks = gradebooks.filter(gb => {
      return gb.classId && gb.classId.semester === semester;
    });

    if (semesterGradebooks.length === 0) {
      return 0;
    }

    // Calculate average of total scores
    const totalScore = semesterGradebooks.reduce((sum, gb) => sum + (gb.total || 0), 0);
    const gpa = totalScore / semesterGradebooks.length;

    return Math.round(gpa * 100) / 100;
  }

  /**
   * Calculate absence rate for a student in a class
   */
  async calculateAbsenceRate(studentId, classId) {
    // Get all attendance sessions for this class
    const sessions = await AttendanceSession.find({
      classId,
      status: 'completed'
    });

    const totalSessions = sessions.length;

    if (totalSessions === 0) {
      return { absenceRate: 0, totalSessions: 0, absentSessions: 0 };
    }

    // Count absent sessions
    const absentCount = await AttendanceRecord.countDocuments({
      sessionId: { $in: sessions.map(s => s._id) },
      studentId,
      status: 'absent'
    });

    const absenceRate = (absentCount / totalSessions) * 100;

    return {
      absenceRate: Math.round(absenceRate * 100) / 100,
      totalSessions,
      absentSessions: absentCount
    };
  }

  /**
   * Get warning list with filters
   */
  async getWarningList(filters = {}, pagination = {}) {
    const { type, level, studentId, startDate, endDate, page = 1, limit = 20 } = { ...filters, ...pagination };

    const skip = (page - 1) * limit;

    let academicWarnings = [];
    let attendanceWarnings = [];

    // Fetch academic warnings if requested
    if (!type || type === 'academic') {
      const academicQuery = {};
      if (studentId) academicQuery.studentId = studentId;
      if (level) academicQuery.warningLevel = parseInt(level);
      if (startDate || endDate) {
        academicQuery.createdAt = {};
        if (startDate) academicQuery.createdAt.$gte = new Date(startDate);
        if (endDate) academicQuery.createdAt.$lte = new Date(endDate);
      }

      academicWarnings = await AcademicWarning.find(academicQuery)
        .populate('studentId', 'name email studentCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    // Fetch attendance warnings if requested
    if (!type || type === 'attendance') {
      const attendanceQuery = {};
      if (studentId) attendanceQuery.studentId = studentId;
      if (level) attendanceQuery.warningLevel = level;
      if (startDate || endDate) {
        attendanceQuery.createdAt = {};
        if (startDate) attendanceQuery.createdAt.$gte = new Date(startDate);
        if (endDate) attendanceQuery.createdAt.$lte = new Date(endDate);
      }

      attendanceWarnings = await AttendanceWarning.find(attendanceQuery)
        .populate('studentId', 'name email studentCode')
        .populate('classId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
    }

    return {
      academicWarnings,
      attendanceWarnings
    };
  }

  /**
   * Get warnings for a specific student
   */
  async getStudentWarnings(studentId) {
    const [academicWarnings, attendanceWarnings] = await Promise.all([
      AcademicWarning.find({ studentId })
        .sort({ createdAt: -1 })
        .lean(),
      AttendanceWarning.find({ studentId })
        .populate('classId', 'name code')
        .sort({ createdAt: -1 })
        .lean()
    ]);

    return {
      academicWarnings,
      attendanceWarnings
    };
  }

  /**
   * Send academic warning notifications
   */
  async sendAcademicWarningNotifications(warning) {
    try {
      const student = await User.findById(warning.studentId);
      
      await emailService.sendAcademicWarningEmail({
        to: student.email,
        studentName: student.name,
        gpa: warning.gpa,
        threshold: warning.threshold,
        warningLevel: warning.warningLevel,
        semester: warning.semester
      });

      warning.notifiedAt = new Date();
      await warning.save();
    } catch (error) {
      console.error('Failed to send academic warning email:', error);
    }
  }

  /**
   * Send attendance warning notifications
   */
  async sendAttendanceWarningNotifications(warning) {
    try {
      const student = await User.findById(warning.studentId);
      const classInfo = await Class.findById(warning.classId);

      await emailService.sendAttendanceWarningEmail({
        to: student.email,
        studentName: student.name,
        className: classInfo.name,
        absenceRate: warning.absenceRate,
        warningLevel: warning.warningLevel
      });

      warning.notifiedAt = new Date();
      await warning.save();
    } catch (error) {
      console.error('Failed to send attendance warning email:', error);
    }
  }
}

export default new WarningService();
