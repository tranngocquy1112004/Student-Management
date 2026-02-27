import Schedule from '../models/Schedule.js';

/**
 * ScheduleValidator Service
 * Validates schedule existence and time windows for attendance operations
 * 
 * TIMEZONE HANDLING:
 * All time comparisons use the server's local timezone for consistency.
 * The server timezone should be configured via TZ environment variable.
 * Example: TZ=Asia/Ho_Chi_Minh
 */
class ScheduleValidator {
  /**
   * Get current schedule for a class on current day and time
   * @param {ObjectId} classId - Class ID
   * @returns {Promise<Schedule|null>} - Schedule if found and valid, null otherwise
   */
  async getCurrentSchedule(classId) {
    const currentDay = this.getCurrentDayOfWeek();
    const currentDate = new Date();
    
    const schedule = await Schedule.findOne({
      classId,
      dayOfWeek: currentDay,
      isDeleted: false,
      $or: [
        { startDate: { $exists: false } },
        { startDate: null },
        { startDate: { $lte: currentDate } }
      ]
    });

    // Additional check for endDate if schedule exists
    if (schedule) {
      if (schedule.endDate && schedule.endDate < currentDate) {
        return null;
      }
    }

    return schedule;
  }

  /**
   * Validate if current day matches schedule
   * @param {ObjectId} classId - Class ID
   * @returns {Promise<{valid: boolean, schedule: Schedule|null, message: string}>}
   */
  async validateDayOfWeek(classId) {
    const schedule = await this.getCurrentSchedule(classId);
    
    if (!schedule) {
      return {
        valid: false,
        schedule: null,
        message: 'Hôm nay không có lịch học'
      };
    }

    return {
      valid: true,
      schedule,
      message: 'Schedule found for today'
    };
  }

  /**
   * Validate if current time is within schedule window
   * @param {Schedule} schedule - Schedule object
   * @param {string} currentTime - Optional current time override (for testing)
   * @returns {boolean} - true if within window, false otherwise
   */
  validateTimeWindow(schedule, currentTime = null) {
    const time = currentTime || this.getCurrentTime();
    const startCompare = this.compareTime(time, schedule.startTime);
    const endCompare = this.compareTime(time, schedule.endTime);
    
    // Time must be >= startTime and <= endTime
    return startCompare >= 0 && endCompare <= 0;
  }

  /**
   * Get day of week as number (0=Sunday, 1=Monday, ..., 6=Saturday)
   * Uses server timezone for consistency
   * @returns {number}
   */
  getCurrentDayOfWeek() {
    return new Date().getDay();
  }

  /**
   * Get current time as HH:mm string
   * Uses server timezone for consistency
   * @returns {string}
   */
  getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Compare two time strings (HH:mm format)
   * @param {string} time1
   * @param {string} time2
   * @returns {number} - negative if time1 < time2, 0 if equal, positive if time1 > time2
   */
  compareTime(time1, time2) {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    
    return minutes1 - minutes2;
  }

  /**
   * Get detailed validation result with error messages
   * @param {ObjectId} classId - Class ID
   * @returns {Promise<{valid: boolean, schedule: Schedule|null, message: string, code: string}>}
   */
  async validateScheduleAndTime(classId) {
    const dayValidation = await this.validateDayOfWeek(classId);
    
    if (!dayValidation.valid) {
      return {
        valid: false,
        schedule: null,
        message: dayValidation.message,
        code: 'SCHEDULE_NOT_FOUND'
      };
    }

    const schedule = dayValidation.schedule;
    const isWithinWindow = this.validateTimeWindow(schedule);

    if (!isWithinWindow) {
      const currentTime = this.getCurrentTime();
      const isBeforeStart = this.compareTime(currentTime, schedule.startTime) < 0;
      
      if (isBeforeStart) {
        return {
          valid: false,
          schedule,
          message: `Chưa đến giờ học. Lớp học bắt đầu lúc ${schedule.startTime}`,
          code: 'ATTENDANCE_TOO_EARLY'
        };
      } else {
        return {
          valid: false,
          schedule,
          message: `Đã hết giờ học. Lớp học kết thúc lúc ${schedule.endTime}`,
          code: 'ATTENDANCE_TOO_LATE'
        };
      }
    }

    return {
      valid: true,
      schedule,
      message: 'Schedule and time window are valid',
      code: 'VALID'
    };
  }
}

export default new ScheduleValidator();
