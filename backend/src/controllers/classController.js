import Class from '../models/Class.js';
import Enrollment from '../models/Enrollment.js';
import User from '../models/User.js';
import XLSX from 'xlsx';

const canAccessClass = async (user, classId) => {
  const cls = await Class.findById(classId);
  if (!cls || cls.isDeleted) return false;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher' && cls.teacherId.toString() === user._id.toString()) return true;
  if (user.role === 'student') {
    const en = await Enrollment.findOne({ classId, studentId: user._id });
    return !!en;
  }
  return false;
};

export const getClasses = async (req, res) => {
  try {
    const { semester, year, status, search, page = 1, limit = 20 } = req.query;
    const query = { isDeleted: false };
    if (semester) query.semester = semester;
    if (year) query.year = year;
    if (status) query.status = status;
    if (search) query.name = { $regex: search, $options: 'i' };
    if (req.user.role === 'teacher') query.teacherId = req.user._id;
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ studentId: req.user._id }).distinct('classId');
      query._id = { $in: enrollments };
    }
    const classes = await Class.find(query)
      .populate('subjectId')
      .populate('teacherId', 'name email')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Class.countDocuments(query);
    res.json({ success: true, data: classes, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createClass = async (req, res) => {
  try {
    const cls = await Class.create({ ...req.body, teacherId: req.body.teacherId || req.user._id });
    res.status(201).json({ success: true, data: await cls.populate(['subjectId', 'teacherId']) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassById = async (req, res) => {
  try {
    const cls = await Class.findOne({ _id: req.params.id, isDeleted: false }).populate('subjectId').populate('teacherId', 'name email');
    if (!cls) return res.status(404).json({ success: false });
    const allowed = await canAccessClass(req.user, req.params.id);
    if (!allowed) return res.status(403).json({ success: false });
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateClass = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.id);
    if (!allowed || req.user.role !== 'admin') return res.status(403).json({ success: false });
    const cls = await Class.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true }).populate(['subjectId', 'teacherId']);
    if (!cls) return res.status(404).json({ success: false });
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteClass = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    const cls = await Class.findById(req.params.id);
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    cls.isDeleted = true;
    cls.deletedAt = new Date();
    await cls.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    const cls = await Class.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!cls || cls.isDeleted) return res.status(404).json({ success: false });
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getClassStudents = async (req, res) => {
  try {
    const allowed = await canAccessClass(req.user, req.params.id);
    if (!allowed) return res.status(403).json({ success: false });

    const { page, limit } = req.query;
    const filter = { classId: req.params.id };

    const { paginate } = await import('../utils/pagination.js');
    const result = await paginate(
      Enrollment,
      filter,
      {
        page,
        limit,
        sort: { enrolledAt: -1 },
        populate: { path: 'studentId', select: 'name email studentCode status' }
      }
    );

    // Transform data to match original format
    if (result.data) {
      result.data = result.data.map(e => ({
        ...e.studentId.toObject(),
        enrolledAt: e.enrolledAt
      }));
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addStudent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    const { studentId } = req.body;
    const existing = await Enrollment.findOne({ classId: req.params.id, studentId });
    if (existing) return res.status(400).json({ success: false, message: 'Sinh viên đã có trong lớp' });
    await Enrollment.create({ classId: req.params.id, studentId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importStudents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    let added = 0;
    for (const row of rows) {
      const email = row['Email'] || row.email;
      if (!email) continue;
      const user = await User.findOne({ email, role: 'student' });
      if (!user) continue;
      const existing = await Enrollment.findOne({ classId: req.params.id, studentId: user._id });
      if (!existing) {
        await Enrollment.create({ classId: req.params.id, studentId: user._id });
        added++;
      }
    }
    res.json({ success: true, data: { added } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const removeStudent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false });
    await Enrollment.findOneAndDelete({ classId: req.params.id, studentId: req.params.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyClasses = async (req, res) => {
  try {
    const query = { isDeleted: false };
    if (req.user.role === 'teacher') query.teacherId = req.user._id;
    if (req.user.role === 'student') {
      const enrollments = await Enrollment.find({ studentId: req.user._id }).distinct('classId');
      query._id = { $in: enrollments };
    }
    const classes = await Class.find(query).populate('subjectId').populate('teacherId', 'name email').sort({ year: -1, semester: -1 });
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyEnrollment = async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ success: false });
    const enrollment = await Enrollment.findOne({ 
      classId: req.params.id, 
      studentId: req.user._id 
    });
    res.json({ success: true, data: enrollment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
