import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import './Table.css';

const Faculties = () => {
  const [faculties, setFaculties] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const fetch = () => api.get('/faculties').then(({ data }) => setFaculties(data.data));
  useEffect(() => { fetch(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      await api.post('/faculties', { name: fd.get('name'), code: fd.get('code'), description: fd.get('description') });
      toast.success('Tạo khoa thành công');
      setModal(null);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo khoa');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData(e.target);
      await api.put(`/faculties/${editing._id}`, { name: fd.get('name'), code: fd.get('code'), description: fd.get('description') });
      toast.success('Cập nhật khoa thành công');
      setModal(null);
      setEditing(null);
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật khoa');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa khoa "${name}"?`)) return;
    try {
      await api.delete(`/faculties/${id}`);
      toast.success('Xóa khoa thành công');
      fetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa khoa');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý khoa</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setModal('create'); }}>+ Thêm khoa</button>
      </div>
      <div className="table-box">
        <table>
          <thead><tr><th>Mã</th><th>Tên khoa</th><th>Mô tả</th><th>Thao tác</th></tr></thead>
          <tbody>
            {faculties.map((f) => (
              <tr key={f._id}>
                <td>{f.code}</td>
                <td>{f.name}</td>
                <td>{f.description || '-'}</td>
                <td>
                  <button onClick={() => { setEditing(f); setModal('edit'); }}>Sửa</button>
                  <button className="btn-danger" onClick={() => handleDelete(f._id, f.name)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm khoa</h3>
            <form onSubmit={handleCreate}>
              <input name="name" placeholder="Tên khoa" required />
              <input name="code" placeholder="Mã khoa" />
              <input name="description" placeholder="Mô tả" />
              <div>
                <button type="submit">Tạo</button>
                <button type="button" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'edit' && editing && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditing(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Sửa khoa</h3>
            <form onSubmit={handleUpdate}>
              <input name="name" placeholder="Tên khoa" defaultValue={editing.name} required />
              <input name="code" placeholder="Mã khoa" defaultValue={editing.code} />
              <input name="description" placeholder="Mô tả" defaultValue={editing.description} />
              <div>
                <button type="submit">Cập nhật</button>
                <button type="button" onClick={() => { setModal(null); setEditing(null); }}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Faculties;
