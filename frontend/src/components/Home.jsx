import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './Home.css';

const Home = ({ onLogin }) => {
  const [username, setUsername] = useState(() => {
    const savedData = localStorage.getItem('registrationData');
    return savedData ? JSON.parse(savedData).username : '';
  });
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState(() => {
    const savedData = localStorage.getItem('registrationData');
    return savedData ? JSON.parse(savedData).email : '';
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loginMode, setLoginMode] = useState('user'); // 'user' or 'admin'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const validatePassword = (password) => {
    if (password.length < 8) return 'Password must be at least 8 characters long';
    if (!/[A-Z]/.test(password)) return 'Must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Must contain at least one lowercase letter';
    if (!/\d/.test(password)) return 'Must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Must contain at least one special character';
    return '';
  };

  // Check for verification success in URL
  useEffect(() => {
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccess('Email verified successfully! You can now log in.');
      // Clear the URL parameter without refreshing the page
      navigate(window.location.pathname, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (authMode === 'register' && loginMode === 'user') {
      // Client-side validation for registration
      if (passwordError) {
        setError('Please fix password requirements');
        setIsLoading(false);
        return;
      }

      const confirmPassword = e.target.elements['confirm-password']?.value;
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Save registration data to localStorage
      const registrationData = { email, username };
      localStorage.setItem('registrationData', JSON.stringify(registrationData));
    }

    try {
      if (authMode === 'register') {
        // Registration flow
        if (!username.trim() || !email.trim() || !password.trim()) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }

        // Password validation
        if (password.length < 8) {
          setError('Password must be at least 8 characters long');
          setIsLoading(false);
          return;
        }

        // Email validation
        if (!email.includes('@') || !email.includes('.')) {
          setError('Please enter a valid email address');
          setIsLoading(false);
          return;
        }

        // Clear any previous errors
        setError('');

        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: password,
            role: 'user' // Always register as user
          }),
        });

        const data = await response.json();

        if (response.ok) {
          if (data.email_sent) {
            setShowVerificationMessage(true);
            setSuccess(data.message);
            // Clear the form on successful registration
            setUsername('');
            setEmail('');
            setPassword('');
          } else {
            setSuccess('Registration successful! Please check your email for verification.');
            // Clear the form
            setUsername('');
            setEmail('');
            setPassword('');
          }
          // Don't switch to login mode automatically - let them see the success message
        } else {
          if (response.status === 409) {
            setError('An account with this email or username already exists. Please try logging in or use a different email/username.');
          } else {
            setError(data.error || 'Registration failed. Please try again.');
          }
        }
      } else {
        // Login flow
        if (!username.trim() || !password.trim()) {
          setError('Please enter both username/email and password');
          setIsLoading(false);
          return;
        }

        const loginData = {
          username: username.trim(),
          password: password,
          // Only send role if in admin mode to avoid role mismatch errors
          ...(loginMode === 'admin' && { role: 'admin' })
        };

        console.log('Sending login request...', {
          url: '/api/auth/login',
          ...loginData,
          password: '[REDACTED]' // Don't log actual password
        });

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(loginData),
        });

        const data = await response.json();
        console.log('Login response:', { 
          status: response.status, 
          statusText: response.statusText,
          data,
          headers: Object.fromEntries([...response.headers.entries()])
        });

        if (response.ok) {
          if (data.user) {
            handleLoginSuccess(data.user);
            navigate('/main');
          } else {
            console.error('Login successful but no user data received:', data);
            setError('Login failed: Invalid response from server');
          }
        } else {
          const errorMessage = data.message || data.error || `Login failed with status ${response.status}`;
          console.error('Login failed:', { 
            status: response.status, 
            statusText: response.statusText,
            error: errorMessage,
            data
          });
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('Request failed:', error);
      setError(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsLoading(true);
    try {
      // Try to get email from state first, then from saved data
      const emailToUse = email.trim() || (() => {
        const savedData = localStorage.getItem('registrationData');
        return savedData ? JSON.parse(savedData).email : '';
      })();

      if (!emailToUse) {
        setError('No email found. Please fill out the registration form again.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`/api/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: emailToUse,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(data.message || 'Verification email resent successfully!');
      } else {
        setError(data.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSuccess = (userData) => {
    // Clear saved registration data on successful login
    localStorage.removeItem('registrationData');
    if (onLogin) {
      onLogin(userData);
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
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authMode === 'register') {
                          setPasswordError(validatePassword(e.target.value));
                        }
                      }}
                      placeholder="Enter your password (min 8 chars, with uppercase, lowercase, number & special char)"
                      required
                      minLength={8}
                      pattern=".{8,}"
                      title="Password must be at least 8 characters long"
                    />
                    <div className="password-constraints">
                      <p>Password must contain:</p>
                      <div className={`constraint ${password.length >= 8 ? 'valid' : ''}`}>• 8+ characters</div>
                      <div className={`constraint ${/[A-Z]/.test(password) ? 'valid' : ''}`}>• Uppercase letter</div>
                      <div className={`constraint ${/[a-z]/.test(password) ? 'valid' : ''}`}>• Lowercase letter</div>
                      <div className={`constraint ${/\d/.test(password) ? 'valid' : ''}`}>• Number</div>
                      <div className={`constraint ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'valid' : ''}`}>
                        • Special character
                      </div>
                      {passwordError && (
                        <div className="error-message">{passwordError}</div>
                      )}
                    </div>
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
              {error && <div className="error-message">{error}</div>}
              {success && (
                <div className="success-message">
                  {success}
                  {showVerificationMessage && (
                    <div className="resend-verification">
                      <p>Didn't receive the email?</p>
                      <button 
                        type="button" 
                        className="resend-button"
                        onClick={handleResendVerification}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 