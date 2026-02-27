import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({ title, message, onConfirm, onCancel, confirmText = 'Xác nhận', cancelText = 'Hủy', danger = false }) => (
  <div className="modal-overlay confirm-overlay" onClick={onCancel}>
    <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
      <h3>{title}</h3>
      <p>{message}</p>
      <div className="confirm-actions">
        <button className="btn-cancel" onClick={onCancel}>{cancelText}</button>
        <button className={danger ? 'btn-danger-confirm' : 'btn-confirm'} onClick={onConfirm}>{confirmText}</button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
