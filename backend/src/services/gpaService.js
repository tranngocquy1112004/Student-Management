import Submission from '../models/Submission.js';
import Assignment from '../models/Assignment.js';
import Enrollment from '../models/Enrollment.js';
import AcademicWarning from '../models/AcademicWarning.js';
import Student from '../models/Student.js';

/**
 * Convert score from 10-point scale to 4.0 GPA scale
 * @param {number} score - Score on 10-point scale
 * @returns {number} - GPA on 4.0 scale
 */
const convertTo4PointScale = (score) => {
  if (score >= 8.5) return 4.0;
  if (score >= 8.0) return 3.5;
  if (score >= 7.0) return 3.0;
  if (score >= 6.5) return 2.5;
  if (score >= 5.5) return 2.0;
  if (score >= 5.0) return 1.5;
  if (score >= 4.0) return 1.0;
  return 0.0;
};

/**
 * Calculate GPA for a student based on assignment scores
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - GPA data
 */
export const calculateStudentGPA = async (studentId) => {
  try {
    // Get all classes the student is enrolled in
    const enrollments = await Enrollment.find({ studentId }).distinct('classId');
    
    if (enrollments.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        completedAssignments: 0,
        averageScore: 0
      };
    }
    
    // Get all published assignments from enrolled classes
    const assignments = await Assignment.find({
      classId: { $in: enrollments },
      status: 'published',
      isDeleted: false
    }).lean();
    
    if (assignments.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        completedAssignments: 0,
        averageScore: 0
      };
    }
    
    const assignmentIds = assignments.map(a => a._id);
    
    // Get all graded submissions for this student
    const submissions = await Submission.find({
      studentId,
      assignmentId: { $in: assignmentIds },
      status: 'graded'
    }).lean();
    
    if (submissions.length === 0) {
      return {
        gpa: 0,
        totalCredits: 0,
        completedAssignments: 0,
        averageScore: 0
      };
    }
    
    // Calculate average score on 10-point scale
    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const averageScore = totalScore / submissions.length;
    
    // Convert to 4.0 scale
    const gpa = convertTo4PointScale(averageScore);
    
    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCredits: submissions.length,
      completedAssignments: submissions.length,
      averageScore: Math.round(averageScore * 100) / 100
    };
  } catch (error) {
    throw new Error(`Error calculating GPA: ${error.message}`);
  }
};

/**
 * Check and create academic warning if GPA < 2.0
 * @param {string} studentId - Student ID
 * @param {number} gpa - Current GPA
 * @returns {Promise<Object>} - Warning result
 */
export const checkAndCreateGPAWarning = async (studentId, gpa) => {
  try {
    // Only create warning if GPA < 2.0
    if (gpa >= 2.0) {
      return { warningCreated: false, message: 'GPA is acceptable' };
    }
    
    // Get student info
    const student = await Student.findOne({ userId: studentId })
      .populate('userId', 'name email')
      .lean();
    
    if (!student) {
      return { warningCreated: false, message: 'Student not found' };
    }
    
    // Check if there's already an active warning for low GPA this semester
    const now = new Date();
    const semesterStart = new Date(now.getFullYear(), now.getMonth() < 6 ? 0 : 6, 1);
    
    const existingWarning = await AcademicWarning.findOne({
      studentId: student._id,
      type: 'gpa',
      status: 'active',
      createdAt: { $gte: semesterStart }
    });
    
    if (existingWarning) {
      return { warningCreated: false, message: 'Warning already exists for this semester' };
    }
    
    // Create new warning
    const warning = await AcademicWarning.create({
      studentId: student._id,
      type: 'gpa',
      reason: `GPA thấp: ${gpa}/4.0 (dưới mức tối thiểu 2.0)`,
      semester: now.getMonth() < 6 ? 1 : 2,
      year: now.getFullYear(),
      status: 'active',
      issuedDate: now
    });
    
    return {
      warningCreated: true,
      warning,
      message: `Academic warning created for GPA ${gpa}`
    };
  } catch (error) {
    throw new Error(`Error creating GPA warning: ${error.message}`);
  }
};

/**
 * Update student GPA after grading a submission
 * @param {string} studentId - Student ID
 * @returns {Promise<Object>} - Updated GPA data
 */
export const updateStudentGPAAfterGrading = async (studentId) => {
  try {
    // Calculate new GPA
    const gpaData = await calculateStudentGPA(studentId);
    
    // Check if warning is needed
    const warningResult = await checkAndCreateGPAWarning(studentId, gpaData.gpa);
    
    return {
      ...gpaData,
      warningResult
    };
  } catch (error) {
    throw new Error(`Error updating GPA: ${error.message}`);
  }
};

export default {
  calculateStudentGPA,
  checkAndCreateGPAWarning,
  updateStudentGPAAfterGrading,
  convertTo4PointScale
};
