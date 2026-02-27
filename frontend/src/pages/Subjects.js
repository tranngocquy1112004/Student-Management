import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import './Table.css';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const fetch = () => api.get('/subjects').then(({ data }) => setSubjects(data.data));
  useEffect(() => {
    fetch();
    api.get('/faculties').then(({ data }) => setFaculties(data.data));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post('/subjects', { name: fd.get('name'), code: fd.get('code'), credits: parseInt(fd.get('credits')) || 3, facultyId: fd.get('facultyId') || undefined });
    setModal(null);
    fetch();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.put(`/subjects/${editing._id}`, { name: fd.get('name'), code: fd.get('code'), credits: parseInt(fd.get('credits')) || 3, facultyId: fd.get('facultyId') || undefined });
    setModal(null);
    setEditing(null);
    fetch();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa môn học "${name}"?`)) return;
    await api.delete(`/subjects/${id}`);
    fetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Quản lý môn học</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setModal('create'); }}>+ Thêm môn</button>
      </div>
      <div className="table-box">
        <table>
          <thead><tr><th>Mã</th><th>Tên môn</th><th>Tín chỉ</th><th>Khoa</th><th>Thao tác</th></tr></thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s._id}>
                <td>{s.code}</td>
                <td>{s.name}</td>
                <td>{s.credits}</td>
                <td>{s.facultyId?.name || '-'}</td>
                <td>
                  <button onClick={() => { setEditing(s); setModal('edit'); }}>Sửa</button>
                  <button className="btn-danger" onClick={() => handleDelete(s._id, s.name)}>Xóa</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'create' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm môn học</h3>
            <form onSubmit={handleCreate}>
              <input name="name" placeholder="Tên môn" required />
              <input name="code" placeholder="Mã môn" />
              <input name="credits" type="number" placeholder="Tín chỉ" defaultValue={3} />
              <select name="facultyId">
                <option value="">Chọn khoa</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
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
            <h3>Sửa môn học</h3>
            <form onSubmit={handleUpdate}>
              <input name="name" placeholder="Tên môn" defaultValue={editing.name} required />
              <input name="code" placeholder="Mã môn" defaultValue={editing.code} />
              <input name="credits" type="number" placeholder="Tín chỉ" defaultValue={editing.credits} />
              <select name="facultyId" defaultValue={editing.facultyId?._id || editing.facultyId || ''}>
                <option value="">Chọn khoa</option>
                {faculties.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
              </select>
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

export default Subjects;
