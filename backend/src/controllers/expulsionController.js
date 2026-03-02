import expulsionService from '../services/expulsionService.js';
import appealService from '../services/appealService.js';

/**
 * Create expulsion record (Admin only)
 * POST /admin/expulsions
 */
export const createExpulsion = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { studentId, reason, reasonType, effectiveDate, notes } = req.body;

    // Validate required fields
    if (!studentId || !reason || !reasonType || !effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
        errors: {
          studentId: !studentId ? 'Vui lòng chọn sinh viên' : undefined,
          reason: !reason ? 'Vui lòng nhập lý do đuổi học' : undefined,
          reasonType: !reasonType ? 'Vui lòng chọn loại vi phạm' : undefined,
          effectiveDate: !effectiveDate ? 'Vui lòng chọn ngày hiệu lực' : undefined
        }
      });
    }

    // Validate reason length
    if (reason.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Lý do đuổi học phải có ít nhất 20 ký tự'
      });
    }

    if (reason.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Lý do đuổi học không được vượt quá 2000 ký tự'
      });
    }

    // Validate notes length if provided
    if (notes && notes.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Ghi chú không được vượt quá 1000 ký tự'
      });
    }

    // Handle file attachments if any
    const attachments = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path
    })) : [];

    // Create expulsion
    const expulsion = await expulsionService.createExpulsion(adminId, {
      studentId,
      reason,
      reasonType,
      effectiveDate,
      attachments,
      notes
    });

    res.status(201).json({
      success: true,
      data: expulsion,
      message: 'Quyết định đuổi học đã được tạo thành công'
    });

  } catch (error) {
    console.error('Create expulsion error:', error);
    
    if (error.message === 'Student not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    if (error.message === 'Student is already dismissed') {
      return res.status(400).json({
        success: false,
        message: 'Sinh viên đã bị đuổi học trước đó'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo quyết định đuổi học',
      error: error.message
    });
  }
};

/**
 * Get expulsion list (Admin only)
 * GET /admin/expulsions
 */
export const getExpulsionList = async (req, res) => {
  try {
    const { status, reasonType, startDate, endDate, page, limit, sortBy, sortOrder } = req.query;

    const result = await expulsionService.getExpulsionList(
      { status, reasonType, startDate, endDate },
      { page, limit, sortBy, sortOrder }
    );

    res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Get expulsion list error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách đuổi học',
      error: error.message
    });
  }
};

/**
 * Get expulsion details by ID (Admin only)
 * GET /admin/expulsions/:id
 */
export const getExpulsionById = async (req, res) => {
  try {
    const { id } = req.params;

    const expulsion = await expulsionService.getExpulsionById(id);

    res.status(200).json({
      success: true,
      data: expulsion
    });

  } catch (error) {
    console.error('Get expulsion by ID error:', error);
    
    if (error.message === 'Expulsion record not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyết định đuổi học'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đuổi học',
      error: error.message
    });
  }
};

/**
 * Get my expulsion (Student only)
 * GET /students/expulsions/me
 */
export const getMyExpulsion = async (req, res) => {
  try {
    const studentId = req.user._id;

    const expulsion = await expulsionService.getExpulsionByStudentId(studentId);

    if (!expulsion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyết định đuổi học'
      });
    }

    res.status(200).json({
      success: true,
      data: expulsion
    });

  } catch (error) {
    console.error('Get my expulsion error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thông tin đuổi học',
      error: error.message
    });
  }
};

/**
 * Submit appeal (Student only)
 * PUT /students/expulsions/:id/appeal
 */
export const submitAppeal = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { id } = req.params;
    const { appealReason } = req.body;

    // Validate appealReason
    if (!appealReason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do khiếu nại'
      });
    }

    if (appealReason.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Lý do khiếu nại phải có ít nhất 20 ký tự'
      });
    }

    if (appealReason.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Lý do khiếu nại không được vượt quá 2000 ký tự'
      });
    }

    // Handle file evidence if any
    const appealEvidence = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path
    })) : [];

    const expulsion = await appealService.submitAppeal(studentId, id, {
      appealReason,
      appealEvidence
    });

    res.status(200).json({
      success: true,
      data: expulsion,
      message: 'Đơn khiếu nại đã được gửi thành công'
    });

  } catch (error) {
    console.error('Submit appeal error:', error);
    
    if (error.message === 'Expulsion record not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyết định đuổi học'
      });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền khiếu nại quyết định này'
      });
    }

    if (error.message === 'Appeal already submitted') {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã gửi đơn khiếu nại trước đó'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi đơn khiếu nại',
      error: error.message
    });
  }
};

/**
 * Approve appeal (Admin only)
 * PUT /admin/expulsions/:id/approve-appeal
 */
export const approveAppeal = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { reviewNote } = req.body;

    const expulsion = await appealService.approveAppeal(adminId, id, reviewNote);

    res.status(200).json({
      success: true,
      data: expulsion,
      message: 'Đơn khiếu nại đã được chấp nhận'
    });

  } catch (error) {
    console.error('Approve appeal error:', error);
    
    if (error.message === 'Expulsion record not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyết định đuổi học'
      });
    }

    if (error.message === 'Appeal is not in pending status') {
      return res.status(400).json({
        success: false,
        message: 'Đơn khiếu nại không ở trạng thái chờ xét duyệt'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi chấp nhận đơn khiếu nại',
      error: error.message
    });
  }
};

/**
 * Reject appeal (Admin only)
 * PUT /admin/expulsions/:id/reject-appeal
 */
export const rejectAppeal = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { reviewNote } = req.body;

    // Validate reviewNote is required for rejection
    if (!reviewNote) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối'
      });
    }

    if (reviewNote.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Lý do từ chối không được vượt quá 1000 ký tự'
      });
    }

    const expulsion = await appealService.rejectAppeal(adminId, id, reviewNote);

    res.status(200).json({
      success: true,
      data: expulsion,
      message: 'Đơn khiếu nại đã bị từ chối'
    });

  } catch (error) {
    console.error('Reject appeal error:', error);
    
    if (error.message === 'Expulsion record not found') {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy quyết định đuổi học'
      });
    }

    if (error.message === 'Appeal is not in pending status') {
      return res.status(400).json({
        success: false,
        message: 'Đơn khiếu nại không ở trạng thái chờ xét duyệt'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Lỗi khi từ chối đơn khiếu nại',
      error: error.message
    });
  }
};
