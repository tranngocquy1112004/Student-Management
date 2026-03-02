import mongoose from 'mongoose';
import ExpulsionRecord from '../models/ExpulsionRecord.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Assignment from '../models/Assignment.js';
import Gradebook from '../models/Gradebook.js';
import emailService from './emailService.js';

class AppealService {
  /**
   * Submit appeal for expulsion
   */
  async submitAppeal(studentId, expulsionId, appealData) {
    const { appealReason, appealEvidence } = appealData;

    // Find expulsion record
    const expulsion = await ExpulsionRecord.findById(expulsionId);
    
    if (!expulsion) {
      throw new Error('Expulsion record not found');
    }

    // Verify expulsion belongs to student
    if (expulsion.studentId.toString() !== studentId.toString()) {
      throw new Error('Unauthorized: This expulsion does not belong to you');
    }

    // Check if appeal already submitted
    if (expulsion.appealStatus !== 'none') {
      throw new Error('Appeal already submitted');
    }

    // Update expulsion with appeal data
    expulsion.appealStatus = 'pending';
    expulsion.appealReason = appealReason;
    expulsion.appealEvidence = appealEvidence || [];
    expulsion.appealSubmittedAt = new Date();

    await expulsion.save();

    // Send notification to admin
    await this.sendAppealSubmittedNotification(expulsion);

    return expulsion;
  }

  /**
   * Approve appeal and restore student access
   */
  async approveAppeal(adminId, expulsionId, reviewNote) {
    try {
      // Find expulsion record
      const expulsion = await ExpulsionRecord.findById(expulsionId);
      
      if (!expulsion) {
        throw new Error('Expulsion record not found');
      }

      // Check if appeal is pending
      if (expulsion.appealStatus !== 'pending') {
        throw new Error('Appeal is not in pending status');
      }

      // Update expulsion record
      expulsion.status = 'revoked';
      expulsion.appealStatus = 'approved';
      expulsion.appealReviewedBy = adminId;
      expulsion.appealReviewedAt = new Date();
      expulsion.appealReviewNote = reviewNote;

      await expulsion.save();

      // Update student status to active
      await User.findByIdAndUpdate(
        expulsion.studentId,
        { status: 'active' }
      );

      // Restore student access
      await this.restoreStudentAccess(expulsion.studentId, expulsionId);

      // Send notification to student
      await this.sendAppealApprovedNotification(expulsion);

      return expulsion;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject appeal
   */
  async rejectAppeal(adminId, expulsionId, reviewNote) {
    // Find expulsion record
    const expulsion = await ExpulsionRecord.findById(expulsionId);
    
    if (!expulsion) {
      throw new Error('Expulsion record not found');
    }

    // Check if appeal is pending
    if (expulsion.appealStatus !== 'pending') {
      throw new Error('Appeal is not in pending status');
    }

    // Update expulsion record
    expulsion.appealStatus = 'rejected';
    expulsion.appealReviewedBy = adminId;
    expulsion.appealReviewedAt = new Date();
    expulsion.appealReviewNote = reviewNote;

    await expulsion.save();

    // Student status remains 'dismissed'

    // Send notification to student
    await this.sendAppealRejectedNotification(expulsion);

    return expulsion;
  }

  /**
   * Restore student access after appeal approval
   */
  async restoreStudentAccess(studentId, expulsionRecordId) {
    // Unlock assignments
    await this.unlockAssignments(studentId);

    // Restore class rosters
    await this.restoreClassRosters(studentId);

    // Remove dismissed markers from gradebook
    await this.removeDismissedMarkers(studentId);

    return true;
  }

  /**
   * Unlock assignments for restored student
   */
  async unlockAssignments(studentId) {
    // Find all assignments with this student in lockedStudents
    const assignments = await Assignment.find({
      'lockedStudents.studentId': studentId
    });

    // Remove student from lockedStudents array
    for (const assignment of assignments) {
      assignment.lockedStudents = assignment.lockedStudents.filter(
        ls => ls.studentId.toString() !== studentId.toString()
      );
      await assignment.save();
    }

    return true;
  }

  /**
   * Restore student to class rosters
   */
  async restoreClassRosters(studentId) {
    // Find all enrollments that were cancelled due to expulsion
    await Enrollment.updateMany(
      {
        studentId,
        cancelReason: 'expulsion'
      },
      {
        $unset: {
          cancelledAt: '',
          cancelReason: ''
        }
      }
    );

    return true;
  }

  /**
   * Remove dismissed markers from gradebook
   */
  async removeDismissedMarkers(studentId) {
    await Gradebook.updateMany(
      { studentId },
      {
        $set: {
          'dismissedMarker.isDismissed': false,
          'dismissedMarker.dismissedAt': null,
          'dismissedMarker.expulsionRecordId': null
        }
      }
    );

    return true;
  }

  /**
   * Send appeal submitted notification to admin
   */
  async sendAppealSubmittedNotification(expulsion) {
    try {
      const student = await User.findById(expulsion.studentId);
      
      await emailService.sendAppealSubmittedNotification({
        studentName: student.name,
        studentEmail: student.email,
        appealReason: expulsion.appealReason,
        expulsionId: expulsion._id
      });
    } catch (error) {
      console.error('Failed to send appeal submitted notification:', error);
    }
  }

  /**
   * Send appeal approved notification to student
   */
  async sendAppealApprovedNotification(expulsion) {
    try {
      const student = await User.findById(expulsion.studentId);
      
      await emailService.sendAppealApprovedNotification({
        to: student.email,
        studentName: student.name,
        reviewNote: expulsion.appealReviewNote
      });
    } catch (error) {
      console.error('Failed to send appeal approved notification:', error);
    }
  }

  /**
   * Send appeal rejected notification to student
   */
  async sendAppealRejectedNotification(expulsion) {
    try {
      const student = await User.findById(expulsion.studentId);
      
      await emailService.sendAppealRejectedNotification({
        to: student.email,
        studentName: student.name,
        reviewNote: expulsion.appealReviewNote
      });
    } catch (error) {
      console.error('Failed to send appeal rejected notification:', error);
    }
  }
}

export default new AppealService();
