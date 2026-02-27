import React, { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const Profile = () => {
  const [pass, setPass] = useState({ current: '', new: '', confirm: '' });

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pass.new !== pass.confirm) { toast.error('Mật khẩu mới không khớp'); return; }
    try {
      await api.put('/auth/change-password', { currentPassword: pass.current, newPassword: pass.new });
      toast.success('Đổi mật khẩu thành công');
      setPass({ current: '', new: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  return (
    <div className="page">
      <h1>Đổi mật khẩu</h1>
      <form onSubmit={handleChangePassword} className="form-box">
        <input type="password" placeholder="Mật khẩu hiện tại" value={pass.current} onChange={e => setPass({ ...pass, current: e.target.value })} required />
        <input type="password" placeholder="Mật khẩu mới" value={pass.new} onChange={e => setPass({ ...pass, new: e.target.value })} required />
        <input type="password" placeholder="Xác nhận mật khẩu mới" value={pass.confirm} onChange={e => setPass({ ...pass, confirm: e.target.value })} required />
        <button type="submit">Đổi mật khẩu</button>
      </form>
    </div>
  );
};

export default Profile;
