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
  const [restrictedStatus, setRestrictedStatus] = useState(null); // 'on_leave' or 'dismissed'

  const fetch = async () => {
    try {
      const url = user?.role === 'admin' ? '/classes' : '/classes/my-classes';
      const { data } = await api.get(url);
      setClasses(data.data);
      setRestrictedStatus(null);
    } catch (error) {
      // If user is restricted, show friendly message
      if (error.response?.status === 403) {
        setClasses([]);
        const code = error.response?.data?.code;
        const message = error.response?.data?.message || '';
        
        if (code === 'ACCOUNT_DISMISSED' || message.includes('đuổi học') || message.includes('dismissed')) {
          setRestrictedStatus('dismissed');
        } else {
          setRestrictedStatus('on_leave');
        }
      } else {
        console.error('Error fetching classes:', error);
      }
    }
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
      totalLessons: fd.get('totalLessons') ? parseInt(fd.get('totalLessons')) : undefined,
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
      totalLessons: fd.get('totalLessons') ? parseInt(fd.get('totalLessons')) : undefined,
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
          <button 
            className="btn btn-primary" 
            onClick={() => { setEditing(null); setModal('create'); }}
          >
            + Thêm lớp
          </button>
        )}
      </div>
      {restrictedStatus === 'dismissed' && user?.role === 'student' && (
        <div style={{
          backgroundColor: '#f8d7da',
          border: '1px solid #f5c6cb',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#721c24', marginTop: 0 }}>
            🚫 Tài khoản của bạn đã bị đuổi học
          </h3>
          <p style={{ color: '#721c24', marginBottom: '16px' }}>
            Bạn không thể truy cập các lớp học.
          </p>
          <Link 
            to="/student/expulsion" 
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            Xem quyết định đuổi học
          </Link>
        </div>
      )}
      {restrictedStatus === 'on_leave' && user?.role === 'student' && (
        <div style={{
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          padding: '20px',
          margin: '20px 0',
          textAlign: 'center'
        }}>
          <h3 style={{ color: '#856404', marginTop: 0 }}>
            ⚠️ Bạn đang trong thời gian bảo lưu
          </h3>
          <p style={{ color: '#856404', marginBottom: '16px' }}>
            Bạn không thể truy cập các lớp học trong thời gian bảo lưu.
          </p>
          <Link 
            to="/leave/status" 
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: '#ffc107',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '4px',
              fontWeight: '500'
            }}
          >
            Xem trạng thái đơn bảo lưu
          </Link>
        </div>
      )}
      <div className="table-box">
        <table>
          <thead>
            <tr><th>Tên lớp</th><th>Môn học</th><th>GV</th><th>Học kỳ</th><th>Năm học</th><th>Số tiết</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c._id}>
                <td>{c.name}</td>
                <td>{c.subjectId?.name}</td>
                <td>{c.teacherId?.name}</td>
                <td>{c.semester}</td>
                <td>{c.year}</td>
                <td>
                  {c.totalLessons ? (
                    <span>
                      {c.scheduledLessons || 0}/{c.totalLessons}
                    </span>
                  ) : (
                    <span style={{ color: '#999' }}>-</span>
                  )}
                </td>
                <td>{c.status}</td>
                <td>
                  {!restrictedStatus && (
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.href = `/classes/${c._id}`}
                    >
                      Chi tiết
                    </button>
                  )}
                  {restrictedStatus && user?.role === 'student' && (
                    <span style={{ color: '#999', fontStyle: 'italic' }}>Không khả dụng</span>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => { setEditing(c); setModal('edit'); }}
                      >
                        Sửa
                      </button>
                      <button 
                        className="btn btn-outline"
                        onClick={() => handleStatus(c, c.status === 'active' ? 'closed' : 'active')}
                      >
                        {c.status === 'active' ? 'Đóng' : 'Mở'}
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(c._id, c.name)}
                      >
                        Xóa
                      </button>
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
              <input 
                name="totalLessons" 
                type="number" 
                placeholder="Tổng số tiết (tùy chọn)" 
                min="1"
                max="200"
              />
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
              <input 
                name="totalLessons" 
                type="number" 
                placeholder="Tổng số tiết (tùy chọn)" 
                defaultValue={editing.totalLessons || ''}
                min="1"
                max="200"
              />
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
