export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = 'Lỗi máy chủ';

  if (err.message) message = err.message;
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    message = 'Dữ liệu đã tồn tại';
  }
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token không hợp lệ';
  }
  if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') message = 'File quá lớn';
    else message = err.message;
  }

  console.error(err);
  res.status(statusCode).json({ success: false, message });
};
