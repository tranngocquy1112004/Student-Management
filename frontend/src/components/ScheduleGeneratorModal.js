import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { bulkCreateSchedules } from '../services/scheduleService';
import './ConfirmModal.css';

const ScheduleGeneratorModal = ({ isOpen, onClose, classData, onSchedulesCreated }) => {
  // Form input state
  const [startDate, setStartDate] = useState('');
  const [dayGroup, setDayGroup] = useState(null);
  const [session, setSession] = useState(null);
  const [room, setRoom] = useState('');
  
  // Preview state
  const [previewSchedules, setPreviewSchedules] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setStartDate('');
    setDayGroup(null);
    setSession(null);
    setRoom('');
    setPreviewSchedules([]);
    setIsPreviewMode(false);
    setError(null);
  };

  // Form validation
  const validateForm = () => {
    // Check all required fields are filled
    if (!startDate || !dayGroup || !session || !room.trim()) {
      setError('Vui lòng điền đầy đủ thông tin');
      return false;
    }

    // Validate start date is not in the past
    const selectedDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      setError('Ngày bắt đầu không được ở quá khứ');
      return false;
    }

    // Validate room name contains only valid characters
    const validRoomPattern = /^[a-zA-Z0-9\s\-_.]+$/;
    if (!validRoomPattern.test(room)) {
      setError('Tên phòng học chỉ được chứa chữ cái, số, khoảng trắng và các ký tự - _ .');
      return false;
    }

    return true;
  };

  // Check if form is valid for enabling buttons
  const isFormValid = startDate && dayGroup && session && room.trim();

  // Generate schedules (client-side version matching backend algorithm)
  const generateSchedules = (startDateStr, dayGroupStr, sessionStr, roomStr, remainingLessonsCount) => {
    const schedules = [];
    
    // Map day groups to day of week numbers
    // Vietnamese day naming: Thứ 2 = Monday = 1, Thứ 3 = Tuesday = 2, etc.
    // 0 = Sunday, 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
    const dayOfWeekMap = {
      '2-4-6': [1, 3, 5],  // Thứ 2-4-6 = Monday, Wednesday, Friday
      '3-5-7': [2, 4, 6]   // Thứ 3-5-7 = Tuesday, Thursday, Saturday
    };
    
    // Map sessions to time ranges
    const sessionTimes = {
      'morning': { startTime: '07:30', endTime: '11:30' },
      'afternoon': { startTime: '13:30', endTime: '17:30' }
    };
    
    const targetDays = dayOfWeekMap[dayGroupStr];
    const times = sessionTimes[sessionStr];
    let currentDate = new Date(startDateStr);
    let count = 0;
    
    // Iterate through dates until we have generated all required lessons
    while (count < remainingLessonsCount) {
      const dayOfWeek = currentDate.getDay();
      
      // Check if current day matches the target day group
      if (targetDays.includes(dayOfWeek)) {
        schedules.push({
          dayOfWeek: dayOfWeek,
          startTime: times.startTime,
          endTime: times.endTime,
          room: roomStr,
          startDate: new Date(currentDate),
          endDate: new Date(currentDate),
          isExam: count === remainingLessonsCount - 1  // Last lesson is exam
        });
        count++;
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return schedules;
  };

  // Handle preview button click
  const handlePreview = () => {
    if (!validateForm()) {
      return;
    }

    const remainingLessons = classData.totalLessons - classData.scheduledLessons;
    const schedules = generateSchedules(startDate, dayGroup, session, room, remainingLessons);
    
    setPreviewSchedules(schedules);
    setIsPreviewMode(true);
    setError(null);
  };

  // Handle edit button (go back to form)
  const handleEdit = () => {
    setIsPreviewMode(false);
  };

  // Handle confirm button (submit schedules to backend)
  const handleConfirm = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Prepare schedules data for API
      const schedulesData = previewSchedules.map(schedule => ({
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room,
        startDate: schedule.startDate.toISOString(),
        endDate: schedule.endDate.toISOString(),
        isExam: schedule.isExam
      }));

      // Call API to bulk create schedules
      const response = await bulkCreateSchedules(classData._id, schedulesData);

      // Show success message
      toast.success(response.message || `Đã tạo ${previewSchedules.length} lịch học thành công`);

      // Call callback to refresh schedule list
      if (onSchedulesCreated) {
        onSchedulesCreated();
      }

      // Close modal
      onClose();
    } catch (err) {
      // Handle errors
      const errorMessage = err.response?.data?.message || 'Không thể tạo lịch học, vui lòng thử lại';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Get day of week name in Vietnamese
  const getDayOfWeekName = (dayOfWeek) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[dayOfWeek];
  };

  if (!isOpen) return null;

  // Calculate remaining lessons
  const remainingLessons = classData.totalLessons - classData.scheduledLessons;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
        <h3>Tạo lịch học tự động</h3>
        
        {/* Class Information Display */}
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 16, 
          borderRadius: 8, 
          marginBottom: 20 
        }}>
          <div style={{ marginBottom: 8 }}>
            <strong>Lớp học:</strong> {classData.name}
          </div>
          <div style={{ marginBottom: 8 }}>
            <strong>Môn học:</strong> {classData.subjectName}
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <strong>Tổng số tiết:</strong> {classData.totalLessons}
            </div>
            <div>
              <strong>Đã lên lịch:</strong> {classData.scheduledLessons}
            </div>
            <div style={{ color: '#1976d2' }}>
              <strong>Còn lại:</strong> {remainingLessons}
            </div>
          </div>
        </div>

        {error && (
          <div style={{ 
            backgroundColor: '#ffebee', 
            color: '#c62828', 
            padding: 12, 
            borderRadius: 4, 
            marginBottom: 16 
          }}>
            {error}
          </div>
        )}

        {!isPreviewMode ? (
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Date Picker */}
            <div style={{ marginBottom: 16 }}>
              <label>Ngày bắt đầu: *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setError(null);
                }}
                required
                style={{ width: '100%' }}
              />
            </div>

            {/* Day Group Radio Buttons */}
            <div style={{ marginBottom: 16 }}>
              <label>Nhóm thứ: *</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dayGroup"
                    value="2-4-6"
                    checked={dayGroup === '2-4-6'}
                    onChange={(e) => {
                      setDayGroup(e.target.value);
                      setError(null);
                    }}
                    style={{ marginRight: 8 }}
                  />
                  Thứ 2-4-6
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="dayGroup"
                    value="3-5-7"
                    checked={dayGroup === '3-5-7'}
                    onChange={(e) => {
                      setDayGroup(e.target.value);
                      setError(null);
                    }}
                    style={{ marginRight: 8 }}
                  />
                  Thứ 3-5-7
                </label>
              </div>
            </div>

            {/* Session Radio Buttons */}
            <div style={{ marginBottom: 16 }}>
              <label>Ca học: *</label>
              <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="session"
                    value="morning"
                    checked={session === 'morning'}
                    onChange={(e) => {
                      setSession(e.target.value);
                      setError(null);
                    }}
                    style={{ marginRight: 8 }}
                  />
                  Sáng (07:30-11:30)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="session"
                    value="afternoon"
                    checked={session === 'afternoon'}
                    onChange={(e) => {
                      setSession(e.target.value);
                      setError(null);
                    }}
                    style={{ marginRight: 8 }}
                  />
                  Chiều (13:30-17:30)
                </label>
              </div>
            </div>

            {/* Room Text Input */}
            <div style={{ marginBottom: 16 }}>
              <label>Phòng học: *</label>
              <input
                type="text"
                value={room}
                onChange={(e) => {
                  setRoom(e.target.value);
                  setError(null);
                }}
                placeholder="Nhập tên phòng học (VD: A101)"
                required
                style={{ width: '100%' }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handlePreview}
                disabled={!isFormValid}
              >
                Xem trước
              </button>
              <button 
                type="button" 
                onClick={onClose}
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Preview Display */}
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ marginBottom: 12 }}>Danh sách lịch học ({previewSchedules.length} tiết)</h4>
              
              {/* Summary */}
              <div style={{ 
                backgroundColor: '#e3f2fd', 
                padding: 12, 
                borderRadius: 4, 
                marginBottom: 16 
              }}>
                <div style={{ display: 'flex', gap: 24 }}>
                  <div>
                    <strong>Tiết học thường:</strong> {previewSchedules.length - 1}
                  </div>
                  <div>
                    <strong>Tiết thi:</strong> 1
                  </div>
                </div>
              </div>

              {/* Schedule List */}
              <div style={{ 
                maxHeight: 400, 
                overflowY: 'auto', 
                border: '1px solid #ddd', 
                borderRadius: 4 
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ 
                    backgroundColor: '#f5f5f5', 
                    position: 'sticky', 
                    top: 0 
                  }}>
                    <tr>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Tiết
                      </th>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Ngày
                      </th>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Thứ
                      </th>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Giờ
                      </th>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Phòng
                      </th>
                      <th style={{ padding: 8, textAlign: 'left', borderBottom: '2px solid #ddd' }}>
                        Loại
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewSchedules.map((schedule, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid #eee',
                        backgroundColor: schedule.isExam ? '#fff3e0' : 'white'
                      }}>
                        <td style={{ padding: 8 }}>{index + 1}</td>
                        <td style={{ padding: 8 }}>{formatDate(schedule.startDate)}</td>
                        <td style={{ padding: 8 }}>{getDayOfWeekName(schedule.dayOfWeek)}</td>
                        <td style={{ padding: 8 }}>{schedule.startTime}-{schedule.endTime}</td>
                        <td style={{ padding: 8 }}>{schedule.room}</td>
                        <td style={{ padding: 8 }}>
                          {schedule.isExam ? (
                            <span style={{ 
                              backgroundColor: '#ff9800', 
                              color: 'white', 
                              padding: '2px 8px', 
                              borderRadius: 4, 
                              fontSize: 12 
                            }}>
                              Thi
                            </span>
                          ) : (
                            <span style={{ color: '#666' }}>Học</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button 
                type="button" 
                className="btn-primary"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Đang tạo...' : 'Xác nhận'}
              </button>
              <button 
                type="button" 
                onClick={handleEdit}
                disabled={isSubmitting}
              >
                Sửa
              </button>
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleGeneratorModal;
