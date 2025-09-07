import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Alert, Form, Button, Spinner, Card } from 'react-bootstrap';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const ResetPasswordPage = () => {
  const query = useQuery();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState(query.get('email') || '');
  const [token, setToken] = useState(query.get('token') || '');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRe, setShowRe] = useState(false);

  // Remove token from URL after capturing it for better security
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (q.get('token')) {
      q.delete('token');
      navigate({ pathname: location.pathname, search: q.toString() ? `?${q}` : '' }, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (password.length < 8) {
      setStatus({ type: 'danger', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (password !== password2) {
      setStatus({ type: 'danger', message: 'Passwords do not match.' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await authAPI.resetPassword({ token, email, password, password_confirmation: password2 });
      const msg = res?.data?.message || 'Password reset successful. You can now log in.';
      setStatus({ type: 'success', message: msg });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Password reset failed.';
      setStatus({ type: 'danger', message: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <Card>
            <Card.Body>
              <Card.Title className="mb-3">Reset Password</Card.Title>
              <p className="text-muted">Use the link from your email or paste the token and email below.</p>
              {status.message && <Alert variant={status.type}>{status.message}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                  <Form.Group className="mb-3" controlId="token">
                    <Form.Label>Token (PIN)</Form.Label>
                    <div className="input-group equal-toggle">
                      <Form.Control
                        type={showToken ? 'text' : 'password'}
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className={`btn ${showToken ? 'btn-primary' : 'btn-outline-secondary'}`}
                        title={showToken ? 'Hide token' : 'Show token'}
                        onClick={() => setShowToken((v) => !v)}
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show token" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
                      </button>
                    </div>
                  </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>New Password</Form.Label>
                  <div className="input-group equal-toggle">
                    <Form.Control
                      type={showNew ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showNew ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title={showNew ? 'Hide password' : 'Show password'}
                      onClick={() => setShowNew((v) => !v)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
                    </button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-4" controlId="password2">
                  <Form.Label>Confirm Password</Form.Label>
                  <div className="input-group equal-toggle">
                    <Form.Control
                      type={showRe ? 'text' : 'password'}
                      value={password2}
                      onChange={(e) => setPassword2(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn ${showRe ? 'btn-primary' : 'btn-outline-secondary'}`}
                      title={showRe ? 'Hide password' : 'Show password'}
                      onClick={() => setShowRe((v) => !v)}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
                    </button>
                  </div>
                </Form.Group>
                <div className="d-flex justify-content-between">
                  <Link to="/login" className="btn btn-outline-secondary">Back to Login</Link>
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting ? (<><Spinner animation="border" size="sm" className="me-2" /> Resetting...</>) : 'Reset Password'}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
