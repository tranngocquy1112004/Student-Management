import AcademicLeave from '../models/AcademicLeave.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import { sendLeaveApprovalEmail, sendLeaveRejectionEmail } from './emailService.js';

/**
 * LeaveService
 * Business logic for academic leave management
 */
class LeaveService {
  /**
   * Submit a new leave request
   * @param {ObjectId} studentId - The ID of the student submitting the request
   * @param {Object} requestData - The leave request data
   * @param {string} requestData.reason - The reason for leave (enum)
   * @param {string} requestData.reasonText - Detailed explanation
   * @param {Date|string} requestData.startDate - Leave start date
   * @param {Date|string} requestData.endDate - Leave end date
   * @returns {Promise<AcademicLeave>} The created leave request
   * @throws {Error} If validation fails or business rules are violated
   */
  async submitLeaveRequest(studentId, requestData) {
    const { reason, reasonText, startDate, endDate } = requestData;

    // 1. Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    
    // Set time to start of day for comparison
    now.setHours(0, 0, 0, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    
    // Requirement 4.4: Validate startDate is not in the past
    if (start < now) {
      throw new Error('Ngày bắt đầu không thể là quá khứ');
    }
    
    // Requirement 4.3: Validate startDate is before endDate
    if (start >= end) {
      throw new Error('Ngày bắt đầu phải trước ngày kết thúc');
    }
    
    // 2. Check user status (Requirement 4.6)
    const user = await User.findById(studentId);
    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }
    
    if (user.status === 'on_leave') {
      throw new Error('Bạn đang trong thời gian bảo lưu');
    }
    
    // 3. Check for existing pending request (Requirement 4.5)
    const existingRequest = await AcademicLeave.findOne({
      studentId,
      status: 'pending'
    });
    
    if (existingRequest) {
      throw new Error('Bạn đã có đơn xin bảo lưu đang chờ duyệt');
    }
    
    // 4. Create leave request (Requirement 4.1, 4.7)
    const leaveRequest = await AcademicLeave.create({
      studentId,
      reason,
      reasonText,
      startDate: start,
      endDate: end,
      status: 'pending'
    });
    
    return leaveRequest;
  }

  /**
   * Approve a leave request
   * @param {ObjectId} leaveId - The ID of the leave request to approve
   * @param {ObjectId} adminId - The ID of the admin approving the request
   * @param {string} reviewNote - Optional note from the admin
   * @returns {Promise<AcademicLeave>} The updated leave request
   * @throws {Error} If validation fails or business rules are violated
   */
  async approveLeaveRequest(leaveId, adminId, reviewNote) {
    // 1. Find and validate leave request (Requirement 6.8)
    const leaveRequest = await AcademicLeave.findById(leaveId).populate('studentId', 'name email');
    
    if (!leaveRequest) {
      throw new Error('Không tìm thấy đơn xin bảo lưu');
    }
    
    if (leaveRequest.status !== 'pending') {
      throw new Error('Đơn này đã được xử lý');
    }
    
    // 2. Update leave request (Requirement 6.1, 6.4, 6.5, 6.6)
    leaveRequest.status = 'approved';
    leaveRequest.reviewedBy = adminId;
    leaveRequest.reviewedAt = new Date();
    if (reviewNote) {
      leaveRequest.reviewNote = reviewNote;
    }
    await leaveRequest.save();
    
    // 3. Update user status (Requirement 6.2)
    await User.findByIdAndUpdate(leaveRequest.studentId._id, {
      status: 'on_leave'
    });
    
    // 4. Update all active enrollments (Requirement 6.3)
    await Enrollment.updateMany(
      {
        studentId: leaveRequest.studentId._id,
        status: 'active'
      },
      {
        status: 'on_leave'
      }
    );
    
    // 5. Send approval email (async, non-blocking) (Requirement 6.7)
    sendLeaveApprovalEmail(leaveRequest, adminId).catch(err => {
      console.error('Email sending failed:', err);
    });
    
    return leaveRequest;
  }

  /**
   * Reject a leave request
   * @param {ObjectId} leaveId - The ID of the leave request to reject
   * @param {ObjectId} adminId - The ID of the admin rejecting the request
   * @param {string} reviewNote - Required note explaining the rejection reason
   * @returns {Promise<AcademicLeave>} The updated leave request
   * @throws {Error} If validation fails or business rules are violated
   */
  async rejectLeaveRequest(leaveId, adminId, reviewNote) {
    // 1. Validate reviewNote is provided (Requirement 7.4)
    if (!reviewNote || reviewNote.trim().length === 0) {
      throw new Error('Vui lòng nhập lý do từ chối');
    }
    
    // 2. Find and validate leave request (Requirement 7.8)
    const leaveRequest = await AcademicLeave.findById(leaveId).populate('studentId', 'name email');
    
    if (!leaveRequest) {
      throw new Error('Không tìm thấy đơn xin bảo lưu');
    }
    
    if (leaveRequest.status !== 'pending') {
      throw new Error('Đơn này đã được xử lý');
    }
    
    // 3. Update leave request (Requirement 7.1, 7.2, 7.3)
    // Do NOT modify user status or enrollment status (Requirement 7.6, 7.7)
    leaveRequest.status = 'rejected';
    leaveRequest.reviewedBy = adminId;
    leaveRequest.reviewedAt = new Date();
    leaveRequest.reviewNote = reviewNote;
    await leaveRequest.save();
    
    // 4. Send rejection email (async, non-blocking) (Requirement 7.5)
    sendLeaveRejectionEmail(leaveRequest, adminId).catch(err => {
      console.error('Email sending failed:', err);
    });
    
    return leaveRequest;
  }

  /**
   * Count leave requests matching a query
   * @param {Object} query - MongoDB query object
   * @returns {Promise<number>} The count of matching documents
   */
  async countLeaveRequests(query) {
    return await AcademicLeave.countDocuments(query);
  }

  /**
   * Get pending leave requests with pagination
   * @param {Object} query - MongoDB query object
   * @param {number} skip - Number of documents to skip
   * @param {number} limit - Maximum number of documents to return
   * @returns {Promise<Array<AcademicLeave>>} Array of leave requests
   */
  async getPendingLeaveRequests(query, skip, limit) {
    // Requirement 5.1, 5.2: Query pending requests and populate student info
    // Requirement 5.3: Sort by createdAt ascending (oldest first)
    return await AcademicLeave.find(query)
      .populate('studentId', 'studentCode name email')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Get all leave requests for a specific student
   * @param {ObjectId} studentId - The ID of the student
   * @returns {Promise<Array<AcademicLeave>>} Array of leave requests
   */
  async getStudentLeaveRequests(studentId) {
    // Requirement 8.1: Query all leave requests for the student
    // Requirement 8.2: Populate reviewedBy admin information
    // Requirement 8.4: Sort by createdAt descending (newest first)
    return await AcademicLeave.find({ studentId })
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 });
  }
}

export default new LeaveService();
