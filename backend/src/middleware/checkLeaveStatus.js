/**
 * Middleware to check if a student is on leave
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6
 */
export const checkStudentNotOnLeave = async (req, res, next) => {
  try {
    // Only check for students
    if (req.user.role !== 'student') {
      return next();
    }
    
    // Check user status
    if (req.user.status === 'on_leave') {
      return res.status(403).json({
        success: false,
        message: 'Bạn đang trong thời gian bảo lưu và không thể truy cập lớp học'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
