import api from '../api/axios';

/**
 * Get remaining lessons count for a class
 * @param {string} classId - The class ID
 * @returns {Promise} Response with totalLessons, scheduledLessons, remainingLessons
 */
export const getRemainingLessons = async (classId) => {
  const response = await api.get(`/classes/${classId}/remaining-lessons`);
  return response.data;
};

/**
 * Bulk create schedules for a class
 * @param {string} classId - The class ID
 * @param {Array} schedules - Array of schedule objects
 * @returns {Promise} Response with created schedules and updated class
 */
export const bulkCreateSchedules = async (classId, schedules) => {
  const response = await api.post(`/classes/${classId}/schedules/bulk`, {
    schedules
  });
  return response.data;
};
