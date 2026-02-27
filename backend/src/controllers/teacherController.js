import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import User from '../models/User.js';

export const getTeachers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = { isDeleted: false };
    if (search) {
      const users = await User.find({
        $or: [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }],
      }).select('_id');
      query.userId = { $in: users.map(u => u._id) };
    }
    const teachers = await Teacher.find(query)
      .populate('userId', 'name email avatar')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await Teacher.countDocuments(query);
    res.json({ success: true, data: teachers, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherById = async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ _id: req.params.id, isDeleted: false })
      .populate('userId', 'name email avatar');
    if (!teacher) return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true }
    ).populate('userId', 'name email avatar');
    if (!teacher) return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTeacherClasses = async (req, res) => {
  try {
    let teacher = req.user.role === 'teacher'
      ? await Teacher.findOne({ userId: req.user._id })
      : await Teacher.findById(req.params.id);
    if (!teacher) return res.status(404).json({ success: false, message: 'Không tìm thấy giảng viên' });
    const teacherId = teacher._id;
    const classes = await Class.find({ teacherId, isDeleted: false })
      .populate('students')
      .populate('academicYearId', 'name');
    res.json({ success: true, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
