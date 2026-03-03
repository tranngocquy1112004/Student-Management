import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner">
        <div className="spinner-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <p>Đang tải...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
