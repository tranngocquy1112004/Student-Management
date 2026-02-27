import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Hệ thống Quản Lý Lớp Học</h1>
        <form onSubmit={handleSubmit}>
          {error && <div className="error-msg">{error}</div>}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit">Đăng nhập</button>
        </form>
        <p className="login-hint">Admin: admin@school.vn | GV: giangvien@school.vn | SV: sinhvien@school.vn | Pass: 123456</p>
        <p><Link to="/forgot-password">Quên mật khẩu?</Link></p>
      </div>
    </div>
  );
};

export default Login;
