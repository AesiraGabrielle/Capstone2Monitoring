import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faGear } from '@fortawesome/free-solid-svg-icons';
import binLogo from '../assets/bin-logo.png';
import { useDashboardData } from '../context/DashboardDataContext';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [showWarnings, setShowWarnings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { levels, warnings, refresh, loading: dataLoading } = useDashboardData() || {};
  const [menuOpen, setMenuOpen] = useState(false); // desktop collapse (md+)
  const [menuModalOpen, setMenuModalOpen] = useState(false); // mobile menu modal
  const warningsRef = useRef(null);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  // Check if the current path is the one specified
  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  // Close warnings on outside click or Escape
  useEffect(() => {
    if (!showWarnings) return;
    const handleClick = (e) => {
      if (warningsRef.current && !warningsRef.current.contains(e.target)) {
        setShowWarnings(false);
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') setShowWarnings(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [showWarnings]);

  return (
    <>
      <nav className="navbar navbar-expand-md navbar-dark">
        <div className="container-fluid">
          <div className="navbar-brand d-flex align-items-center">
            <Link to="/dashboard/bins" className="d-flex align-items-center text-decoration-none">
              <img src={binLogo} alt="Logo" className="avatar me-2" style={{ cursor: 'pointer' }} />
            </Link>
            {(() => {
              const displayName = (user && (user.full_name || user.name || user.email)) || 'User';
              return <span>Welcome {displayName}!</span>;
            })()}
          </div>
          {/* Mobile toggler -> opens modal */}
          <button
            className="navbar-toggler mobile-menu-btn"
            type="button"
            aria-controls="mobileMenu"
            aria-expanded={menuModalOpen}
            aria-label="Open menu"
            onClick={() => setMenuModalOpen(true)}
          >
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>

          {/* Desktop navigation (hidden on mobile) */}
          <div className={`collapse navbar-collapse ${menuOpen ? 'show' : ''}`} id="navbarContent">
            <div className="navbar-nav mx-auto">
              <Link to="/dashboard/bins" className={`nav-link ${isActive('bins') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Bins
              </Link>
              <Link to="/dashboard/monitoring" className={`nav-link ${isActive('monitoring') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
                Monitoring
              </Link>
            </div>

            <div className="d-flex align-items-center ms-md-auto mt-2 mt-md-0">
              {/* Warning button */}
              <div className="me-3 position-relative" ref={warningsRef}>
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
                      {warnings.length === 0 ? (
                        <div className="warning-item text-muted">No warnings</div>
                      ) : (
                        warnings.map((warning, index) => (
                          <div key={index} className="warning-item">
                            {warning}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Settings dropdown */}
              <Dropdown align="end" className="d-none d-md-inline settings-gear-dropdown">
                <Dropdown.Toggle variant="primary" id="settings-dropdown" className="settings-gear-btn" aria-label="Settings">
                  <FontAwesomeIcon icon={faGear} />
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/dashboard/change-password" onClick={() => setMenuOpen(false)}>Change Password</Dropdown.Item>
                  <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu modal */}
      <Modal show={menuModalOpen} onHide={() => setMenuModalOpen(false)} centered className="mobile-menu-modal">
        <Modal.Header closeButton>
          <Modal.Title>Menu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mobile-menu-list">
            <Link to="/dashboard/bins" className="menu-item" onClick={() => setMenuModalOpen(false)}>
              Bins
            </Link>
            <Link to="/dashboard/monitoring" className="menu-item" onClick={() => setMenuModalOpen(false)}>
              Monitoring
            </Link>
            <Link to="/dashboard/change-password" className="menu-item" onClick={() => setMenuModalOpen(false)}>
              Change Password
            </Link>
            <button className="menu-item text-start btn btn-link p-0" onClick={() => { setMenuModalOpen(false); handleLogout(); }}>
              Logout
            </button>
          </div>
        </Modal.Body>
      </Modal>

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