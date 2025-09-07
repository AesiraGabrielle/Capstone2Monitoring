import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';
import Navbar from './Navbar';
import { authAPI } from '../services/api';

const ChangePasswordPage = ({ user, onLogout }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showRe, setShowRe] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
  if (!oldPassword || !newPassword || !confirmPassword) {
      setErrorMessage('All fields are required');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    // Strong password requirement: letter + number + allowed symbol subset
    const strongPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]|:;,.?]).{8,}$/;
    if (!strongPattern.test(newPassword)) {
      setErrorMessage('New password must include letter, number, symbol (!@#$%^&*()_+-={}[]|:;,.?) and be 8+ chars');
      return;
    }

    // Clear any error messages
    setErrorMessage('');
    
    try {
      await authAPI.changePassword({
        current_password: oldPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setShowConfirmation(true);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to change password';
      setErrorMessage(msg);
    }
  };
  
  const handleConfirmation = () => {
    // Close the modal and redirect to bins page
    setShowConfirmation(false);
    navigate('/dashboard/bins');
  };
  
  const handleCancel = () => {
    navigate('/dashboard/bins');
  };

  // Get current date and time
  const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');

  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <h2 className="page-title">Change Password</h2>
        
        <div className="change-password-container">
          <div className="change-password-card">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="oldPassword" className="form-label">Enter Old Password</label>
                <div className="input-group equal-toggle">
                  <input
                    type={showOld ? 'text' : 'password'}
                    className="form-control"
                    id="oldPassword"
                    placeholder="Input Old Password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={`btn ${showOld ? 'btn-primary' : 'btn-outline-secondary'}`}
                    title={showOld ? 'Hide password' : 'Show password'}
                    onClick={() => setShowOld((v) => !v)}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    <img src={`${process.env.PUBLIC_URL}/show-password.png`} alt="Show password" style={{ width: 20, height: 20, filter: 'brightness(0) invert(1)' }} />
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="form-label">Enter New Password</label>
                <div className="input-group equal-toggle">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-control"
                    id="newPassword"
                    placeholder="New Password (letter, number, symbol)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    pattern="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|:;,.?]).{8,}$"
                    title="Letter, number & symbol (!@#$%^&*()_+-={}[]|:;,.?), min 8 chars"
                    minLength={8}
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
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="form-label">Re-Enter Password</label>
                <div className="input-group equal-toggle">
                  <input
                    type={showRe ? 'text' : 'password'}
                    className="form-control"
                    id="confirmPassword"
                    placeholder="Repeat New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    pattern="^(?=.*[A-Za-z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-={}\\[\\]|:;,.?]).{8,}$"
                    title="Letter, number & symbol (!@#$%^&*()_+-={}[]|:;,.?), min 8 chars"
                    minLength={8}
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
              </div>
              
              {errorMessage && (
                <div className="alert alert-danger mb-4">{errorMessage}</div>
              )}
              
              <div className="d-flex justify-content-center gap-3">
                <button 
                  type="button" 
                  className="btn btn-warning cancel-btn"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary change-btn"
                >
                  Change
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Add footer */}
        <div className="footer white">
          © 2025 Leyte Normal University, All rights reserved.
        </div>
      </div>
      
      {/* Success Confirmation Modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)} centered>
        <Modal.Header className="confirmation-modal-header">
          <Modal.Title>Password Changed Successfully!</Modal.Title>
        </Modal.Header>
        <Modal.Body className="confirmation-modal-body">
          <div className="text-center mb-3">
            <i className="fas fa-check-circle confirmation-icon"></i>
          </div>
          <p className="text-center">
            Your password has been changed successfully!
          </p>
          <p className="text-center text-muted small">
            Changed on: {currentDateTime}
          </p>
          <p className="text-center text-muted small">
            User: {user?.email || "Apocalypto513"}
          </p>
        </Modal.Body>
        <Modal.Footer className="confirmation-modal-footer">
          <Button 
            variant="primary" 
            onClick={handleConfirmation}
            className="confirmation-button"
          >
            Return to Dashboard
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ChangePasswordPage;