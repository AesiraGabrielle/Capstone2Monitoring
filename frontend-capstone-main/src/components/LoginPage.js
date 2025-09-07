import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import binLogo from '../assets/bin-logo.png'; // You'll need to add this image to your assets folder
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';

const LoginPage = ({ onLogin, verifiedStatus, verifiedReason }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState({ type: '', message: '' });
  const [verifiedMsg, setVerifiedMsg] = useState('');
  const [redirectCountdown, setRedirectCountdown] = useState(null);
  const location = useLocation();
  const emailInputRef = useRef(null);

  // Show success message when redirected after email verification
  useEffect(() => {
    if (!verifiedStatus) return;
    if (verifiedStatus === '1') {
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
      setVerifiedMsg('Email successfully verified. Please login.');
    } else if (verifiedStatus === '0') {
      if (verifiedReason === 'hash') setVerifiedMsg('Verification link is invalid or expired.');
      else if (verifiedReason === 'not_found') setVerifiedMsg('User for verification link was not found.');
      else setVerifiedMsg('Email verification failed.');
    }
    // Focus email field
    setTimeout(() => { emailInputRef.current && emailInputRef.current.focus(); }, 50);
    // Start countdown to hide message (15s)
    let seconds = 15;
    setRedirectCountdown(seconds);
    const interval = setInterval(() => {
      seconds -= 1;
      setRedirectCountdown(seconds);
      if (seconds <= 0) {
        clearInterval(interval);
        setRedirectCountdown(null);
        setVerifiedMsg('');
      }
    }, 1000);
    // Clean URL but only after we processed props
    setTimeout(() => {
      if (window.location.search.includes('verified=')) {
        window.history.replaceState({}, document.title, '/login');
      }
    }, 200);
  }, [verifiedStatus, verifiedReason]);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      const token = res.data?.token || res.data?.access_token;
      if (token) {
        localStorage.setItem('token', token);
      }
  const user = res.data?.user || { email };
  try { localStorage.setItem('user', JSON.stringify(user)); } catch {}
  onLogin(user);
      navigate('/dashboard/bins');
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotEmail(email || '');
    setForgotStatus({ type: '', message: '' });
    setShowForgot(true);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotStatus({ type: '', message: '' });
    setForgotSubmitting(true);
    try {
      const res = await authAPI.forgotPassword(forgotEmail);
      const msg = res?.data?.message || 'If that email exists, a reset link has been sent.';
      setForgotStatus({ type: 'success', message: msg });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Unable to send reset link.';
      setForgotStatus({ type: 'danger', message: msg });
    } finally {
      setForgotSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="row g-0">
          {/* Left Side - Logo and welcome text */}
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
          
          {/* Right Side - Login form */}
          <div className="col-md-6 form-side">
            <div className="login-form">
              <h2 className="mb-4 text-center">Login</h2>
              <form onSubmit={handleSubmit}>
                {verifiedMsg && (
                  <div className="alert alert-success" role="alert">
                    {verifiedMsg}
                    {redirectCountdown !== null && redirectCountdown > 0 && (
                      <span className="ms-2 small text-muted">(Hides in {redirectCountdown}s)</span>
                    )}
                  </div>
                )}
                {error && (
                  <div className="alert alert-danger" role="alert">{error}</div>
                )}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    id="email" 
                    placeholder="Input Email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
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
                      />
                    </button>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mt-4">
                  <Link to="/register" className="btn btn-warning register-btn">REGISTER</Link>
                  <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
                    {loading ? 'Logging in...' : 'LOG IN'}
                  </button>
                </div>
                
                <div className="mt-3 text-center">
                  <button type="button" className="btn btn-link p-0 forgot-password" onClick={openForgot}>Forgot Password?</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add footer */}
      <div className="footer white">
        © 2025 Leyte Normal University, All rights reserved.
      </div>

      {/* Forgot Password Modal */}
      <Modal show={showForgot} onHide={() => setShowForgot(false)} centered>
        <Form onSubmit={handleForgotSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>Forgot Password</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p className="mb-3">Enter your account email. We'll send a password reset link and PIN to that address.</p>
            {forgotStatus.message && (
              <Alert variant={forgotStatus.type}>{forgotStatus.message}</Alert>
            )}
            <Form.Group controlId="forgotEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="name@example.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowForgot(false)} disabled={forgotSubmitting}>Close</Button>
            <Button variant="primary" type="submit" disabled={forgotSubmitting || !forgotEmail}>
              {forgotSubmitting ? (<><Spinner animation="border" size="sm" className="me-2" /> Sending...</>) : 'Send Reset Link'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default LoginPage;