import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import XLSX from 'xlsx';
import { generateStudentCode, generateTeacherCode } from '../utils/generateCode.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;
    const query = { isDeleted: false };
    if (role) query.role = role;
    if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
    const users = await User.find(query).select('-password').skip((page - 1) * limit).limit(parseInt(limit)).sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ success: true, data: users, pagination: { page, limit, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (await User.findOne({ email })) return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
    const doc = { name, email, password: password || '123456', role };
    if (role === 'student') doc.studentCode = generateStudentCode();
    if (role === 'teacher') doc.teacherCode = generateTeacherCode();
    const user = await User.create(doc);
    res.status(201).json({ success: true, data: await User.findById(user._id).select('-password') });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const importCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    const role = req.body.role || 'student';
    let created = 0, errors = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row['Họ tên'] || row.name || row['Name'];
      const email = row['Email'] || row.email;
      if (!email) { errors.push(`Dòng ${i + 2}: thiếu email`); continue; }
      if (await User.findOne({ email })) { errors.push(`Dòng ${i + 2}: ${email} đã tồn tại`); continue; }
      const doc = { name: name || email.split('@')[0], email, password: '123456', role };
      if (role === 'student') doc.studentCode = row['Mã SV'] || generateStudentCode();
      if (role === 'teacher') doc.teacherCode = row['Mã GV'] || generateTeacherCode();
      await User.create(doc);
      created++;
    }
    res.json({ success: true, data: { created, errors } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, isDeleted: false }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id, isDeleted: false }, req.body, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false, message: 'Không tìm thấy' });
    user.isDeleted = true;
    user.deletedAt = new Date();
    await user.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const lockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isLocked: true }, { new: true });
    if (!user || user.isDeleted) return res.status(404).json({ success: false });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unlockUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isLocked: false }, { new: true });
    if (!user || user.isDeleted) return res.status(404).json({ success: false });
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.isDeleted) return res.status(404).json({ success: false });
    user.password = req.body.newPassword || '123456';
    await user.save();
    res.json({ success: true, message: 'Đã reset mật khẩu' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
