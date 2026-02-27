import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useAttendanceValidator from '../hooks/useAttendanceValidator';
import './Table.css';

const AttendanceQR = () => {
  const { classId, sessionId } = useParams();
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState(null);
  const [countdown, setCountdown] = useState('');
  const { isValidSchedule, scheduleInfo, errorMessage: scheduleError, validateSchedule } = useAttendanceValidator(classId);

  // Validate schedule when component mounts
  useEffect(() => {
    if (classId) {
      validateSchedule();
    }
  }, [classId, validateSchedule]);

  // Countdown timer
  useEffect(() => {
    if (!scheduleInfo) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const [hours, minutes] = scheduleInfo.startTime.split(':').map(Number);
      const [endHours, endMinutes] = scheduleInfo.endTime.split(':').map(Number);
      
      const startTime = new Date(now);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(now);
      endTime.setHours(endHours, endMinutes, 0, 0);
      
      if (now < startTime) {
        const diff = startTime - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`Lớp học bắt đầu sau: ${mins} phút ${secs} giây`);
      } else if (now > endTime) {
        setCountdown('Lớp học đã kết thúc');
      } else {
        const diff = endTime - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdown(`Lớp học kết thúc sau: ${mins} phút ${secs} giây`);
      }
    };
    
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [scheduleInfo]);

  useEffect(() => {
    if (!sessionId) return;
    api.get(`/classes/${classId}/attendance/sessions`).then(({ data }) => {
      const s = data.data.find(x => x._id === sessionId);
      setSession(s);
    });
  }, [classId, sessionId]);

  const generateCode = async () => {
    try {
      const { data } = await api.post(`/attendance/sessions/${sessionId}/generate-code`, { minutes: 5 });
      setCode(data.data.code);
      setExpiresAt(data.data.expiresAt);
      toast.success('Đã tạo mã');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi');
    }
  };

  const checkInUrl = code ? `${window.location.origin}/check-in/${sessionId}?code=${code}` : `${window.location.origin}/check-in/${sessionId}`;

  return (
    <div className="page">
      <h1>Điểm danh QR</h1>
      
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
          {countdown && <p style={{ margin: '8px 0 0 0', fontWeight: 'bold' }}>{countdown}</p>}
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
      
      {session && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <button 
            className="btn-primary" 
            onClick={generateCode}
            disabled={!isValidSchedule}
            title={!isValidSchedule ? 'Chỉ có thể tạo mã trong giờ học' : ''}
          >
            Tạo mã điểm danh
          </button>
          {code && (
            <>
              <div>
                <h3>1. Quét mã QR</h3>
                <div style={{ background: '#fff', padding: 24, borderRadius: 12 }}>
                  <QRCodeSVG value={checkInUrl} size={200} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3>2. Hoặc nhập mã thủ công</h3>
                <p>Vào link: <a href={checkInUrl.replace(`?code=${code}`, '')} target="_blank" rel="noopener noreferrer">{window.location.origin}/check-in/{sessionId}</a></p>
                <p>Mã 6 chữ số: <strong>{code}</strong></p>
              </div>
              <p>Hết hạn: {expiresAt && new Date(expiresAt).toLocaleTimeString()}</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AttendanceQR;
