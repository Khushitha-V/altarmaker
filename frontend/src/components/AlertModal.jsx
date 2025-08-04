import React from 'react';
import './AlertModal.css';

const AlertModal = ({ 
  isOpen, 
  title, 
  message, 
  type = 'info', // 'info', 'success', 'warning', 'error'
  onConfirm, 
  onCancel, 
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false 
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="alert-modal-overlay" onClick={handleCancel}>
      <div className={`alert-modal alert-modal-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-header">
          <div className="alert-icon">{getIcon()}</div>
          <h3 className="alert-title">{title}</h3>
        </div>
        
        <div className="alert-modal-content">
          <p className="alert-message">{message}</p>
        </div>
        
        <div className="alert-modal-footer">
          {showCancel && (
            <button 
              className="alert-button alert-button-cancel" 
              onClick={handleCancel}
            >
              {cancelText}
            </button>
          )}
          <button 
            className="alert-button alert-button-confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal; 