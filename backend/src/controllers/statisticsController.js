import ExpulsionRecord from '../models/ExpulsionRecord.js';
import AcademicWarning from '../models/AcademicWarning.js';
import AttendanceWarning from '../models/AttendanceWarning.js';

/**
 * Get expulsion statistics (Admin only)
 * GET /admin/statistics/expulsions
 */
export const getExpulsionStatistics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.effectiveDate = {};
      if (startDate) dateFilter.effectiveDate.$gte = new Date(startDate);
      if (endDate) dateFilter.effectiveDate.$lte = new Date(endDate);
    }

    // Count by reason type
    const countByReasonType = await ExpulsionRecord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$reasonType',
          count: { $sum: 1 }
        }
      }
    ]);

    const reasonTypeStats = {
      low_gpa: 0,
      discipline_violation: 0,
      excessive_absence: 0,
      expired_leave: 0
    };

    countByReasonType.forEach(item => {
      reasonTypeStats[item._id] = item.count;
    });

    // Count by semester (extract from effectiveDate)
    const countBySemester = await ExpulsionRecord.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$effectiveDate' },
            month: { $month: '$effectiveDate' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Format semester data
    const semesterStats = {};
    countBySemester.forEach(item => {
      const year = item._id.year;
      const month = item._id.month;
      
      // Determine semester (1: Jan-Jun, 2: Jul-Dec)
      const semester = month <= 6 ? 1 : 2;
      const semesterKey = `${year}-${semester}`;
      
      semesterStats[semesterKey] = (semesterStats[semesterKey] || 0) + item.count;
    });

    // Calculate appeal success rate
    const totalAppeals = await ExpulsionRecord.countDocuments({
      ...dateFilter,
      appealStatus: { $in: ['approved', 'rejected'] }
    });

    const approvedAppeals = await ExpulsionRecord.countDocuments({
      ...dateFilter,
      appealStatus: 'approved'
    });

    const appealSuccessRate = totalAppeals > 0 
      ? Math.round((approvedAppeals / totalAppeals) * 100) / 100
      : 0;

    // Calculate warning-to-expulsion conversion rate
    const totalWarnings = await Promise.all([
      AcademicWarning.countDocuments(),
      AttendanceWarning.countDocuments()
    ]);

    const totalWarningCount = totalWarnings[0] + totalWarnings[1];
    const totalExpulsions = await ExpulsionRecord.countDocuments(dateFilter);

    const warningToExpulsionRate = totalWarningCount > 0
      ? Math.round((totalExpulsions / totalWarningCount) * 100) / 100
      : 0;

    res.status(200).json({
      success: true,
      data: {
        countByReasonType: reasonTypeStats,
        countBySemester: semesterStats,
        appealSuccessRate,
        warningToExpulsionRate,
        summary: {
          totalExpulsions,
          totalAppeals,
          approvedAppeals,
          totalWarnings: totalWarningCount
        }
      }
    });

  } catch (error) {
    console.error('Get expulsion statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy thống kê đuổi học',
      error: error.message
    });
  }
};
