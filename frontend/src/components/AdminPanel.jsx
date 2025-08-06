import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';
import './AdminPanel.css';
import AlertModal from './AlertModal';
import { useNavigate } from 'react-router-dom';

const AdminPanel = ({ user, onClose }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Alert modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  // Helper functions for showing alerts and confirmations
  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      onCancel: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false
    });
  };

  const showConfirmation = (title, message, onConfirm, onCancel = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: () => {
        onConfirm();
        setAlertModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: onCancel || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: true
    });
  };



  // Fetch admin statistics
  const fetchStats = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch statistics');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch users');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete user
  const deleteUser = async (userId, username) => {
    const confirmMessage = `Are you sure you want to delete user "${username}"?\n\nThis will permanently delete:\n• User account\n• All user sessions\n• All user wall designs\n\nThis action cannot be undone.`;
    
    showConfirmation(
      'Delete User',
      confirmMessage,
      async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            // Remove user from list
            setUsers(prev => prev.filter(user => user._id !== userId));
            showAlert('Success', `✅ User "${username}" deleted successfully.\n\nAll associated data has been removed.`, 'success');
          } else {
            const errorData = await response.json();
            showAlert('Error', `❌ Error deleting user: ${errorData.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          showAlert('Error', '❌ Error deleting user. Please try again.', 'error');
        }
      }
    );
  };

  // Create admin user
  const createAdminUser = async (userData) => {
    try {
      const response = await fetch(`/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(prev => [...prev, data.user]);
        showAlert('Success', 'Admin user created successfully.', 'success');
        return true;
      } else {
        const errorData = await response.json();
        showAlert('Error', `Error creating admin user: ${errorData.error || 'Unknown error'}`, 'error');
        return false;
      }
    } catch (error) {
      showAlert('Error', 'Error creating admin user. Please try again.', 'error');
      return false;
    }
  };

  // Promote user to admin
  const promoteToAdmin = async (userId, username) => {
    const confirmMessage = `Are you sure you want to promote "${username}" to admin?\n\nThis will give them full administrative privileges including:\n• User management\n• System statistics access\n• Ability to promote other users\n\nThis action can be reversed by demoting them later.`;
    
    showConfirmation(
      'Promote to Admin',
      confirmMessage,
      async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}/promote`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            // Update user role in the list
            setUsers(prev => prev.map(user => 
              user._id === userId 
                ? { ...user, role: 'admin' }
                : user
            ));
            showAlert('Success', `✅ User "${username}" promoted to admin successfully!\n\nThey can now login as admin and access the admin panel.`, 'success');
          } else {
            const errorData = await response.json();
            showAlert('Error', `❌ Error promoting user: ${errorData.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          showAlert('Error', '❌ Error promoting user. Please try again.', 'error');
        }
      }
    );
  };

  // Demote admin to regular user
  const demoteAdmin = async (userId, username) => {
    const confirmMessage = `Are you sure you want to demote "${username}" from admin to regular user?\n\nThis will remove their administrative privileges:\n• No access to admin panel\n• No user management\n• No system statistics\n\nThey will become a regular user again.`;
    
    showConfirmation(
      'Demote Admin',
      confirmMessage,
      async () => {
        try {
          const response = await fetch(`/api/admin/users/${userId}/demote`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (response.ok) {
            // Update user role in the list
            setUsers(prev => prev.map(user => 
              user._id === userId 
                ? { ...user, role: 'user' }
                : user
            ));
            showAlert('Success', `✅ Admin "${username}" demoted to regular user successfully!\n\nThey will no longer have admin privileges.`, 'success');
          } else {
            const errorData = await response.json();
            showAlert('Error', `❌ Error demoting admin: ${errorData.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          showAlert('Error', '❌ Error demoting admin. Please try again.', 'error');
        }
      }
    );
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const renderDashboard = () => (
    <div className="admin-dashboard">
      <h3>📊 System Statistics</h3>
      {isLoading ? (
        <div className="loading">Loading statistics...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : stats ? (
        <div className="stats-grid">
          <div className="stat-card">
            <h4>👥 Total Users</h4>
            <div className="stat-value">{stats.total_users}</div>
          </div>
          <div className="stat-card">
            <h4>🎨 Total Sessions</h4>
            <div className="stat-value">{stats.total_sessions}</div>
          </div>
          <div className="stat-card">
            <h4>🔧 Admin Users</h4>
            <div className="stat-value">{stats.admin_users}</div>
          </div>
          <div className="stat-card">
            <h4>👤 Regular Users</h4>
            <div className="stat-value">{stats.regular_users}</div>
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderUsers = () => (
    <div className="admin-users">
      <div className="users-header">
        <h3>👥 User Management</h3>
        <div className="search-container">
          <input
            type="text"
            placeholder="Search users by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>
      {searchTerm && (
        <div className="search-results-info">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      )}
      {isLoading ? (
        <div className="loading">Loading users...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-results">
              {searchTerm ? `No users found matching "${searchTerm}"` : 'No users found'}
            </div>
          ) : (
            filteredUsers.map(userItem => (
              <div key={userItem._id} className="user-card">
                <div className="user-info">
                  <h4>{userItem.username}</h4>
                  <p>Email: {userItem.email}</p>
                  <p>Role: <span className={`role-badge ${userItem.role}`}>{userItem.role}</span></p>
                  <p>Created: {new Date(userItem.created_at).toLocaleDateString()}</p>
                  {userItem.last_login && (
                    <p>Last Login: {new Date(userItem.last_login).toLocaleDateString()}</p>
                  )}
                  <p>Sessions: {stats?.recent_sessions?.filter(s => s.user_id === userItem._id).length || 0}</p>
                </div>
                <div className="user-actions">
                  <button
                    className="delete-user-btn"
                    onClick={() => deleteUser(userItem._id, userItem.username)}
                    title="Delete user"
                    disabled={userItem.role === 'admin'}
                  >
                    🗑️ Delete {userItem.role === 'admin' ? '(Protected)' : ''}
                  </button>
                  {userItem.role !== 'admin' && (
                    <button
                      className="promote-user-btn"
                      onClick={() => promoteToAdmin(userItem._id, userItem.username)}
                      title="Promote to Admin"
                    >
                      👑 Make Admin
                    </button>
                  )}
                  {userItem.role === 'admin' && (
                    <button
                      className="demote-user-btn"
                      onClick={() => demoteAdmin(userItem._id, userItem.username)}
                      title="Demote from Admin"
                      disabled={userItem._id === user._id}
                    >
                      👤 Demote Admin {userItem._id === user._id ? '(You)' : ''}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="admin-panel-overlay" onClick={onClose}>
      <div className="admin-panel" onClick={(e) => e.stopPropagation()}>
        <div className="admin-panel-header">
          <h2>🔧 Admin Panel</h2>
          <button className="close-button" onClick={onClose}>close</button>
        </div>
        
        <div className="admin-panel-tabs">
          <button
            className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          <button
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Users
          </button>
        </div>
        
        <div className="admin-panel-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
        </div>
        
        <div className="admin-panel-footer">
          <p>Logged in as: <strong>{user.username}</strong> ({user.role})</p>
        </div>

        {/* Alert Modal */}
        <AlertModal
          isOpen={alertModal.isOpen}
          title={alertModal.title}
          message={alertModal.message}
          type={alertModal.type}
          onConfirm={alertModal.onConfirm}
          onCancel={alertModal.onCancel}
          confirmText={alertModal.confirmText}
          cancelText={alertModal.cancelText}
          showCancel={alertModal.showCancel}
        />
      </div>
    </div>
  );
};

export default AdminPanel; 