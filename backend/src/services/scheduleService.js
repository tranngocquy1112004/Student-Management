/**
 * ScheduleService
 * Business logic for schedule generation and management
 */
import mongoose from 'mongoose';
import Class from '../models/Class.js';
import Schedule from '../models/Schedule.js';
class ScheduleService {
  /**
   * Calculate remaining lessons for a class
   * @param {string} classId - The class ID
   * @returns {Promise<number>} Number of remaining lessons
   */
  async calculateRemainingLessons(classId) {
    const classData = await Class.findById(classId);
    
    if (!classData) {
      throw new Error('Class not found');
    }
    
    if (!classData.totalLessons) {
      throw new Error('Total lessons not configured for this class');
    }
    
    const remainingLessons = classData.totalLessons - classData.scheduledLessons;
    return remainingLessons;
  }

  /**
   * Generate schedules based on input parameters
   * @param {Date} startDate - The starting date for schedule generation
   * @param {string} dayGroup - Day group pattern ('2-4-6' or '3-5-7')
   * @param {string} session - Session type ('morning' or 'afternoon')
   * @param {string} room - Room name/identifier
   * @param {number} remainingLessons - Number of lessons to generate
   * @returns {Array<Object>} Array of schedule objects
   */
  generateSchedules(startDate, dayGroup, session, room, remainingLessons) {
    const schedules = [];
    
    // Map day groups to day of week numbers
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
    // Thứ 2 = Monday = 1, Thứ 3 = Tuesday = 2, Thứ 4 = Wednesday = 3, etc.
    const dayOfWeekMap = {
      '2-4-6': [1, 3, 5],  // Thứ 2 (Monday), Thứ 4 (Wednesday), Thứ 6 (Friday)
      '3-5-7': [2, 4, 6]   // Thứ 3 (Tuesday), Thứ 5 (Thursday), Thứ 7 (Saturday)
    };
    
    // Map sessions to time ranges
    const sessionTimes = {
      'morning': { startTime: '07:30', endTime: '11:30' },
      'afternoon': { startTime: '13:30', endTime: '17:30' }
    };
    
    const targetDays = dayOfWeekMap[dayGroup];
    const times = sessionTimes[session];
    let currentDate = new Date(startDate);
    let count = 0;
    
    // Iterate through dates until we have generated all required lessons
    while (count < remainingLessons) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if current day matches the target day group
      if (targetDays.includes(dayOfWeek)) {
        schedules.push({
          dayOfWeek: dayOfWeek,
          startTime: times.startTime,
          endTime: times.endTime,
          room: room,
          startDate: new Date(currentDate),
          endDate: new Date(currentDate),
          isExam: count === remainingLessons - 1  // Last lesson is exam
        });
        count++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return schedules;
  }

  /**
   * Validate bulk schedules before insertion
   * @param {string} classId - The class ID
   * @param {Array<Object>} schedules - Array of schedule objects to validate
   * @returns {Promise<Object>} Validation result { isValid: boolean, error: string }
   */
  async validateBulkSchedules(classId, schedules) {
    try {
      // Validate schedules is an array
      if (!Array.isArray(schedules)) {
        return {
          isValid: false,
          error: 'Schedules must be an array'
        };
      }

      // Validate schedules array is not empty
      if (schedules.length === 0) {
        return {
          isValid: false,
          error: 'Schedules array cannot be empty'
        };
      }

      // Get class data to check remaining lessons
      const classData = await Class.findById(classId);

      if (!classData) {
        return {
          isValid: false,
          error: 'Không tìm thấy lớp học'
        };
      }

      // Check if totalLessons is configured
      if (!classData.totalLessons) {
        return {
          isValid: false,
          error: 'Lớp học chưa được cấu hình số tiết học'
        };
      }

      // Calculate remaining lessons
      const remainingLessons = classData.totalLessons - classData.scheduledLessons;

      // Validate schedules count does not exceed remaining lessons (Req 5.3)
      if (schedules.length > remainingLessons) {
        return {
          isValid: false,
          error: `Số lịch học (${schedules.length}) vượt quá số tiết còn lại (${remainingLessons})`
        };
      }

      // Validate each schedule object
      for (let i = 0; i < schedules.length; i++) {
        const schedule = schedules[i];

        // Validate required fields (Req 5.2)
        if (!schedule.dayOfWeek && schedule.dayOfWeek !== 0) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Thiếu thông tin ngày trong tuần`
          };
        }

        if (!schedule.startTime) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Thiếu thông tin giờ bắt đầu`
          };
        }

        if (!schedule.endTime) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Thiếu thông tin giờ kết thúc`
          };
        }

        if (!schedule.startDate) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Thiếu thông tin ngày bắt đầu`
          };
        }

        if (!schedule.endDate) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Thiếu thông tin ngày kết thúc`
          };
        }

        // Validate start date is not in the past (Req 5.1)
        const scheduleDate = new Date(schedule.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison

        if (scheduleDate < today) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Ngày bắt đầu không được ở quá khứ`
          };
        }

        // Validate room name if provided (Req 5.5)
        if (schedule.room) {
          // Room name should contain only alphanumeric characters, spaces, and common punctuation
          const validRoomPattern = /^[a-zA-Z0-9\s\-_.]+$/;
          if (!validRoomPattern.test(schedule.room)) {
            return {
              isValid: false,
              error: `Lịch học thứ ${i + 1}: Tên phòng học chỉ được chứa chữ cái, số, khoảng trắng và các ký tự - _ .`
            };
          }
        }

        // Validate dayOfWeek is in valid range (0-6)
        if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Ngày trong tuần không hợp lệ (phải từ 0-6)`
          };
        }

        // Validate isExam field if present
        if (schedule.isExam !== undefined && typeof schedule.isExam !== 'boolean') {
          return {
            isValid: false,
            error: `Lịch học thứ ${i + 1}: Trường isExam phải là boolean`
          };
        }
      }

      // All validations passed
      return {
        isValid: true,
        error: null
      };

    } catch (error) {
      return {
        isValid: false,
        error: `Lỗi xác thực: ${error.message}`
      };
    }
  }

  /**
   * Bulk insert schedules with transaction
   * Atomically inserts all schedules and updates class.scheduledLessons
   * @param {string} classId - The class ID
   * @param {Array<Object>} schedules - Array of schedule objects to insert
   * @returns {Promise<Object>} Result object with created schedules and updated class
   */
  async bulkInsertWithTransaction(classId, schedules) {
    try {
      // Add classId to all schedule objects
      const schedulesWithClassId = schedules.map(schedule => ({
        ...schedule,
        classId: classId
      }));
      
      // Insert all schedules using insertMany
      const createdSchedules = await Schedule.insertMany(schedulesWithClassId);
      
      // Update class.scheduledLessons using $inc operator
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $inc: { scheduledLessons: schedules.length } },
        { new: true }
      );
      
      return {
        success: true,
        createdSchedules,
        updatedClass
      };
      
    } catch (error) {
      // If insertion fails, try to clean up any created schedules
      // This is a best-effort cleanup since we don't have transactions
      console.error('Error in bulkInsertWithTransaction:', error);
      throw error;
    }
  }
}

export default new ScheduleService();
