import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useAttendanceValidator from '../hooks/useAttendanceValidator';
import './Table.css';

const CheckIn = () => {
  const { sessionId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const codeFromUrl = searchParams.get('code');
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [classId, setClassId] = useState(null);
  const { isValidSchedule, scheduleInfo, errorMessage: scheduleError, validateSchedule } = useAttendanceValidator(classId);

  // Fetch session to get classId
  useEffect(() => {
    if (sessionId) {
      api.get(`/attendance/sessions/${sessionId}`).then(res => {
        if (res.data.success && res.data.data) {
          setClassId(res.data.data.classId);
        }
      }).catch(err => {
        console.error('Failed to fetch session:', err);
      });
    }
  }, [sessionId]);

  // Validate schedule when classId is available
  useEffect(() => {
    if (classId) {
      validateSchedule();
    }
  }, [classId, validateSchedule]);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      setError('Chỉ sinh viên mới điểm danh được');
      return;
    }
    if (!sessionId) {
      setError('Link không hợp lệ');
      return;
    }
    if (codeFromUrl) {
      setLoading(true);
      api.post('/attendance/check-in', { code: codeFromUrl, sessionId }).then(() => {
        toast.success('Điểm danh thành công!');
        setDone(true);
      }).catch(err => {
        setError(err.response?.data?.message || 'Điểm danh thất bại');
      }).finally(() => setLoading(false));
    }
  }, [codeFromUrl, sessionId, user]);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualCode.trim()) { toast.error('Nhập mã'); return; }
    setLoading(true);
    setError('');
    try {
      await api.post('/attendance/check-in', { code: manualCode.trim(), sessionId });
      toast.success('Điểm danh thành công!');
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Điểm danh thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: 48, textAlign: 'center' }}>Vui lòng đăng nhập</div>;
  if (user.role !== 'student') return <div style={{ padding: 48, textAlign: 'center' }}>{error || 'Chỉ sinh viên mới điểm danh được'}</div>;

  if (done) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <h2>✓ Đã điểm danh thành công</h2>
      <button className="btn-primary" style={{ marginTop: 24 }} onClick={() => navigate(-1)}>
        Quay về
      </button>
    </div>
  );

  if (codeFromUrl) {
    return <div style={{ padding: 48, textAlign: 'center' }}>{loading ? 'Đang xử lý...' : error && <h2>✗ {error}</h2>}</div>;
  }

  return (
    <div className="page">
      <h1>Điểm danh</h1>
      
      {/* Display schedule validation status */}
      {scheduleInfo && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          backgroundColor: isValidSchedule ? '#e8f5e9' : '#fff3e0',
          borderRadius: 8,
          border: `1px solid ${isValidSchedule ? '#4caf50' : '#ff9800'}`
        }}>
          <h3 style={{ margin: '0 0 8px 0', color: isValidSchedule ? '#2e7d32' : '#e65100' }}>
            {isValidSchedule ? '✓ Trong giờ học' : '⚠ Thông báo'}
          </h3>
          {scheduleInfo.room && <p style={{ margin: '4px 0' }}>Phòng: {scheduleInfo.room}</p>}
          <p style={{ margin: '4px 0' }}>Giờ học: {scheduleInfo.startTime} - {scheduleInfo.endTime}</p>
          {!isValidSchedule && scheduleError && (
            <p style={{ margin: '8px 0 0 0', color: '#d84315', fontWeight: 'bold' }}>{scheduleError}</p>
          )}
        </div>
      )}
      
      {!scheduleInfo && scheduleError && (
        <div style={{ 
          marginBottom: 24, 
          padding: 16, 
          backgroundColor: '#ffebee',
          borderRadius: 8,
          border: '1px solid #ef5350'
        }}>
          <p style={{ margin: 0, color: '#c62828', fontWeight: 'bold' }}>✗ {scheduleError}</p>
        </div>
      )}
      
      <p style={{ marginBottom: 24, color: '#666' }}>Nhập mã 6 chữ số do giảng viên cung cấp để điểm danh.</p>
      <form onSubmit={handleManualSubmit} className="form-box">
        <input
          type="text"
          placeholder="Mã điểm danh (6 chữ số)"
          value={manualCode}
          onChange={e => setManualCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          required
          disabled={!isValidSchedule}
        />
        <button 
          type="submit" 
          className="btn-primary" 
          disabled={loading || !isValidSchedule}
        >
          {loading ? 'Đang xử lý...' : 'Điểm danh'}
        </button>
      </form>
      {error && <p style={{ color: '#c62828', marginTop: 16 }}>✗ {error}</p>}
    </div>
  );
};

export default CheckIn;
