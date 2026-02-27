import User from '../models/User.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Faculty from '../models/Faculty.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import Submission from '../models/Submission.js';
import Gradebook from '../models/Gradebook.js';
import AttendanceRecord from '../models/AttendanceRecord.js';
import AttendanceSession from '../models/AttendanceSession.js';

const getGradeDistribution = (submissions) => {
  const dist = { gioi: 0, kha: 0, trungBinh: 0, yeu: 0 };
  
  // Nhóm các bài tập theo sinh viên và tính điểm trung bình
  const studentAverages = {};
  submissions.forEach((s) => {
    if (s.status === 'graded' && s.score != null) {
      if (!studentAverages[s.studentId]) {
        studentAverages[s.studentId] = [];
      }
      studentAverages[s.studentId].push(s.score);
    }
  });
  
  // Tính điểm trung bình cho mỗi sinh viên
  const averages = Object.values(studentAverages).map(scores => {
    const sum = scores.reduce((a, b) => a + b, 0);
    return sum / scores.length;
  });
  
  // Phân loại theo điểm trung bình
  averages.forEach((avg) => {
    if (avg >= 8) dist.gioi += 1;
    else if (avg >= 6.5) dist.kha += 1;
    else if (avg >= 5) dist.trungBinh += 1;
    else dist.yeu += 1;
  });
  
  return dist;
};

export const getAdminDashboard = async (req, res) => {
  try {
    const [totalUsers, totalClasses, totalSubjects, totalFaculties, usersByRole, classesByStatus, gradebooks] = await Promise.all([
      User.countDocuments({ isDeleted: false }),
      Class.countDocuments({ isDeleted: false }),
      Subject.countDocuments({ isDeleted: false }),
      Faculty.countDocuments({ isDeleted: false }),
      User.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$role', count: { $sum: 1 } } }]),
      Class.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Gradebook.find({ isDeleted: false }).select('total').lean(),
    ]);
    const gradeDistribution = getGradeDistribution(gradebooks);
    res.json({
      success: true,
      data: {
        totalUsers,
        totalClasses,
        totalSubjects,
        totalFaculties,
        usersByRole: usersByRole.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
        classesByStatus: classesByStatus.reduce((a, b) => ({ ...a, [b._id]: b.count }), {}),
        gradeDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherDashboard = async (req, res) => {
  try {
    const classes = await Class.find({ teacherId: req.user._id, isDeleted: false });
    const classIds = classes.map(c => c._id);
    const totalStudents = await Enrollment.countDocuments({ classId: { $in: classIds } });
    const assignments = await Assignment.find({ classId: { $in: classIds }, isDeleted: false, status: 'published' });
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } });
    const graded = submissions.filter(s => s.status === 'graded').length;
    const pending = submissions.filter(s => s.status !== 'graded').length;
    const sessions = await AttendanceSession.find({ classId: { $in: classIds }, isDeleted: false });
    const records = await AttendanceRecord.find({ sessionId: { $in: sessions.map(s => s._id) } });
    const attendRate = sessions.length > 0 ? Math.round((records.filter(r => r.status === 'present').length / (sessions.length * Math.max(totalStudents, 1))) * 100) : 0;
    const gradeDistribution = getGradeDistribution(submissions);
    res.json({
      success: true,
      data: {
        totalClasses: classes.length,
        totalStudents,
        assignmentsGraded: graded,
        assignmentsPending: pending,
        attendRate,
        gradeDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDashboard = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ studentId: req.user._id }).distinct('classId');
    const gradebook = await Gradebook.find({ classId: { $in: enrollments }, studentId: req.user._id, isDeleted: false });
    const gpa = gradebook.length > 0
      ? gradebook.reduce((a, b) => a + (b.total || 0), 0) / gradebook.length
      : 0;
    const assignments = await Assignment.find({ classId: { $in: enrollments }, status: 'published', isDeleted: false, deadline: { $gt: new Date() } }).sort({ deadline: 1 }).limit(5);
    const submissions = await Submission.find({ studentId: req.user._id, assignmentId: { $in: assignments.map(a => a._id) } });
    const submittedCount = submissions.filter(s => s.status !== 'graded').length;
    const sessions = await AttendanceSession.find({ classId: { $in: enrollments }, isDeleted: false });
    const records = await AttendanceRecord.find({ sessionId: { $in: sessions.map(s => s._id) }, studentId: req.user._id });
    const attendRate = sessions.length > 0 ? Math.round((records.filter(r => r.status === 'present').length / sessions.length) * 100) : 0;
    res.json({
      success: true,
      data: {
        gpa: Math.round(gpa * 100) / 100,
        totalClasses: enrollments.length,
        upcomingAssignments: assignments,
        submitProgress: { total: assignments.length, submitted: submittedCount },
        attendRate,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
