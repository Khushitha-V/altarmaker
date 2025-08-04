import React from "react";

// Styled Logo Component
const StyledLogo = () => {
  return (
    <div style={{
      fontFamily: "'Playfair Display', serif",
      color: '#72383d',
      fontWeight: 100,
      fontSize: '40px',
      display: 'flex',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '40px', verticalAlign: 'middle' }}>A</span>
      <span style={{ fontSize: '30px', verticalAlign: 'middle' }}>ltar</span>
      <span style={{ fontSize: '40px', verticalAlign: 'middle' }}>M</span>
      <span style={{ fontSize: '30px', verticalAlign: 'middle' }}>aker</span>
    </div>
  );
};

const Header = ({ loadRoomDesign, newSession, user, onLogout, onAdminPanel }) => {
  return (
    <header style={{
      backgroundColor: '#4a1c40',
      color: 'white',
      padding: '16px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff'
        }}>
          <img 
            src="/logo/logo.png" 
            alt="Logo" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        </div>
        <div>
          <StyledLogo />
        </div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* User info */}
        {user && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            backgroundColor: user.role === 'admin' ? '#c8a2c8' : '#ffddbf',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500',
            border: user.role === 'admin' ? '1px solid rgba(220, 53, 69, 0.3)' : 'none'
          }}>
            <span>{user.role === 'admin' ? '🔧' : '👤'}</span>
            <span style ={{color: user.role=== 'admin' ?'#44337a':'#ff7f00', fontWeight: 'bold'}}>
              {user.username}
            </span>
            <span style={{
              fontSize: '12px',
              opacity: '0.8',
              textTransform: 'uppercase',
              fontWeight: 'bold',
              color: user.role === 'admin' ? '#44337a' : '#ff7f00',
            }}>
              ({user.role})
            </span>
          </div>
        )}
        
        <button
          id="new-session-btn"
          name="new-session-btn"
          onClick={newSession}
          style={{
            padding: '8px 16px',
            background: '#d2e4e8',
            color: '#0066cc',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#87ceeb';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#87ceeb';
          }}
          aria-label="Start new session and clear all walls"
        >
          🆕 New Design
        </button>
        <button
          id="load-room-design-btn"
          name="load-room-design-btn"
          onClick={loadRoomDesign}
          style={{
            padding: '8px 16px',
            background: '#98FB98',
            color: '#228B22',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#98FB98';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#98FB98';
          }}
          aria-label="Load room design from saved session"
        >
          📂 Load Design
        </button>
        
        {/* Admin Panel button - only for admin users */}
        {user && user.role === 'admin' && (
          <button
            className="admin-panel-btn"
            onClick={onAdminPanel}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ffd4a3 !important',
              background: '#ffd4a3 !important',
              color: '#d2691e !important',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#ffb366';
              e.target.style.background = '#ffb366';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#ffd4a3';
              e.target.style.background = '#ffd4a3';
            }}
            aria-label="Admin Panel"
          >
            ⚙️ Admin Panel
          </button>
        )}
        
        {/* Logout button */}
        {user && onLogout && (
          <button
            onClick={onLogout}
            style={{
              padding: '8px 16px',
              background: '#ffb6c1',
              color: '#dc143c',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#ffb6c1';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#ffb6c1';
            }}
            aria-label="Logout"
          >
            🚪 Logout
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
