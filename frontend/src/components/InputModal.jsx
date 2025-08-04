import React, { useState, useEffect } from 'react';
import './InputModal.css';

const InputModal = ({ 
  isOpen, 
  title, 
  message, 
  defaultValue = '',
  placeholder = '',
  onConfirm, 
  onCancel, 
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const [inputValue, setInputValue] = useState(defaultValue);

  // Reset input value when modal opens
  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(inputValue);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="input-modal-overlay" onClick={handleCancel}>
      <div className="input-modal" onClick={(e) => e.stopPropagation()}>
        <div className="input-modal-header">
          <div className="input-icon">📝</div>
          <h3 className="input-title">{title}</h3>
        </div>
        
        <div className="input-modal-content">
          <p className="input-message">{message}</p>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="input-field"
            autoFocus
          />
        </div>
        
        <div className="input-modal-footer">
          <button 
            className="input-button input-button-cancel" 
            onClick={handleCancel}
          >
            {cancelText}
          </button>
          <button 
            className="input-button input-button-confirm" 
            onClick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputModal; 