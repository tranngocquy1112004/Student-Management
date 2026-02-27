import AttendanceSession from '../models/AttendanceSession.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import Enrollment from '../models/Enrollment.js';
import Class from '../models/Class.js';

/**
 * AttendanceService
 * Business logic for attendance calculations and statistics
 */
class AttendanceService {
  /**
   * Calculate attendance statistics for a class
   * @param {ObjectId} classId
   * @returns {Promise<{className: string, totalStudents: number, studentsAttended: number}>}
   */
  async calculateStatistics(classId) {
    // Get class info
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Get total enrolled students
    const totalStudents = await Enrollment.countDocuments({ classId });

    // Get today's sessions
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todaySessions = await AttendanceSession.find({
      classId,
      date: { $gte: startOfDay, $lte: endOfDay },
      isDeleted: false
    });

    // Get distinct students who attended today
    let studentsAttended = 0;
    if (todaySessions.length > 0) {
      const sessionIds = todaySessions.map(s => s._id);
      const attendedStudentIds = await AttendanceRecord.distinct('studentId', {
        sessionId: { $in: sessionIds },
        status: 'present'
      });
      studentsAttended = attendedStudentIds.length;
    }

    return {
      className: classInfo.name,
      totalStudents,
      studentsAttended
    };
  }

  /**
   * Calculate attendance rate for a class
   * @param {ObjectId} classId
   * @returns {Promise<{classId: ObjectId, className: string, rate: number, attended: number, total: number}>}
   */
  async calculateAttendanceRate(classId) {
    // Get class info
    const classInfo = await Class.findById(classId);
    if (!classInfo) {
      throw new Error('Class not found');
    }

    // Get total sessions
    const totalSessions = await AttendanceSession.countDocuments({
      classId,
      isDeleted: false
    });

    // Get total enrolled students
    const totalStudents = await Enrollment.countDocuments({ classId });

    // Handle edge cases
    if (totalSessions === 0 || totalStudents === 0) {
      return {
        classId,
        className: classInfo.name,
        rate: 0,
        attended: 0,
        total: totalSessions * totalStudents
      };
    }

    // Get all sessions for this class
    const sessions = await AttendanceSession.find({
      classId,
      isDeleted: false
    });
    const sessionIds = sessions.map(s => s._id);

    // Count attendance records with status 'present'
    const attendedCount = await AttendanceRecord.countDocuments({
      sessionId: { $in: sessionIds },
      status: 'present'
    });

    // Calculate rate: (attended / (sessions × students)) × 100
    const totalPossible = totalSessions * totalStudents;
    const rate = (attendedCount / totalPossible) * 100;

    return {
      classId,
      className: classInfo.name,
      rate: Math.round(rate * 100) / 100, // Round to 2 decimal places
      attended: attendedCount,
      total: totalPossible
    };
  }

  /**
   * Get attendance rate for all classes of a teacher
   * @param {ObjectId} teacherId
   * @returns {Promise<Array>}
   */
  async getTeacherClassesAttendanceRate(teacherId) {
    // Get all classes for this teacher
    const classes = await Class.find({
      teacherId,
      isDeleted: false
    });

    // Calculate rate for each class
    const rates = await Promise.all(
      classes.map(cls => this.calculateAttendanceRate(cls._id))
    );

    return rates;
  }
}

export default new AttendanceService();
