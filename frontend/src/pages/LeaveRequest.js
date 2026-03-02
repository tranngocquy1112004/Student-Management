import React from 'react';
import { useNavigate } from 'react-router-dom';
import LeaveRequestForm from '../components/LeaveRequestForm';
import './Table.css';

const LeaveRequest = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Navigate to leave status page after successful submission
    navigate('/leave/status');
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Nộp đơn xin bảo lưu</h1>
      </div>
      <div className="table-box">
        <LeaveRequestForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default LeaveRequest;
