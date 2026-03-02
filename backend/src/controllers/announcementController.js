import Announcement from '../models/Announcement.js';
import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import { getSocketService } from '../socketService.js';

export const getAnnouncements = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      const en = await Enrollment.findOne({ classId: req.params.classId, studentId: req.user._id });
      if (!en) return res.status(403).json({ success: false });
    }

    const { page, limit } = req.query;
    const filter = { classId: req.params.classId, isDeleted: false };

    const { paginate } = await import('../utils/pagination.js');
    const result = await paginate(
      Announcement,
      filter,
      {
        page,
        limit,
        sort: { createdAt: -1 },
        populate: { path: 'teacherId', select: 'name' }
      }
    );

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAnnouncement = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.classId);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    const announcement = await Announcement.create({ ...req.body, classId: req.params.classId, teacherId: req.user._id });
    const enrollments = await Enrollment.find({ classId: req.params.classId });
    const svc = getSocketService();
    if (svc?.sendNotification) {
      for (const e of enrollments) {
        try { await svc.sendNotification(e.studentId, 'Thông báo mới', req.body.title || 'Có thông báo mới từ lớp học', 'announcement', announcement._id, 'Announcement'); } catch (_) {}
      }
    }
    res.status(201).json({ success: true, data: await announcement.populate('teacherId', 'name') });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const a = await Announcement.findById(req.params.id);
    if (!a || a.isDeleted) return res.status(404).json({ success: false });
    const cls = await Class.findById(a.classId);
    if (cls.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') return res.status(403).json({ success: false });
    a.isDeleted = true;
    a.deletedAt = new Date();
    await a.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
