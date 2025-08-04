import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

const Home = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const API_BASE_URL = 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      if (authMode === 'register') {
        // Registration flow - only for users, not admins
        if (loginMode === 'admin') {
          setError('Admin registration is not allowed. Please contact the administrator.');
          setIsLoading(false);
          return;
        }

        if (!username.trim() || !password.trim() || !email.trim()) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            password: password,
            email: email.trim(),
            role: 'user' // Always register as user
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setSuccess('Registration successful!');
          onLogin(data.user);
          navigate('/main');
        } else {
          setError(data.error || 'Registration failed');
        }
      } else {
        // Login flow
        if (!username.trim() || !password.trim()) {
          setError('Please enter both username/email and password');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            password: password,
            role: loginMode
          }),
        });

        const data = await response.json();

        if (response.ok) {
          onLogin(data.user);
          navigate('/main');
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setAuthMode(authMode === 'login' ? 'register' : 'login');
    setError('');
    setSuccess('');
  };

  const toggleLoginMode = () => {
    const newMode = loginMode === 'user' ? 'admin' : 'user';
    setLoginMode(newMode);
    setError('');
    setSuccess('');
    
    // If switching to admin mode, force login mode
    if (newMode === 'admin') {
      setAuthMode('login');
    }
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <div className="logo-section">
          <img src="/logo/logo.png" alt="Altar Maker" className="logo" />
          <h1 className="app-title">Altar Maker</h1>
          <p className="app-subtitle">Create beautiful spiritual spaces</p>
        </div>
        
        <div className="login-section">
          <div className={`login-card ${authMode === 'register' ? 'register-mode' : ''}`}>
            <div className="auth-mode-toggle">
              <button
                className={`toggle-btn ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => setAuthMode('login')}
              >
                🔐 Login
              </button>
              {loginMode === 'user' && (
                <button
                  className={`toggle-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => setAuthMode('register')}
                >
                  📝 Register
                </button>
              )}
            </div>

            <div className="login-mode-toggle">
              <button
                className={`toggle-btn ${loginMode === 'user' ? 'active' : ''}`}
                onClick={() => setLoginMode('user')}
              >
                👤 User
              </button>
              <button
                className={`toggle-btn ${loginMode === 'admin' ? 'active' : ''}`}
                onClick={() => setLoginMode('admin')}
              >
                🔧 Admin
              </button>
            </div>

            <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
            <p>
              {authMode === 'login' 
                ? 'Sign in to access your altar design studio' 
                : loginMode === 'admin' 
                  ? 'Admin registration is not allowed. Please contact the administrator.'
                  : 'Create a new user account to get started'
              }
            </p>
            
            <form onSubmit={handleSubmit} className="login-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}
              
              <div className="form-group">
                <label htmlFor="username">
                  {authMode === 'login' ? 'Username or Email' : 'Username'}
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={authMode === 'login' ? 'Enter username or email' : 'Enter username'}
                  required
                />
              </div>

              {authMode === 'register' && loginMode === 'user' && (
                <>
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                      type="password"
                      id="confirm-password"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="terms">
                      <input type="checkbox" id="terms" required />
                      I agree to the Terms of Service and Privacy Policy
                    </label>
                  </div>
                </>
              )}
              
              {authMode === 'login' && (
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              )}

              <button 
                type="submit" 
                className={`login-button ${loginMode === 'admin' ? 'admin' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 
                  authMode === 'login' ? 'Sign In' : 'Create Account'
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 