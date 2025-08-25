import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { authAPI } from '../services/api';
import binLogo from '../assets/bin-logo.png'; // You'll need to add this image to your assets folder

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    
    // Clear any previous error messages
    setErrorMessage('');
    
    try {
      const payload = {
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
      };
      const res = await authAPI.register(payload);
      // store token for immediate login, though email verification might be required
      const token = res.data?.token || res.data?.access_token;
      if (token) localStorage.setItem('token', token);
  setShowConfirmation(true);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Registration failed';
      setErrorMessage(msg);
    }
  };
  
  const handleConfirmation = () => {
    // Close the modal and redirect to login page
    setShowConfirmation(false);
    navigate('/login');
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="row g-0">
          {/* Left Side - Form */}
          <div className="col-md-6 form-side">
            <div className="register-form">
              <h2 className="mb-4 text-center">Register</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    id="fullName" 
                    placeholder="Input Full Name" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    placeholder="Input Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      placeholder="Input Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showPassword ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((v) => !v)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <img
                        src={`${process.env.PUBLIC_URL}/show-password.png`}
                        alt="Show password"
                        style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
                        }}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Re-Enter Password</label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      id="confirmPassword"
                      placeholder="Input Password Again"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showConfirmPassword ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <img
                        src={`${process.env.PUBLIC_URL}/show-password.png`}
                        alt="Show password"
                        style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/></svg>';
                        }}
                      />
                    </button>
                  </div>
                </div>
                
                {errorMessage && (
                  <div className="alert alert-danger mb-3">{errorMessage}</div>
                )}
                
                <div className="d-flex justify-content-between mt-4">
                  <Link to="/login" className="btn btn-secondary cancel-btn">CANCEL</Link>
                  <button type="submit" className="btn btn-primary create-btn">CREATE ACCOUNT</button>
                </div>
              </form>
            </div>
          </div>
          
          {/* Right Side - Logo and welcome text */}
          <div className="col-md-6 logo-side">
            <div className="logo-content">
              <h2 className="mb-4">Welcome to Our Webpage!</h2>
              <p className="text-center mb-4">
                This is a Webpage for monitoring the waste throwout in 
                Leyte Normal University
              </p>
              <div className="text-center">
                <img src={binLogo} alt="Recycling Logo" className="logo-img" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add footer */}
      <div className="footer white">
        © 2025 Leyte Normal University, All rights reserved.
      </div>
      
      {/* Verify Email Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header className="confirmation-modal-header">
          <Modal.Title>Verify Your Email</Modal.Title>
        </Modal.Header>
        <Modal.Body className="confirmation-modal-body">
          <div className="text-center mb-3">
            <i className="fas fa-envelope confirmation-icon"></i>
          </div>
          <p className="text-center">
            We sent a verification link to:
          </p>
          <p className="text-center fw-bold">{email}</p>
          <p className="text-center mb-0">
            Please verify your email to activate your account. You can proceed to login after verification.
          </p>
        </Modal.Body>
        <Modal.Footer className="confirmation-modal-footer">
          {resendMessage && (
            <div className="me-auto text-success small">{resendMessage}</div>
          )}
          <Button
            variant="outline-primary"
            onClick={async () => {
              try {
                setResendMessage('');
                setResendLoading(true);
                await authAPI.resendVerification();
                setResendMessage('Verification email resent. Please check your inbox.');
              } catch (e) {
                setResendMessage('Failed to resend email. Try again later.');
              } finally {
                setResendLoading(false);
              }
            }}
            disabled={resendLoading}
          >
            {resendLoading ? 'Resending…' : 'Resend Email'}
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmation}
            className="confirmation-button"
          >
            Go to Login
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RegisterPage;