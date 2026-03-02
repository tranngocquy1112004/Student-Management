import mongoose from 'mongoose';
import ExpulsionRecord from '../models/ExpulsionRecord.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Schedule from '../models/Schedule.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import Gradebook from '../models/Gradebook.js';
import emailService from './emailService.js';

class ExpulsionService {
  /**
   * Create expulsion record and trigger all side effects
   */
  async createExpulsion(adminId, expulsionData) {
    try {
      const { studentId, reason, reasonType, effectiveDate, attachments, notes } = expulsionData;

      // Validate student exists
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) {
        throw new Error('Student not found');
      }

      // Check if student is already dismissed
      if (student.status === 'dismissed') {
        throw new Error('Student is already dismissed');
      }

      // Create ExpulsionRecord
      const expulsionRecord = new ExpulsionRecord({
        studentId,
        reason,
        reasonType,
        effectiveDate: new Date(effectiveDate),
        attachments: attachments || [],
        notes,
        status: 'active',
        appealStatus: 'none',
        createdBy: adminId
      });

      await expulsionRecord.save();

      // Update User status to 'dismissed'
      student.status = 'dismissed';
      await student.save();

      // Terminate all active sessions
      await this.terminateStudentSessions(studentId);

      // Cancel future schedules
      await this.cancelFutureSchedules(studentId, effectiveDate);

      // Lock pending assignments
      await this.lockPendingAssignments(studentId, effectiveDate, expulsionRecord._id);

      // Mark gradebook
      await this.markGradebook(studentId, expulsionRecord._id);

      // Send email notification (async, don't wait)
      this.sendExpulsionEmail(expulsionRecord, student).catch(err => {
        console.error('Failed to send expulsion email:', err);
      });

      // Populate fields for response
      await expulsionRecord.populate([
        { path: 'studentId', select: 'name email studentCode' },
        { path: 'createdBy', select: 'name email' }
      ]);

      return expulsionRecord;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get expulsion list with filters and pagination
   */
  async getExpulsionList(filters = {}, pagination = {}) {
    const { status, reasonType, startDate, endDate } = filters;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

    const query = {};

    if (status) query.status = status;
    if (reasonType) query.reasonType = reasonType;
    if (startDate || endDate) {
      query.effectiveDate = {};
      if (startDate) query.effectiveDate.$gte = new Date(startDate);
      if (endDate) query.effectiveDate.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [expulsions, total] = await Promise.all([
      ExpulsionRecord.find(query)
        .populate('studentId', 'name email studentCode')
        .populate('createdBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ExpulsionRecord.countDocuments(query)
    ]);

    return {
      data: expulsions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    };
  }

  /**
   * Get expulsion details by ID
   */
  async getExpulsionById(expulsionId) {
    const expulsion = await ExpulsionRecord.findById(expulsionId)
      .populate('studentId', 'name email studentCode phone')
      .populate('createdBy', 'name email')
      .populate('appealReviewedBy', 'name email')
      .lean();

    if (!expulsion) {
      throw new Error('Expulsion record not found');
    }

    return expulsion;
  }

  /**
   * Get expulsion by student ID
   */
  async getExpulsionByStudentId(studentId) {
    const expulsion = await ExpulsionRecord.findOne({ studentId })
      .populate('createdBy', 'name email')
      .populate('appealReviewedBy', 'name email')
      .lean();

    return expulsion;
  }

  /**
   * Terminate all active sessions for expelled student
   */
  async terminateStudentSessions(studentId) {
    // Delete all refresh tokens
    await RefreshToken.deleteMany({ userId: studentId });
    
    // Note: Active JWT tokens will be invalidated by checking user status in auth middleware
    return true;
  }

  /**
   * Cancel future schedules for expelled student
   */
  async cancelFutureSchedules(studentId, effectiveDate) {
    const effectiveDateObj = new Date(effectiveDate);

    // Update enrollments for future schedules
    await Enrollment.updateMany(
      {
        studentId,
        status: 'active'
      },
      {
        $set: {
          cancelledAt: new Date(),
          cancelReason: 'expulsion'
        }
      }
    );

    // Note: We don't delete schedules, just mark enrollments as cancelled
    return true;
  }

  /**
   * Lock pending assignments for expelled student
   */
  async lockPendingAssignments(studentId, effectiveDate, expulsionRecordId) {
    const effectiveDateObj = new Date(effectiveDate);

    // Find all assignments with deadline after effective date
    const assignments = await Assignment.find({
      deadline: { $gt: effectiveDateObj },
      isDeleted: false
    });

    // Add student to lockedStudents array for each assignment
    for (const assignment of assignments) {
      const alreadyLocked = assignment.lockedStudents?.some(
        ls => ls.studentId.toString() === studentId.toString()
      );

      if (!alreadyLocked) {
        assignment.lockedStudents = assignment.lockedStudents || [];
        assignment.lockedStudents.push({
          studentId,
          lockedAt: new Date(),
          reason: 'expulsion'
        });
        await assignment.save();
      }
    }

    return true;
  }

  /**
   * Mark gradebook entries for expelled student
   */
  async markGradebook(studentId, expulsionRecordId) {
    await Gradebook.updateMany(
      { studentId },
      {
        $set: {
          'dismissedMarker.isDismissed': true,
          'dismissedMarker.dismissedAt': new Date(),
          'dismissedMarker.expulsionRecordId': expulsionRecordId
        }
      }
    );

    return true;
  }

  /**
   * Send expulsion notification email
   */
  async sendExpulsionEmail(expulsionRecord, student) {
    try {
      await emailService.sendExpulsionNotification({
        to: student.email,
        studentName: student.name,
        reason: expulsionRecord.reason,
        reasonType: expulsionRecord.reasonType,
        effectiveDate: expulsionRecord.effectiveDate
      });

      // Update emailSentAt
      expulsionRecord.emailSentAt = new Date();
      await expulsionRecord.save();

      return true;
    } catch (error) {
      console.error('Failed to send expulsion email:', error);
      return false;
    }
  }
}

export default new ExpulsionService();
