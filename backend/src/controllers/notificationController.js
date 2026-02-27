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
