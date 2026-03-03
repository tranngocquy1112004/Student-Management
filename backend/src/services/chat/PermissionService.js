import User from '../../models/User.js';

/**
 * PermissionService handles chat permission validation
 * 
 * Permission Matrix:
 * - Admin: Can chat with Admin, Teacher, Student (all roles)
 * - Teacher: Can chat with Admin and Student (not with other Teachers)
 * - Student: Can chat with Admin and Teacher (not with other Students)
 */
class PermissionService {
  /**
   * Check if two users can chat based on their roles
   * @param {string} role1 - Role of first user (admin, teacher, student)
   * @param {string} role2 - Role of second user (admin, teacher, student)
   * @returns {boolean} - True if users can chat, false otherwise
   */
  static canChat(role1, role2) {
    // Normalize roles to lowercase
    const r1 = role1?.toLowerCase();
    const r2 = role2?.toLowerCase();

    // Admin can chat with everyone
    if (r1 === 'admin' || r2 === 'admin') {
      return true;
    }

    // Teacher can chat with Student
    if ((r1 === 'teacher' && r2 === 'student') || 
        (r1 === 'student' && r2 === 'teacher')) {
      return true;
    }

    // Student cannot chat with Student
    if (r1 === 'student' && r2 === 'student') {
      return false;
    }

    // Teacher cannot chat with Teacher
    if (r1 === 'teacher' && r2 === 'teacher') {
      return false;
    }

    return false;
  }

  /**
   * Get list of users that current user can chat with
   * @param {string} currentUserId - ID of current user
   * @param {string} currentUserRole - Role of current user
   * @param {string} searchQuery - Optional search query for name/email
   * @param {number} limit - Maximum number of users to return
   * @returns {Promise<Array>} - Array of users
   */
  static async getAvailableUsers(currentUserId, currentUserRole, searchQuery = '', limit = 50) {
    const role = currentUserRole?.toLowerCase();
    
    // Build query based on role
    let roleFilter = {};
    
    if (role === 'admin') {
      // Admin can see all users
      roleFilter = { role: { $in: ['admin', 'teacher', 'student'] } };
    } else if (role === 'teacher') {
      // Teacher can see Admin and Student
      roleFilter = { role: { $in: ['admin', 'student'] } };
    } else if (role === 'student') {
      // Student can see Admin and Teacher
      roleFilter = { role: { $in: ['admin', 'teacher'] } };
    } else {
      // Unknown role, return empty array
      return [];
    }

    // Build search query
    const query = {
      _id: { $ne: currentUserId }, // Exclude current user
      isDeleted: { $ne: true }, // Exclude deleted users
      ...roleFilter
    };

    // Add search filter if provided
    if (searchQuery && searchQuery.trim()) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { email: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    // Execute query
    const users = await User.find(query)
      .select('name email role avatar')
      .limit(Math.min(limit, 50)) // Max 50 users
      .sort({ name: 1 })
      .lean();

    return users;
  }

  /**
   * Validate if user can access a conversation
   * @param {string} userId - ID of user trying to access
   * @param {Object} conversation - Conversation object with participants
   * @returns {boolean} - True if user can access, false otherwise
   */
  static canAccessConversation(userId, conversation) {
    if (!conversation || !conversation.participants) {
      return false;
    }

    // User must be a participant
    return conversation.participants.some(
      p => p.userId.toString() === userId.toString()
    );
  }

  /**
   * Validate if user can send message in a conversation
   * @param {string} userId - ID of user trying to send message
   * @param {Object} conversation - Conversation object with participants
   * @returns {boolean} - True if user can send message, false otherwise
   */
  static canSendMessage(userId, conversation) {
    // Same as canAccessConversation - participants can send messages
    return this.canAccessConversation(userId, conversation);
  }

  /**
   * Get permission error message
   * @param {string} role1 - Role of first user
   * @param {string} role2 - Role of second user
   * @returns {string} - Error message
   */
  static getPermissionErrorMessage(role1, role2) {
    const r1 = role1?.toLowerCase();
    const r2 = role2?.toLowerCase();

    if (r1 === 'student' && r2 === 'student') {
      return 'Students cannot chat with other students';
    }

    if (r1 === 'teacher' && r2 === 'teacher') {
      return 'Teachers cannot chat with other teachers';
    }

    return 'You do not have permission to chat with this user';
  }
}

export default PermissionService;
