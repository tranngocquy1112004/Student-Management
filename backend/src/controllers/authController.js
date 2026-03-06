import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Otp from '../models/Otp.js';
import { generateStudentCode, generateTeacherCode } from '../utils/generateCode.js';

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, isDeleted: false }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu sai' });
    }
    if (user.isLocked) return res.status(403).json({ success: false, message: 'Tài khoản đã bị khóa' });
    
    const { accessToken, refreshToken } = generateTokens(user._id);
    await RefreshToken.create({ token: refreshToken, userId: user._id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    
    // Build user data with role-specific information
    let userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar
    };
    
    // Add role-specific data
    if (user.role === 'student') {
      const Student = (await import('../models/Student.js')).default;
      const studentData = await Student.findOne({ userId: user._id })
        .populate('facultyId', 'name code')
        .lean();
      
      if (studentData) {
        userData.studentInfo = {
          _id: studentData._id,
          studentCode: studentData.studentCode,
          faculty: studentData.facultyId,
          enrollmentYear: studentData.enrollmentYear,
          status: studentData.status
        };
      }
    } else if (user.role === 'teacher') {
      const Teacher = (await import('../models/Teacher.js')).default;
      const teacherData = await Teacher.findOne({ userId: user._id })
        .populate('facultyId', 'name code')
        .lean();
      
      if (teacherData) {
        userData.teacherInfo = {
          _id: teacherData._id,
          teacherCode: teacherData.teacherCode,
          faculty: teacherData.facultyId,
          specialization: teacherData.specialization,
          title: teacherData.title
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: userData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) await RefreshToken.findOneAndDelete({ token });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    const stored = await RefreshToken.findOne({ token });
    if (!stored || stored.expiresAt < new Date()) return res.status(401).json({ success: false, message: 'Token hết hạn' });
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const { accessToken, refreshToken: newRT } = generateTokens(decoded.id);
    await RefreshToken.findByIdAndDelete(stored._id);
    await RefreshToken.create({ token: newRT, userId: decoded.id, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) });
    res.json({ success: true, data: { accessToken, refreshToken: newRT } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token không hợp lệ' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Populate additional data based on role
    let userData = user.toObject();
    
    if (user.role === 'student') {
      // Import Student model dynamically
      const Student = (await import('../models/Student.js')).default;
      const studentData = await Student.findOne({ userId: user._id })
        .populate('facultyId', 'name code')
        .lean();
      
      if (studentData) {
        userData.studentInfo = {
          _id: studentData._id,
          studentCode: studentData.studentCode,
          faculty: studentData.facultyId,
          enrollmentYear: studentData.enrollmentYear,
          status: studentData.status
        };
      }
    } else if (user.role === 'teacher') {
      // Import Teacher model dynamically
      const Teacher = (await import('../models/Teacher.js')).default;
      const teacherData = await Teacher.findOne({ userId: user._id })
        .populate('facultyId', 'name code')
        .lean();
      
      if (teacherData) {
        userData.teacherInfo = {
          _id: teacherData._id,
          teacherCode: teacherData.teacherCode,
          faculty: teacherData.facultyId,
          specialization: teacherData.specialization,
          title: teacherData.title
        };
      }
    }
    
    res.json({ success: true, data: userData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, phone }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Chưa chọn file' });
    const avatar = '/uploads/avatars/' + req.file.filename;
    const user = await User.findByIdAndUpdate(req.user._id, { avatar }, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(currentPassword))) return res.status(400).json({ success: false, message: 'Mật khẩu cũ sai' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return res.status(404).json({ success: false, message: 'Email không tồn tại' });
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await Otp.create({ email, code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) });
    res.json({ success: true, message: 'OTP đã gửi (mock)', data: { otp: code } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await Otp.findOne({ email, code: otp });
    if (!record || record.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'OTP không hợp lệ hoặc hết hạn' });
    await Otp.findByIdAndDelete(record._id);
    res.json({ success: true, message: 'Xác thực thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email, isDeleted: false });
    if (!user) return res.status(404).json({ success: false, message: 'Email không tồn tại' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Đặt lại mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
