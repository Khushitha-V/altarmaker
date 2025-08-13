import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email...');
  const navigate = useNavigate();

  useEffect(() => {
    const verifyEmailToken = async () => {
      const token = searchParams.get('token');
      
      if (!token) {
        setStatus('error');
        setMessage('No verification token provided.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
          credentials: 'include',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Your email has been verified successfully! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify email. The link may be invalid or expired.');
        }
      } catch (error) {
        console.error('Error verifying email:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your email. Please try again later.');
      }
    };

    verifyEmailToken();
  }, [searchParams]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h2>Email Verification</h2>
        <div className={`status-message ${status}`}>
          {status === 'verifying' && (
            <div className="loading-spinner"></div>
          )}
          <p>{message}</p>
        </div>
        {status === 'success' && (
          <button onClick={handleLoginClick} className="login-button">
            Go to Login
          </button>
        )}
        {status === 'error' && (
          <div className="error-actions">
            <p>Please try the following:</p>
            <ul>
              <li>Make sure you're using the most recent verification link from your email</li>
              <li>Check if you're already verified by trying to log in</li>
              <li>Contact support if the problem persists</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
