import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Login.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleForgot = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      toast.success(data.message || 'Đã gửi OTP');
      if (data.data?.otp) toast.success('OTP (demo): ' + data.data.otp);
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('Xác thực thành công');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP không hợp lệ');
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/reset-password', { email, newPassword });
      toast.success('Đặt lại mật khẩu thành công');
      window.location.href = '/login';
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Quên mật khẩu</h1>
        {step === 1 && (
          <form onSubmit={handleForgot}>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
            <button type="submit">Gửi OTP</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={handleVerify}>
            <input type="text" placeholder="Nhập OTP (6 số)" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required />
            <button type="submit">Xác thực</button>
            <button type="button" onClick={() => setStep(1)}>Quay lại</button>
          </form>
        )}
        {step === 3 && (
          <form onSubmit={handleReset}>
            <input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} required />
            <button type="submit">Đặt lại mật khẩu</button>
          </form>
        )}
        <p><Link to="/login">← Đăng nhập</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
