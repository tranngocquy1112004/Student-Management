import { useState, useCallback } from 'react';
import api from '../api/axios';

/**
 * Custom hook for validating attendance schedule
 * @param {string} classId - The class ID to validate schedule for
 * @returns {Object} - Validation state and methods
 */
const useAttendanceValidator = (classId) => {
  const [isValidSchedule, setIsValidSchedule] = useState(false);
  const [scheduleInfo, setScheduleInfo] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const validateSchedule = useCallback(async () => {
    if (!classId) {
      setErrorMessage('Class ID is required');
      setIsValidSchedule(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await api.get(`/attendance/validate-schedule/${classId}`);
      
      if (response.data.success) {
        setIsValidSchedule(response.data.valid);
        
        if (response.data.valid) {
          setScheduleInfo(response.data.schedule);
          setErrorMessage('');
        } else {
          setScheduleInfo(response.data.schedule);
          setErrorMessage(response.data.message);
        }
      } else {
        setIsValidSchedule(false);
        setScheduleInfo(null);
        setErrorMessage(response.data.message || 'Validation failed');
      }
    } catch (error) {
      setIsValidSchedule(false);
      setScheduleInfo(null);
      
      if (error.response?.data?.message) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage('Không thể kiểm tra lịch học. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  }, [classId]);

  return {
    isValidSchedule,
    scheduleInfo,
    errorMessage,
    loading,
    validateSchedule
  };
};

export default useAttendanceValidator;
