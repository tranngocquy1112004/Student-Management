import leaveService from '../services/leaveService.js';

/**
 * Submit a new leave request
 * POST /students/leave/request
 * Requirements: 4.1-4.7, 11.2
 */
export const submitRequest = async (req, res) => {
  try {
    // Extract studentId from authenticated user
    const studentId = req.user._id;
    
    // Validate request body
    const { reason, reasonText, startDate, endDate } = req.body;
    
    // Check required fields
    if (!reason || !reasonText || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
        errors: {
          reason: !reason ? 'Vui lòng chọn lý do bảo lưu' : undefined,
          reasonText: !reasonText ? 'Vui lòng nhập chi tiết lý do' : undefined,
          startDate: !startDate ? 'Vui lòng chọn ngày bắt đầu' : undefined,
          endDate: !endDate ? 'Vui lòng chọn ngày kết thúc' : undefined
        }
      });
    }
    
    // Validate reasonText length
    if (reasonText.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Chi tiết lý do phải có ít nhất 20 ký tự'
      });
    }
    
    if (reasonText.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Chi tiết lý do không được vượt quá 1000 ký tự'
      });
    }
    
    // Call leaveService.submitLeaveRequest
    const leaveRequest = await leaveService.submitLeaveRequest(studentId, {
      reason,
      reasonText,
      startDate,
      endDate
    });
    
    // Return 201 with leave request data on success
    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Đơn xin bảo lưu đã được gửi thành công'
    });
    
  } catch (error) {
    // Handle validation errors and return appropriate error messages
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get pending leave requests (Admin only)
 * GET /admin/leave-requests
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 11.4
 */
export const getPendingRequests = async (req, res) => {
  try {
    // Extract pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Query AcademicLeave with status 'pending'
    const query = { status: 'pending' };
    
    // Get total count for pagination metadata
    const total = await leaveService.countLeaveRequests(query);
    
    // Get paginated results
    const requests = await leaveService.getPendingLeaveRequests(query, skip, limit);
    
    // Return paginated results with metadata
    res.status(200).json({
      success: true,
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Approve a leave request (Admin only)
 * PUT /admin/leave-requests/:id/approve
 * Requirements: 6.1-6.9, 11.5
 */
export const approveRequest = async (req, res) => {
  try {
    // Extract leaveId from params
    const leaveId = req.params.id;
    
    // Extract reviewNote from body (optional)
    const { reviewNote } = req.body;
    
    // Extract adminId from authenticated user
    const adminId = req.user._id;
    
    // Call leaveService.approveLeaveRequest
    const updatedLeaveRequest = await leaveService.approveLeaveRequest(
      leaveId,
      adminId,
      reviewNote
    );
    
    // Return 200 with updated leave request
    res.status(200).json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Đơn xin bảo lưu đã được phê duyệt'
    });
    
  } catch (error) {
    // Handle errors (not found, already processed)
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Reject a leave request (Admin only)
 * PUT /admin/leave-requests/:id/reject
 * Requirements: 7.1-7.9, 11.6
 */
export const rejectRequest = async (req, res) => {
  try {
    // Extract leaveId from params
    const leaveId = req.params.id;
    
    // Extract reviewNote from body
    const { reviewNote } = req.body;
    
    // Validate reviewNote is provided
    if (!reviewNote || reviewNote.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }
    
    // Extract adminId from authenticated user
    const adminId = req.user._id;
    
    // Call leaveService.rejectLeaveRequest
    const updatedLeaveRequest = await leaveService.rejectLeaveRequest(
      leaveId,
      adminId,
      reviewNote
    );
    
    // Return 200 with updated leave request
    res.status(200).json({
      success: true,
      data: updatedLeaveRequest,
      message: 'Đơn xin bảo lưu đã bị từ chối'
    });
    
  } catch (error) {
    // Handle errors (not found, already processed, missing reviewNote)
    const statusCode = error.message.includes('Không tìm thấy') ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Get my leave requests (Student only)
 * GET /students/leave/my-requests
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.3
 */
export const getMyRequests = async (req, res) => {
  try {
    // Extract studentId from authenticated user
    const studentId = req.user._id;
    
    // Query all AcademicLeave records for the student
    const requests = await leaveService.getStudentLeaveRequests(studentId);
    
    // Return array of leave requests
    res.status(200).json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
