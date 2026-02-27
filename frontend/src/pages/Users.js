import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';
import './Table.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [role, setRole] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const fetch = () => {
    const params = { page, limit: 10 };
    if (role) params.role = role;
    if (search) params.search = search;
    api.get('/admin/users', { params }).then(({ data }) => {
      setUsers(data.data);
      setPagination(data.pagination || {});
    });
  };

  useEffect(() => { fetch(); }, [page, role]);

  const handleSearch = (e) => { e.preventDefault(); setPage(1); fetch(); };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      await api.post('/admin/users', { name: fd.get('name'), email: fd.get('email'), password: fd.get('password') || '123456', role: fd.get('role') });
      setModal(null);
      fetch();
      toast.success('Đã tạo user');
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleImportCsv = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const file = fd.get('file');
    if (!file?.name) { toast.error('Chọn file CSV'); return; }
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('role', fd.get('role') || 'student');
      const { data } = await api.post('/admin/users/import-csv', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setModal(null);
      fetch();
      toast.success(`Đã import ${data.data?.created || 0} user`);
    } catch (err) { toast.error(err.response?.data?.message || 'Lỗi'); }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.put(`/admin/users/${editingUser._id}`, { name: fd.get('name'), email: fd.get('email'), role: fd.get('role') });
    setModal(null);
    setEditingUser(null);
    fetch();
  };

  const handleDelete = async (id, name) => {
    setConfirm({ title: 'Xóa user', message: `Xóa "${name}"?`, danger: true, onConfirm: async () => {
      await api.delete(`/admin/users/${id}`);
      setConfirm(null);
      fetch();
      toast.success('Đã xóa');
    }, onCancel: () => setConfirm(null) });
  };

  const handleLock = async (id, lock) => {
    await api.patch(`/admin/users/${id}/${lock ? 'lock' : 'unlock'}`);
    fetch();
    toast.success(lock ? 'Đã khóa' : 'Đã mở khóa');
  };

  const handleResetPass = async (id) => {
    await api.patch(`/admin/users/${id}/reset-password`, { newPassword: '123456' });
    toast.success('Đã reset mật khẩu về 123456');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setModal('import')}>Import CSV</button>
          <button className="btn-primary" onClick={() => setModal('create')}>+ Thêm</button>
        </div>
      </div>
      <form onSubmit={handleSearch} className="filters">
        <input placeholder="Tìm theo tên, email" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">Tất cả</option>
          <option value="admin">Admin</option>
          <option value="teacher">Giảng viên</option>
          <option value="student">Học sinh</option>
        </select>
        <button type="submit">Tìm</button>
      </form>
      <div className="table-box">
        <table>
          <thead>
            <tr><th>STT</th><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={u._id}>
                <td>{(page - 1) * 10 + i + 1}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.isLocked ? 'Khóa' : 'Hoạt động'}</td>
                <td>
                  <button onClick={() => { setEditingUser(u); setModal('edit'); }}>Sửa</button>
                  <button onClick={() => handleLock(u._id, !u.isLocked)}>{u.isLocked ? 'Mở' : 'Khóa'}</button>
                  <button onClick={() => handleResetPass(u._id)}>Reset MK</button>
                  <button className="btn-danger" onClick={() => handleDelete(u._id, u.name)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination.total > 10 && (
        <div className="pagination">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Trước</button>
          <span>Trang {page} / {Math.ceil(pagination.total / 10)}</span>
          <button disabled={page >= Math.ceil(pagination.total / 10)} onClick={() => setPage(p => p + 1)}>Sau</button>
        </div>
      )}
      {modal === 'import' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Import CSV</h3>
            <p style={{ fontSize: 12, color: '#666', marginBottom: 12 }}>File cần có cột: Họ tên (hoặc name), Email</p>
            <form onSubmit={handleImportCsv}>
              <select name="role">
                <option value="student">Sinh viên</option>
                <option value="teacher">Giảng viên</option>
              </select>
              <input name="file" type="file" accept=".csv,.xlsx,.xls" required />
              <div><button type="submit">Import</button><button type="button" onClick={() => setModal(null)}>Hủy</button></div>
            </form>
          </div>
        </div>
      )}
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm người dùng</h3>
            <form onSubmit={handleCreate}>
              <input name="name" placeholder="Họ tên" required />
              <input name="email" type="email" placeholder="Email" required />
              <input name="password" type="password" placeholder="Mật khẩu (mặc định 123456)" />
              <select name="role" required>
                <option value="student">Học sinh</option>
                <option value="teacher">Giảng viên</option>
                <option value="admin">Admin</option>
              </select>
              <div>
                <button type="submit">Tạo</button>
                <button type="button" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'edit' && editingUser && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditingUser(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Sửa người dùng</h3>
            <form onSubmit={handleUpdate}>
              <input name="name" placeholder="Họ tên" defaultValue={editingUser.name} required />
              <input name="email" type="email" placeholder="Email" defaultValue={editingUser.email} required />
              <select name="role" defaultValue={editingUser.role} required>
                <option value="student">Học sinh</option>
                <option value="teacher">Giảng viên</option>
                <option value="admin">Admin</option>
              </select>
              <div>
                <button type="submit">Cập nhật</button>
                <button type="button" onClick={() => { setModal(null); setEditingUser(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {confirm && (
        <ConfirmModal
          title={confirm.title}
          message={confirm.message}
          danger={confirm.danger}
          onConfirm={() => { confirm.onConfirm?.(); }}
          onCancel={confirm.onCancel}
        />
      )}
    </div>
  );
};

export default Users;
