import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import { authAPI } from '../services/api';
import binLogo from '../assets/bin-logo.png';

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
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Required fields
    if (!fullName || !email || !password || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }

    // Email domain validation
    const domainPattern = /^[A-Za-z0-9._%+-]+@lnu\.edu\.ph$/i;
    if (!domainPattern.test(email)) {
      setErrorMessage('Email must end with @lnu.edu.ph');
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    // Strong password: letter, number, symbol, min 8 chars
    const strongPattern =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/~`]).{8,}$/;
    if (!strongPattern.test(password)) {
      setErrorMessage(
        'Password must have letter, number, symbol (!@#$%^&*()_+-={}[]|:;"\'<>.,?/`~), min 8 chars'
      );
      return;
    }

    setErrorMessage('');
    try {
      setSubmitting(true);
      const payload = {
        full_name: fullName,
        email,
        password,
        password_confirmation: confirmPassword,
      };
      const res = await authAPI.register(payload);
      const token = res.data?.token || res.data?.access_token;
      if (token) localStorage.setItem('token', token);
      setShowConfirmation(true);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmation = () => {
    setShowConfirmation(false);
    navigate('/login');
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="row g-0">
          {/* Left Side */}
          <div className="col-md-6 form-side">
            <div className="register-form">
              <h2 className="mb-4 text-center">Register</h2>
              <form onSubmit={handleSubmit}>
                {/* Full Name */}
                <div className="mb-3">
                  <label htmlFor="fullName" className="form-label">
                    Full Name
                  </label>
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

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    placeholder="name@lnu.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      id="password"
                      placeholder="Password (8+ chars: letter, number, symbol)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showPassword ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      👁
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Re-Enter Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="form-control"
                      id="confirmPassword"
                      placeholder="Repeat Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showConfirmPassword ? 'btn-primary' : 'btn-outline-secondary'}`}
                      onClick={() => setShowConfirmPassword((v) => !v)}
                    >
                      👁
                    </button>
                  </div>
                </div>

                {errorMessage && (
                  <div className="alert alert-danger mb-3">{errorMessage}</div>
                )}

                <div className="d-flex justify-content-between mt-4">
                  <Link to="/login" className="btn btn-secondary">
                    CANCEL
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating…' : 'CREATE ACCOUNT'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Side */}
          <div className="col-md-6 logo-side">
            <div className="logo-content">
              <h2 className="mb-4">Welcome to Our Webpage!</h2>
              <p className="text-center mb-4">
                This is a Webpage for monitoring the waste throwout in Leyte
                Normal University
              </p>
              <div className="text-center">
                <img src={binLogo} alt="Recycling Logo" className="logo-img" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="footer white">
        © 2025 Leyte Normal University, All rights reserved.
      </div>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header>
          <Modal.Title>Verify Your Email</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-center">We sent a verification link to:</p>
          <p className="text-center fw-bold">{email}</p>
          <p className="text-center mb-0">
            Please verify your email to activate your account.
          </p>
        </Modal.Body>
        <Modal.Footer>
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
                setResendMessage('Verification email resent.');
              } catch {
                setResendMessage('Failed to resend email.');
              } finally {
                setResendLoading(false);
              }
            }}
            disabled={resendLoading}
          >
            {resendLoading ? 'Resending…' : 'Resend Email'}
          </Button>
          <Button variant="primary" onClick={handleConfirmation}>
            Go to Login
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default RegisterPage;
