import React from 'react';
import './SessionModal.css';

const SessionModal = ({ sessions, onLoadSession, onDeleteSession, onClose, isOpen, isLoading = false }) => {
  if (!isOpen) return null;

  const handleLoadSession = (session) => {
    onLoadSession(session);
    onClose();
  };

  const handleDeleteSession = (session) => {
    if (window.confirm(`Are you sure you want to delete "${session.displayName}"?`)) {
      onDeleteSession(session);
    }
  };

  return (
    <div className="session-modal-overlay" onClick={onClose}>
      <div className="session-modal" onClick={(e) => e.stopPropagation()}>
        <div className="session-modal-header">
          <h2>Load Saved Sessions</h2>
          <button className="close-button" onClick={onClose}>
            close
          </button>
        </div>
        
        <div className="session-modal-content">
          {isLoading ? (
            <div className="loading-sessions">
              <div className="loading-spinner"></div>
              <p>Loading sessions from server...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="no-sessions">
              <p>No saved sessions found.</p>
              <p>Create and save a session to see it here.</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {sessions.map((session, index) => (
                <div key={session.key} className="session-card">
                  <div className="session-info">
                    <h3 className="session-name">{session.displayName}</h3>
                    <p className="session-details">
                      <span className="session-type">{session.roomType || 'Unknown'} Room</span>
                      <span className="session-date">
                        {new Date(session.saveDate).toLocaleDateString()}
                      </span>
                    </p>
                    {session.isUpdated && (
                      <span className="updated-badge">Updated</span>
                    )}
                  </div>
                  
                  <div className="session-actions">
                    <button 
                      className="load-button"
                      onClick={() => handleLoadSession(session)}
                      title="Load this session"
                    >
                      📂 Load
                    </button>
                    <button 
                      className="delete-button"
                      onClick={() => handleDeleteSession(session)}
                      title="Delete this session"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="session-modal-footer">
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionModal; 