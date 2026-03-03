import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id, isDeleted: false };
    if (isRead !== undefined) query.isRead = isRead === 'true';
    const notifications = await Notification.find(query).skip((page - 1) * limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    const total = await Notification.countDocuments(query);
    res.json({ success: true, data: notifications, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id }, { isRead: true });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const n = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
    if (!n) return res.status(404).json({ success: false });
    n.isDeleted = true;
    n.deletedAt = new Date();
    await n.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.user._id, 
      isRead: false, 
      isDeleted: false 
    });
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const broadcastNotification = async (req, res) => {
  try {
    const { title, content, targetRoles } = req.body;
    
    console.log('📢 Broadcast request:', { title, targetRoles, from: req.user.email });
    
    if (!title || !content) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tiêu đề và nội dung là bắt buộc' 
      });
    }

    // Only admin can broadcast
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Chỉ admin mới có thể gửi thông báo toàn hệ thống' 
      });
    }

    const User = (await import('../models/User.js')).default;
    const { getSocketService } = await import('../socketService.js');
    
    // Build query based on target roles
    const query = { isDeleted: false, isLocked: false };
    if (targetRoles && targetRoles.length > 0) {
      query.role = { $in: targetRoles };
    }

    console.log('🔍 Query:', query);

    // Get all users matching criteria
    const users = await User.find(query).select('_id email role');
    
    console.log(`👥 Found ${users.length} users:`, users.map(u => ({ email: u.email, role: u.role })));
    
    // Create notifications for all users
    const notifications = users.map(user => ({
      userId: user._id,
      title,
      content,
      type: 'system',
      refType: 'SystemBroadcast'
    }));

    await Notification.insertMany(notifications);
    console.log('✅ Created notification records');

    // Send real-time notifications via Socket.io
    const svc = getSocketService();
    console.log('🔌 Socket service:', svc ? 'Available' : 'Not available');
    
    if (svc?.emitToUser) {
      for (const user of users) {
        try {
          console.log(`📤 Emitting to user ${user.email} (${user._id})`);
          svc.emitToUser(user._id, 'notification', { title, content, type: 'system' });
        } catch (err) {
          console.error(`❌ Failed to emit to ${user.email}:`, err);
        }
      }
    }

    res.status(201).json({ 
      success: true, 
      message: `Đã gửi thông báo đến ${users.length} người dùng`,
      data: { count: users.length }
    });
  } catch (error) {
    console.error('❌ Broadcast error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
