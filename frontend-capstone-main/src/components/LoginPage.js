import React, { useState, useEffect, useRef } from 'react';
// ...existing code...
import { /* Link, */ useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import binLogo from '../assets/bin-logo.png'; // You'll need to add this image to your assets folder
import Navbar from './Navbar';
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
  const [passwordResetMsg, setPasswordResetMsg] = useState('');
  // Slide auth state
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  // Register form fields
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regShowConfirm, setRegShowConfirm] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regSuccess, setRegSuccess] = useState('');
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [resendStatus, setResendStatus] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const location = useLocation();
  const emailInputRef = useRef(null);

  // Show success message when redirected after email verification
  useEffect(() => {
    // Derive final status from props or sessionStorage fallback
    const status = verifiedStatus || sessionStorage.getItem('verified_status');
    const reason = verifiedReason || sessionStorage.getItem('verified_reason');
    if (!status) return;
    if (status === '1') {
      try { localStorage.removeItem('token'); localStorage.removeItem('user'); } catch {}
      setVerifiedMsg('Email successfully verified. Please login.');
    } else if (status === '0') {
      if (reason === 'hash') setVerifiedMsg('Verification link is invalid or expired.');
      else if (reason === 'not_found') setVerifiedMsg('User for verification link was not found.');
      else setVerifiedMsg('Email verification failed.');
    }
    // Clear session flags immediately so message only shows once (prevents showing after logout later)
    try {
      sessionStorage.removeItem('verified_status');
      sessionStorage.removeItem('verified_reason');
    } catch {}
    // Focus email field
    setTimeout(() => { emailInputRef.current && emailInputRef.current.focus(); }, 50);
    // Persistent message: remove countdown auto-hide
    setRedirectCountdown(null);
    // Clean URL if needed
    setTimeout(() => {
      if (window.location.search.includes('verified=')) {
        window.history.replaceState({}, document.title, '/login');
      }
    }, 300);
  }, [verifiedStatus, verifiedReason]);
  const [forgotSubmitting, setForgotSubmitting] = useState(false);
  const navigate = useNavigate();

  // One-time password reset success message
  useEffect(() => {
    try {
      if (sessionStorage.getItem('password_reset_success') === '1') {
        setPasswordResetMsg('Password Successfully Changed! Enter your Credentials Again.');
        sessionStorage.removeItem('password_reset_success');
      }
    } catch {}
  }, []);
  
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
  // Ensure any stale verification flags are cleared on successful login
  try { sessionStorage.removeItem('verified_status'); sessionStorage.removeItem('verified_reason'); } catch {}
  onLogin(user);
      navigate('/dashboard/bins');
    } catch (err) {
      let msg = err?.response?.data?.error || err?.response?.data?.message || 'Login failed';
      // Normalize invalid credential responses
      if (/invalid credentials/i.test(msg)) {
        msg = 'Incorrect Email or Password. Please Try Again.';
      }
      // Already using new backend message - just ensure consistency
      if (/incorrect email or password/i.test(msg)) {
        msg = 'Incorrect Email or Password. Please Try Again.';
      }
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

  const validateRegister = () => {
    setRegError('');
    if (!regFullName || !regEmail || !regPassword || !regConfirm) {
      setRegError('All fields are required');
      return false;
    }
    const domainPattern = /^[A-Za-z0-9._%+-]+@lnu\.edu\.ph$/i;
    if (!domainPattern.test(regEmail)) { setRegError('Email must end with @lnu.edu.ph'); return false; }
    if (regPassword !== regConfirm) { setRegError('Passwords do not match'); return false; }
    const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;"'<>.,?/~`]).{8,}$/;
    if (!strongPattern.test(regPassword)) { setRegError('Password must have letter, number, symbol, min 8 chars'); return false; }
    return true;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (!validateRegister()) return;
    // Show confirmation modal first
    setShowConfirmModal(true);
  };

  const confirmAndRegister = async () => {
    setRegSubmitting(true);
    setRegError('');
    try {
      const payload = { full_name: regFullName, email: regEmail, password: regPassword, password_confirmation: regConfirm };
      await authAPI.register(payload);
      setShowConfirmModal(false);
      setRegSuccess('Registration successful. Please verify your email.');
      setShowVerifyModal(true);
      // Switch back to login view but keep modal visible
      setMode('login');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Registration failed';
      setRegError(msg);
    } finally {
      setRegSubmitting(false);
    }
  };
  const handleResend = async () => {
    setResendLoading(true);
    setResendStatus('');
    try {
      await authAPI.resendVerification();
      setResendStatus('Verification email resent. Please check your inbox.');
    } catch (err) {
      setResendStatus('Failed to resend verification email.');
    } finally {
      setResendLoading(false);
    }
  };

  // Add this state for the success message
  const [showVerified, setShowVerified] = useState(false);

  // Optionally show success message on verifiedStatus change
  useEffect(() => {
    if (verifiedStatus === '1') {
      setShowVerified(true);
      // Optionally clear after a few seconds:
      // setTimeout(() => setShowVerified(false), 5000);
    }
  }, [verifiedStatus]);

  return (
    <>
      <Navbar publicMode={true} titleOverride="LNU Waste Monitoring System" disableLogoLink={true} />
      <div className={`login-container auth-views-wrapper login-screen mode-${mode}`}>
        <div className="auth-views">
        {/* View: Login */}
        <div className="auth-view login-view">
          <div className="row g-0 h-100">
            <div className="col-md-6 logo-side d-flex">
              <div className="logo-content">
                <h2 className="mb-4">Welcome to Our Webpage!</h2>
                <p className="text-center mb-4">This is a Webpage for monitoring the waste throwout in Leyte Normal University</p>
                <div className="text-center d-none d-md-block"><img src={binLogo} alt="Recycling Logo" className="logo-img" /></div>
              </div>
            </div>
            <div className="col-md-6 form-side d-flex">
              <div className="login-form w-100">
                <h2 className="mb-3 text-center">Login</h2>
                <form onSubmit={handleSubmit}>
                  {passwordResetMsg && <div className="alert alert-success" role="alert">{passwordResetMsg}</div>}
                  {verifiedMsg && <div className="alert alert-success" role="alert">{verifiedMsg}</div>}
                  {error && <div className="alert alert-danger" role="alert">{error}</div>}
                  <div className="mb-3">
                    <label htmlFor="loginEmail" className="form-label">Email</label>
                    <input type="email" className="form-control" id="loginEmail" placeholder="Input Email" value={email} onChange={(e)=>setEmail(e.target.value)} ref={emailInputRef} required />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="loginPassword" className="form-label">Password</label>
                    <div className="input-group">
                      <input type={showPassword ? 'text':'password'} className="form-control" id="loginPassword" placeholder="Input Password" value={password} onChange={(e)=>setPassword(e.target.value)} required />
                      <button type="button" className={`btn ${showPassword ? 'btn-primary':'btn-outline-secondary'}`} onClick={()=>setShowPassword(v=>!v)} title={showPassword ? 'Hide password':'Show password'} style={{display:'flex',alignItems:'center'}}>
                        <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width:20, height:20, filter:'brightness(0) invert(1)' }} />
                      </button>
                    </div>
                  </div>
                  <div className="action-row d-flex justify-content-between align-items-center mt-4 gap-2">
                    <button type="button" className="btn btn-warning register-btn" onClick={()=>setMode('register')}>REGISTER</button>
                    <button type="submit" className="btn btn-primary login-btn" disabled={loading}>{loading ? (<><Spinner animation="border" size="sm" className="me-2" /> Logging in...</>) : 'LOG IN'}</button>
                  </div>
                  <div className="mt-3 text-center">
                    <button type="button" className="btn btn-link p-0 forgot-password" onClick={openForgot}>Forgot Password?</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* View: Register */}
        <div className="auth-view register-view">
          <div className="row g-0 h-100">
            <div className="col-md-6 form-side d-flex order-md-1 order-2">
              <div className="register-form w-100">
                <h2 className="mb-3 text-center">Register</h2>
                <form onSubmit={handleRegister}>
                  {regSuccess && <div className="alert alert-success" role="alert">{regSuccess}</div>}
                  {regError && <div className="alert alert-danger" role="alert">{regError}</div>}
                  <div className="mb-2">
                    <label htmlFor="regFullName" className="form-label">Full Name</label>
                    <input type="text" className="form-control" id="regFullName" value={regFullName} onChange={(e)=>setRegFullName(e.target.value)} required />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="regEmail" className="form-label">Email (@lnu.edu.ph)</label>
                    <input type="email" className="form-control" id="regEmail" value={regEmail} onChange={(e)=>setRegEmail(e.target.value)} placeholder="name@lnu.edu.ph" required />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="regPassword" className="form-label">Password</label>
                    <div className="input-group">
                      <input type={regShowPassword ? 'text':'password'} className="form-control" id="regPassword" value={regPassword} onChange={(e)=>setRegPassword(e.target.value)} placeholder="8+ chars, letter, number, symbol" required />
                      <button type="button" className={`btn ${regShowPassword ? 'btn-primary':'btn-outline-secondary'}`} onClick={()=>setRegShowPassword(v=>!v)} title={regShowPassword ? 'Hide password':'Show password'} style={{display:'flex',alignItems:'center'}}>
                        <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width:20, height:20, filter:'brightness(0) invert(1)' }} />
                      </button>
                    </div>
                  </div>
                  <div className="mb-2">
                    <label htmlFor="regConfirm" className="form-label">Re-Enter Password</label>
                    <div className="input-group">
                      <input type={regShowConfirm ? 'text':'password'} className="form-control" id="regConfirm" value={regConfirm} onChange={(e)=>setRegConfirm(e.target.value)} placeholder="Repeat Password" required />
                      <button type="button" className={`btn ${regShowConfirm ? 'btn-primary':'btn-outline-secondary'}`} onClick={()=>setRegShowConfirm(v=>!v)} title={regShowConfirm ? 'Hide password':'Show password'} style={{display:'flex',alignItems:'center'}}>
                        <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width:20, height:20, filter:'brightness(0) invert(1)' }} />
                      </button>
                    </div>
                  </div>
                  <div className="action-row d-flex justify-content-between align-items-center mt-4 gap-2">
                    <button type="button" className="btn btn-secondary" onClick={()=>setMode('login')}>BACK TO LOGIN</button>
                    <button type="submit" className="btn btn-primary" disabled={regSubmitting}>{regSubmitting ? 'Creating…':'CREATE ACCOUNT'}</button>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-md-6 logo-side d-flex order-md-2 order-1">
              <div className="logo-content">
                <h2 className="mb-4">Welcome to Our Webpage!</h2>
                <p className="text-center mb-4">This is a Webpage for monitoring the waste throwout in Leyte Normal University</p>
                <div className="text-center d-none d-md-block"><img src={binLogo} alt="Recycling Logo" className="logo-img" /></div>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="footer white">© 2025 Leyte Normal University, All rights reserved.</div>
      </div>

  {/* Confirm Registration Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Confirm Registration</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-2">You're about to create an account using:</p>
          <div><strong>Email:</strong> {regEmail || '(no email entered)'}</div>
          <p className="mt-3 mb-0">Do you want to proceed?</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)} disabled={regSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={confirmAndRegister} disabled={regSubmitting}>{regSubmitting ? 'Creating…' : 'Accept'}</Button>
        </Modal.Footer>
      </Modal>

  {/* Verify Email Modal */}
      <Modal show={showVerifyModal} onHide={() => setShowVerifyModal(false)} centered>
        <Modal.Header>
          <Modal.Title>Registration Successful!</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3" style={{ fontSize: '1rem' }}>
            <span>Your account has been created with email: </span>
            <span style={{ fontWeight: 'bold', verticalAlign: 'middle' }}>{regEmail}</span>
            <br />
            Please check your email and click the verification link to activate your account.<br />
            If you did not receive the email, you can resend it below.
          </div>
          {resendStatus && <div className="mt-2 text-success">{resendStatus}</div>}
        </Modal.Body>
        <Modal.Footer style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <Button variant="primary" onClick={handleResend} disabled={resendLoading} style={{ minWidth: '160px', fontSize: '0.95rem', padding: '6px 12px' }}>
            {resendLoading ? 'Resending...' : 'Resend Verification Email'}
          </Button>
          <Button variant="secondary" onClick={() => setShowVerifyModal(false)} style={{ minWidth: '100px', fontSize: '0.95rem', padding: '6px 12px' }}>Close</Button>
        </Modal.Footer>
      </Modal>

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
    </>
  );
};

export default LoginPage;