import React from 'react';
import './Loading.css';

export const Loading = () => (
  <div className="loading-spinner">
    <div className="spinner" />
  </div>
);

export const PageLoading = () => (
  <div className="page-loading">
    <div className="spinner" />
    <p>Đang tải...</p>
  </div>
);
