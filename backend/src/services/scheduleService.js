import mongoose from 'mongoose';
import Schedule from '../models/Schedule.js';
import AttendanceSession from '../models/AttendanceSession.js';
import Class from '../models/Class.js';

/**
 * Schedule Service
 * Handles schedule creation, validation, and session management
 */

/**
 * Create schedule with automatic session creation
 * Note: Not using transactions for standalone MongoDB compatibility
 */
export const createScheduleWithSession = async (classId, scheduleData, userId) => {
  try {
    // Create schedule
    const schedule = await Schedule.create({
      classId,
      date: scheduleData.date,
      startTime: scheduleData.startTime,
      endTime: scheduleData.endTime,
      room: scheduleData.room || ''
    });
    
    // Auto-create attendance session
    const attendanceSession = await AttendanceSession.create({
      classId: schedule.classId,
      scheduleId: schedule._id,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime
    });
    
    return {
      schedule: schedule,
      session: attendanceSession
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Validate schedule input
 * Returns validation result with error details
 */
export const validateScheduleInput = async (classId, scheduleData, user) => {
  // Check date format
  const date = new Date(scheduleData.date);
  if (isNaN(date.getTime())) {
    return {
      valid: false,
      message: 'Invalid date format',
      code: 'INVALID_DATE_FORMAT'
    };
  }
  
  // Check date is not in past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduleDate = new Date(date);
  scheduleDate.setHours(0, 0, 0, 0);
  
  if (scheduleDate < today) {
    return {
      valid: false,
      message: 'Schedule date cannot be in the past',
      code: 'PAST_DATE_ERROR'
    };
  }
  
  // Check time format and range
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(scheduleData.startTime) || !timeRegex.test(scheduleData.endTime)) {
    return {
      valid: false,
      message: 'Invalid time format. Use HH:MM',
      code: 'INVALID_TIME_FORMAT'
    };
  }
  
  if (scheduleData.endTime <= scheduleData.startTime) {
    return {
      valid: false,
      message: 'End time must be after start time',
      code: 'INVALID_TIME_RANGE'
    };
  }
  
  // Check class exists
  const classExists = await Class.findById(classId);
  if (!classExists || classExists.isDeleted) {
    return {
      valid: false,
      message: 'Class not found',
      code: 'CLASS_NOT_FOUND'
    };
  }
  
  // Check teacher permission
  if (user.role !== 'admin' && classExists.teacherId.toString() !== user._id.toString()) {
    return {
      valid: false,
      message: 'You do not have permission to create schedules for this class',
      code: 'PERMISSION_DENIED'
    };
  }
  
  return { valid: true };
};

/**
 * Calculate session status based on current time
 * Returns: "upcoming", "active", or "expired"
 */
export const calculateSessionStatus = (schedule, currentTime = null) => {
  const now = currentTime || new Date();
  const scheduleDate = new Date(schedule.date);
  
  // Set times to compare
  const todayDate = new Date(now);
  todayDate.setHours(0, 0, 0, 0);
  
  const scheduleDateOnly = new Date(scheduleDate);
  scheduleDateOnly.setHours(0, 0, 0, 0);
  
  // If schedule date is in the future
  if (scheduleDateOnly > todayDate) {
    return 'upcoming';
  }
  
  // If schedule date is in the past
  if (scheduleDateOnly < todayDate) {
    return 'expired';
  }
  
  // Schedule is today - check time window
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  if (currentTimeStr < schedule.startTime) {
    return 'upcoming';
  }
  
  if (currentTimeStr > schedule.endTime) {
    return 'expired';
  }
  
  return 'active';
};

/**
 * Get schedules with enriched status information
 */
export const getSchedulesWithStatus = async (classId, filters = {}) => {
  const query = { classId, isDeleted: false };
  
  // Apply date range filters if provided
  if (filters.startDate || filters.endDate) {
    query.date = {};
    if (filters.startDate) {
      query.date.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.date.$lte = new Date(filters.endDate);
    }
  }
  
  // Fetch schedules ordered by date and time
  const schedules = await Schedule.find(query)
    .sort({ date: 1, startTime: 1 })
    .lean();
  
  // Enrich with status
  const enrichedSchedules = schedules.map(schedule => ({
    ...schedule,
    status: calculateSessionStatus(schedule)
  }));
  
  return enrichedSchedules;
};

/**
 * Delete schedule and associated session
 * Only allows deletion of future schedules
 * Note: Not using transactions for standalone MongoDB compatibility
 */
export const deleteSchedule = async (scheduleId, user) => {
  try {
    const schedule = await Schedule.findById(scheduleId);
    
    if (!schedule || schedule.isDeleted) {
      throw new Error('Schedule not found');
    }
    
    // Check permission
    const classData = await Class.findById(schedule.classId);
    if (user.role !== 'admin' && classData.teacherId.toString() !== user._id.toString()) {
      throw new Error('Permission denied');
    }
    
    // Check schedule is in future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduleDate = new Date(schedule.date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate <= today) {
      throw new Error('Cannot delete past or today\'s schedule');
    }
    
    // Soft delete schedule
    schedule.isDeleted = true;
    schedule.deletedAt = new Date();
    await schedule.save();
    
    // Soft delete associated session
    await AttendanceSession.updateOne(
      { scheduleId: schedule._id },
      { isDeleted: true, deletedAt: new Date() }
    );
    
    return { success: true };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculate remaining lessons for a class
 * Returns total lessons minus already scheduled lessons
 */
export const calculateRemainingLessons = async (classId) => {
  const classData = await Class.findById(classId);
  
  if (!classData || classData.isDeleted) {
    throw new Error('Class not found');
  }
  
  const totalLessons = classData.totalLessons || 0;
  const scheduledLessons = classData.scheduledLessons || 0;
  const remainingLessons = totalLessons - scheduledLessons;
  
  return {
    classId,
    totalLessons,
    scheduledLessons,
    remainingLessons
  };
};

/**
 * Validate bulk schedules before creation
 * Checks count and data structure
 */
export const validateBulkSchedules = async (classId, schedules) => {
  // Check if schedules is an array
  if (!Array.isArray(schedules) || schedules.length === 0) {
    return {
      isValid: false,
      error: 'Schedules must be a non-empty array'
    };
  }
  
  // Get remaining lessons
  const remaining = await calculateRemainingLessons(classId);
  
  // Check if schedules count exceeds remaining lessons
  if (schedules.length > remaining.remainingLessons) {
    return {
      isValid: false,
      error: `Cannot create ${schedules.length} schedules. Only ${remaining.remainingLessons} lessons remaining.`
    };
  }
  
  // Validate each schedule data structure
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];
    
    // Check required fields
    if (!schedule.date || !schedule.startTime || !schedule.endTime) {
      return {
        isValid: false,
        error: `Schedule at index ${i} is missing required fields (date, startTime, endTime)`
      };
    }
    
    // Validate date format
    const date = new Date(schedule.date);
    if (isNaN(date.getTime())) {
      return {
        isValid: false,
        error: `Schedule at index ${i} has invalid date format`
      };
    }
    
    // Check date is not in past
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    
    if (scheduleDate < today) {
      return {
        isValid: false,
        error: `Schedule at index ${i} has a date in the past`
      };
    }
    
    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(schedule.startTime) || !timeRegex.test(schedule.endTime)) {
      return {
        isValid: false,
        error: `Schedule at index ${i} has invalid time format. Use HH:MM`
      };
    }
    
    // Check time range
    if (schedule.endTime <= schedule.startTime) {
      return {
        isValid: false,
        error: `Schedule at index ${i} has end time before or equal to start time`
      };
    }
  }
  
  return { isValid: true };
};

