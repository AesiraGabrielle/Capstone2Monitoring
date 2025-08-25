import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import binLogo from '../assets/bin-logo.png';
import { authAPI } from '../services/api';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [showWarnings, setShowWarnings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [warnings, setWarnings] = useState([
    "Biodegradable Bin is Almost Full",
    "Non-Biodegradable Bin is Almost Full",
    "Biodegradable Bin Malfunctioned"
  ]);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    try { await authAPI.logout(); } catch (_) {}
    localStorage.removeItem('token');
    onLogout();
  };

  // Check if the current path is the one specified
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <>
      <nav className="navbar navbar-expand navbar-dark">
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center">
            <img src={binLogo} alt="Logo" className="avatar me-2" />
            <span>
              {(() => {
                const email = user?.email || '';
                const base = email.includes('@') ? email.split('@')[0] : 'User';
                const niceBase = base
                  .replace(/[._-]+/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase());
                const name = user?.full_name || user?.name || niceBase || 'User';
                return `Welcome ${name}!`;
              })()}
            </span>
          </div>
          
          <div className="navbar-nav mx-auto">
            <Link to="/dashboard/bins" className={`nav-link ${isActive('bins') ? 'active' : ''}`}>
              Bins
            </Link>
            <Link to="/dashboard/monitoring" className={`nav-link ${isActive('monitoring') ? 'active' : ''}`}>
              Monitoring
            </Link>
          </div>
          
          <div className="d-flex align-items-center">
            {/* Warning button */}
            <div className="me-3 position-relative">
              <button 
                className="btn btn-warning warning-btn"
                onClick={() => setShowWarnings(!showWarnings)}
                aria-label="Warnings"
              >
                <FontAwesomeIcon icon={faExclamationTriangle} />
                {warnings.length > 0 && (
                  <span className="notification-badge">{warnings.length}</span>
                )}
              </button>
              
              {/* Warning dropdown */}
              {showWarnings && (
                <div className="warning-dropdown">
                  <div className="warning-header">Warnings</div>
                  <div className="warning-body">
                    {warnings.map((warning, index) => (
                      <div key={index} className="warning-item">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings dropdown */}
            <Dropdown>
              <Dropdown.Toggle variant="primary" id="settings-dropdown">
                Settings
              </Dropdown.Toggle>

              <Dropdown.Menu>
                <Dropdown.Item as={Link} to="/dashboard/change-password">Change Password</Dropdown.Item>
                <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
        <Modal.Header className="confirmation-modal-header">
          <Modal.Title>Confirm Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body className="confirmation-modal-body">
          <p className="text-center">Are you sure you want to logout?</p>
        </Modal.Body>
        <Modal.Footer className="confirmation-modal-footer">
          <Button 
            variant="secondary" 
            onClick={() => setShowLogoutModal(false)}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={confirmLogout}
            className="confirmation-button"
          >
            Logout
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Navbar;