import api from '../api/axios';

/**
 * Submit a leave request
 * @param {Object} requestData - Leave request data
 * @param {string} requestData.reason - Reason for leave (voluntary, medical, military, financial, personal)
 * @param {string} requestData.reasonText - Detailed explanation (min 20 chars)
 * @param {string} requestData.startDate - Start date (ISO format)
 * @param {string} requestData.endDate - End date (ISO format)
 * @returns {Promise} Response with created leave request
 */
export const submitLeaveRequest = async (requestData) => {
  const response = await api.post('/students/leave/request', requestData);
  return response.data;
};

/**
 * Get all leave requests for the logged-in student
 * @returns {Promise} Response with array of leave requests
 */
export const getMyLeaveRequests = async () => {
  const response = await api.get('/students/leave/my-requests');
  return response.data;
};