/**
 * Bulk insert schedules without transaction (for standalone MongoDB)
 * Creates schedules and sessions, updates class count
 */
export const bulkInsertWithTransaction = async (classId, schedules) => {
  try {
    const createdSchedules = [];
    const createdSessions = [];
    
    // Create each schedule and its session
    for (const scheduleData of schedules) {
      // Create schedule
      const schedule = await Schedule.create({
        classId,
        date: scheduleData.date,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        room: scheduleData.room || ''
      });
      
      createdSchedules.push(schedule);
      
      // Auto-create attendance session
      const attendanceSession = await AttendanceSession.create({
        classId: schedule.classId,
        scheduleId: schedule._id,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      });
      
      createdSessions.push(attendanceSession);
    }
    
    // Update class scheduledLessons count
    const updatedClass = await Class.findByIdAndUpdate(
      classId,
      { $inc: { scheduledLessons: schedules.length } },
      { new: true }
    );
    
    return {
      createdSchedules,
      createdSessions,
      updatedClass,
      count: schedules.length
    };
  } catch (error) {
    // If error occurs, try to clean up created schedules
    // Note: This is not atomic like transactions, but works for standalone MongoDB
    throw error;
  }
};

export default {
  createScheduleWithSession,
  validateScheduleInput,
  calculateSessionStatus,
  getSchedulesWithStatus,
  deleteSchedule,
  calculateRemainingLessons,
  validateBulkSchedules,
  bulkInsertWithTransaction
};
