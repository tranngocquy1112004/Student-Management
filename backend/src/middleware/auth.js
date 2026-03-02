import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.isDeleted || user.isLocked) {
      return res.status(401).json({ success: false, message: 'Tài khoản không hợp lệ' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    next();
  };
};

// Alias for authorize (for consistency with routes)
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });
    }
    next();
  };
};

// Check if student is expelled and restrict access
export const checkExpelledStatus = (req, res, next) => {
  const user = req.user;
  
  // If user is dismissed (expelled), block access to most resources
  if (user.status === 'dismissed') {
    // Allow access only to expulsion-related endpoints
    const allowedPaths = [
      '/api/students/expulsions/me',
      '/api/students/expulsions/',
      '/api/students/warnings/me',
      '/api/auth/logout',
      '/api/users/profile'
    ];
    
    const isAllowed = allowedPaths.some(path => req.path.includes(path));
    
    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản đã bị đuổi học. Bạn chỉ có thể xem thông tin đuổi học và gửi đơn khiếu nại.',
        code: 'ACCOUNT_DISMISSED'
      });
    }
  }
  
  next();
};
