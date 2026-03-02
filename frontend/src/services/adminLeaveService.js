import api from '../api/axios';

/**
 * Get all pending leave requests (Admin only)
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @returns {Promise} Response with paginated leave requests
 */
export const getPendingLeaveRequests = async (page = 1, limit = 20) => {
  const response = await api.get('/admin/leave-requests', {
    params: { page, limit }
  });
  return response.data;
};

/**
 * Approve a leave request (Admin only)
 * @param {string} leaveId - Leave request ID
 * @param {string} reviewNote - Optional review note
 * @returns {Promise} Response with updated leave request
 */
export const approveLeaveRequest = async (leaveId, reviewNote = '') => {
  const response = await api.put(`/admin/leave-requests/${leaveId}/approve`, {
    reviewNote
  });
  return response.data;
};

/**
 * Reject a leave request (Admin only)
 * @param {string} leaveId - Leave request ID
 * @param {string} reviewNote - Required rejection reason
 * @returns {Promise} Response with updated leave request
 */
export const rejectLeaveRequest = async (leaveId, reviewNote) => {
  const response = await api.put(`/admin/leave-requests/${leaveId}/reject`, {
    reviewNote
  });
  return response.data;
};
