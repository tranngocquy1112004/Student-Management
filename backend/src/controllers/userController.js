import User from '../models/User.js';
import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import { generateStudentCode, generateTeacherCode } from '../utils/generateCode.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search, status } = req.query;
    const query = { isDeleted: false };
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const users = await User.find(query)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentCode, teacherCode, ...profileData } = req.body;
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    }
    const user = await User.create({ name, email, password: password || '123456', role });
    if (role === 'student') {
      await Student.create({
        userId: user._id,
        studentCode: studentCode || generateStudentCode(),
        ...profileData,
      });
    } else if (role === 'teacher') {
      await Teacher.create({
        userId: user._id,
        teacherCode: teacherCode || generateTeacherCode(),
        ...profileData,
      });
    }
    const newUser = await User.findById(user._id).select('-password');
    res.status(201).json({ success: true, data: newUser });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    let profile = null;
    if (user.role === 'student') {
      profile = await Student.findOne({ userId: user._id }).populate('classId');
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ userId: user._id });
    }
    res.json({ success: true, data: { user, profile } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    const { name, email, role, ...profileData } = req.body;
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    if (user.role === 'student') {
      await Student.findOneAndUpdate({ userId: user._id }, profileData, { new: true });
    } else if (user.role === 'teacher') {
      await Teacher.findOneAndUpdate({ userId: user._id }, profileData, { new: true });
    }
    const updated = await User.findById(user._id).select('-password');
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    res.json({ success: true, message: 'Xóa thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    user.status = req.body.status || user.status;
    await user.save();
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('+password');
    if (!user || user.isDeleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy user' });
    }
    user.password = req.body.newPassword || '123456';
    await user.save();
    res.json({ success: true, message: 'Reset mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
