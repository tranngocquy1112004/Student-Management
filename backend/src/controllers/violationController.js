import ViolationReport from '../models/ViolationReport.js';
import User from '../models/User.js';
import expulsionService from '../services/expulsionService.js';
import emailService from '../services/emailService.js';

/**
 * Report violation (Teacher only)
 * POST /teachers/violations
 */
export const reportViolation = async (req, res) => {
  try {
    const teacherId = req.user._id;
    const { studentId, description } = req.body;

    // Validate required fields
    if (!studentId || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin',
        errors: {
          studentId: !studentId ? 'Vui lòng chọn sinh viên' : undefined,
          description: !description ? 'Vui lòng mô tả vi phạm' : undefined
        }
      });
    }

    // Validate description length
    if (description.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả vi phạm phải có ít nhất 20 ký tự'
      });
    }

    if (description.length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Mô tả vi phạm không được vượt quá 2000 ký tự'
      });
    }

    // Verify student exists
    const student = await User.findOne({ _id: studentId, role: 'student' });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy sinh viên'
      });
    }

    // Handle file evidence if any
    const evidence = req.files ? req.files.map(file => ({
      filename: file.originalname,
      path: file.path
    })) : [];

    // Create violation report
    const violation = new ViolationReport({
      studentId,
      reportedBy: teacherId,
      description,
      evidence,
      status: 'pending'
    });

    await violation.save();

    // Populate fields for response
    await violation.populate([
      { path: 'studentId', select: 'name email studentCode' },
      { path: 'reportedBy', select: 'name email' }
    ]);

    // Send notification to admin
    const teacher = await User.findById(teacherId);
    emailService.sendViolationReportNotification({
      studentName: student.name,
      teacherName: teacher.name,
      description
    }).catch(err => console.error('Failed to send violation notification:', err));

    res.status(201).json({
      success: true,
      data: violation,
      message: 'Báo cáo vi phạm đã được gửi thành công'
    });

  } catch (error) {
    console.error('Report violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi gửi báo cáo vi phạm',
      error: error.message
    });
  }
};

/**
 * Get violation list (Admin only)
 * GET /admin/violations
 */
export const getViolationList = async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;
    if (studentId) query.studentId = studentId;

    const skip = (page - 1) * limit;

    const [violations, total] = await Promise.all([
      ViolationReport.find(query)
        .populate('studentId', 'name email studentCode')
        .populate('reportedBy', 'name email')
        .populate('reviewedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ViolationReport.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: violations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get violation list error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách vi phạm',
      error: error.message
    });
  }
};

/**
 * Convert violation to expulsion (Admin only)
 * PUT /admin/violations/:id/convert
 */
export const convertToExpulsion = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { effectiveDate, additionalReason, notes } = req.body;

    // Find violation report
    const violation = await ViolationReport.findById(id)
      .populate('studentId', 'name email studentCode');

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo vi phạm'
      });
    }

    if (violation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Báo cáo vi phạm đã được xử lý trước đó'
      });
    }

    // Validate effectiveDate
    if (!effectiveDate) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày hiệu lực'
      });
    }

    // Create expulsion from violation
    const reason = additionalReason 
      ? `${violation.description}\n\nGhi chú bổ sung: ${additionalReason}`
      : violation.description;

    const expulsion = await expulsionService.createExpulsion(adminId, {
      studentId: violation.studentId._id,
      reason,
      reasonType: 'discipline_violation',
      effectiveDate,
      attachments: violation.evidence,
      notes
    });

    // Update violation status
    violation.status = 'converted_to_expulsion';
    violation.reviewedBy = adminId;
    violation.reviewedAt = new Date();
    violation.expulsionRecordId = expulsion._id;
    await violation.save();

    res.status(200).json({
      success: true,
      data: {
        violation,
        expulsion
      },
      message: 'Đã chuyển báo cáo vi phạm thành quyết định đuổi học'
    });

  } catch (error) {
    console.error('Convert to expulsion error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi chuyển đổi báo cáo vi phạm',
      error: error.message
    });
  }
};

/**
 * Dismiss violation (Admin only)
 * PUT /admin/violations/:id/dismiss
 */
export const dismissViolation = async (req, res) => {
  try {
    const adminId = req.user._id;
    const { id } = req.params;
    const { reviewNote } = req.body;

    // Find violation report
    const violation = await ViolationReport.findById(id);

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy báo cáo vi phạm'
      });
    }

    if (violation.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Báo cáo vi phạm đã được xử lý trước đó'
      });
    }

    // Validate reviewNote
    if (!reviewNote) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do bỏ qua'
      });
    }

    // Update violation status
    violation.status = 'dismissed';
    violation.reviewedBy = adminId;
    violation.reviewedAt = new Date();
    violation.reviewNote = reviewNote;
    await violation.save();

    await violation.populate([
      { path: 'studentId', select: 'name email studentCode' },
      { path: 'reportedBy', select: 'name email' },
      { path: 'reviewedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      data: violation,
      message: 'Đã bỏ qua báo cáo vi phạm'
    });

  } catch (error) {
    console.error('Dismiss violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi bỏ qua báo cáo vi phạm',
      error: error.message
    });
  }
};
