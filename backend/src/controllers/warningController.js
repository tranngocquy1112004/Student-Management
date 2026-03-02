import warningService from '../services/warningService.js';

/**
 * Get all warnings (Admin only)
 * GET /admin/warnings
 */
export const getWarningList = async (req, res) => {
  try {
    const { type, level, studentId, startDate, endDate, page, limit } = req.query;

    const result = await warningService.getWarningList(
      { type, level, studentId, startDate, endDate },
      { page, limit }
    );

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Get warning list error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cảnh báo',
      error: error.message
    });
  }
};

/**
 * Get my warnings (Student only)
 * GET /students/warnings/me
 */
export const getMyWarnings = async (req, res) => {
  try {
    const studentId = req.user._id;

    const warnings = await warningService.getStudentWarnings(studentId);

    res.status(200).json({
      success: true,
      data: warnings
    });

  } catch (error) {
    console.error('Get my warnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cảnh báo',
      error: error.message
    });
  }
};

/**
 * Get class warnings (Teacher only)
 * GET /teachers/warnings/class/:classId
 */
export const getClassWarnings = async (req, res) => {
  try {
    const { classId } = req.params;
    const teacherId = req.user._id;

    // Verify teacher teaches this class
    const Class = (await import('../models/Class.js')).default;
    const classInfo = await Class.findOne({ _id: classId, teacherId });

    if (!classInfo) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem cảnh báo của lớp này'
      });
    }

    // Get attendance warnings for this class
    const result = await warningService.getWarningList(
      { type: 'attendance', classId },
      { page: 1, limit: 100 }
    );

    res.status(200).json({
      success: true,
      data: result.attendanceWarnings
    });

  } catch (error) {
    console.error('Get class warnings error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách cảnh báo lớp học',
      error: error.message
    });
  }
};
