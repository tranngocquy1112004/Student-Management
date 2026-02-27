import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import './Table.css';

const Classes = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);

  const fetch = () => {
    const url = user?.role === 'admin' ? '/classes' : '/classes/my-classes';
    return api.get(url).then(({ data }) => setClasses(data.data));
  };
  useEffect(() => {
    fetch();
    if (user?.role === 'admin') {
      api.get('/admin/users', { params: { role: 'teacher' } }).then(({ data }) => setTeachers(data.data));
      api.get('/subjects').then(({ data }) => setSubjects(data.data));
    }
  }, [user?.role]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.post('/classes', {
      name: fd.get('name'),
      subjectId: fd.get('subjectId'),
      teacherId: fd.get('teacherId'),
      semester: fd.get('semester'),
      year: fd.get('year'),
    });
    setModal(null);
    fetch();
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await api.put(`/classes/${editing._id}`, {
      name: fd.get('name'),
      subjectId: fd.get('subjectId'),
      teacherId: fd.get('teacherId'),
      semester: fd.get('semester'),
      year: fd.get('year'),
      status: fd.get('status'),
    });
    setModal(null);
    setEditing(null);
    fetch();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa lớp "${name}"?`)) return;
    await api.delete(`/classes/${id}`);
    fetch();
  };

  const handleStatus = async (c, status) => {
    await api.patch(`/classes/${c._id}/status`, { status });
    fetch();
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{user?.role === 'student' ? 'Lớp của tôi' : 'Quản lý lớp học'}</h1>
        {user?.role === 'admin' && (
          <button className="btn-primary" onClick={() => { setEditing(null); setModal('create'); }}>+ Thêm lớp</button>
        )}
      </div>
      <div className="table-box">
        <table>
          <thead>
            <tr><th>Tên lớp</th><th>Môn học</th><th>GV</th><th>Học kỳ</th><th>Năm học</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.subjectId?.name}</td>
                <td>{c.teacherId?.name}</td>
                <td>{c.semester}</td>
                <td>{c.year}</td>
                <td>{c.status}</td>
                <td>
                  <Link to={`/classes/${c._id}`}>Chi tiết</Link>
                  {user?.role === 'admin' && (
                    <>
                      <button onClick={() => { setEditing(c); setModal('edit'); }}>Sửa</button>
                      <button onClick={() => handleStatus(c, c.status === 'active' ? 'closed' : 'active')}>
                        {c.status === 'active' ? 'Đóng' : 'Mở'}
                      </button>
                      <button className="btn-danger" onClick={() => handleDelete(c._id, c.name)}>Xóa</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal === 'create' && user?.role === 'admin' && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Thêm lớp</h3>
            <form onSubmit={handleCreate}>
              <input name="name" placeholder="Tên lớp" required />
              <select name="subjectId" required>
                <option value="">Chọn môn</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select name="teacherId" required>
                <option value="">Chọn GV</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <input name="semester" placeholder="Học kỳ" />
              <input name="year" placeholder="Năm học" />
              <div>
                <button type="submit">Tạo</button>
                <button type="button" onClick={() => setModal(null)}>Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {modal === 'edit' && editing && user?.role === 'admin' && (
        <div className="modal-overlay" onClick={() => { setModal(null); setEditing(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Sửa lớp</h3>
            <form onSubmit={handleUpdate}>
              <input name="name" placeholder="Tên lớp" defaultValue={editing.name} required />
              <select name="subjectId" defaultValue={editing.subjectId?._id || editing.subjectId} required>
                <option value="">Chọn môn</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
              <select name="teacherId" defaultValue={editing.teacherId?._id || editing.teacherId} required>
                <option value="">Chọn GV</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
              <input name="semester" placeholder="Học kỳ" defaultValue={editing.semester} />
              <input name="year" placeholder="Năm học" defaultValue={editing.year} />
              <select name="status" defaultValue={editing.status}>
                <option value="active">active</option>
                <option value="closed">closed</option>
                <option value="upcoming">upcoming</option>
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

export default Classes;
