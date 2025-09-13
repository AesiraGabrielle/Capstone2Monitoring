import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Modal, Button, Offcanvas } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import binLogo from '../assets/bin-logo.png';
import { wasteLevelAPI } from '../services/api';

const Navbar = ({ user, onLogout }) => {
  const location = useLocation();
  const [showWarnings, setShowWarnings] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [warnings, setWarnings] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false); // desktop collapse (md+)
  const [drawerOpen, setDrawerOpen] = useState(false); // mobile side panel

  // Fetch latest bin levels and compute warnings
  useEffect(() => {
    let mounted = true;

    const computeWarnings = (levels) => {
      if (!levels || typeof levels !== 'object') return [];
      const msgs = [];

      const entries = [
        { key: 'bio', label: 'Biodegradable' },
        { key: 'non_bio', label: 'Non Biodegradable' },
        { key: 'unclassified', label: 'Unidentified Waste' },
      ];

      entries.forEach(({ key, label }) => {
        const valRaw = levels[key];
        const level = typeof valRaw === 'number' ? Math.round(valRaw) : null;
        if (level === null) return;
        if (level >= 100) {
          msgs.push(`${label} Bin is Full! Please Clean Up the bin!`);
        } else if (level >= 85) {
          msgs.push(`${label} Bin is Almost Full! Clean up the Bin!`);
        }
      });

      return msgs;
    };

    const load = async () => {
      try {
        const res = await wasteLevelAPI.getLatestLevels();
        if (!mounted) return;
        const newWarnings = computeWarnings(res?.data);
        setWarnings(newWarnings);
      } catch (e) {
        // Silent fail: keep existing warnings
      }
    };

    load();
    const id = setInterval(load, 30000); // refresh every 30s
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

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
          {/* Mobile toggler -> opens side panel */}
          <button
            className="navbar-toggler"
            type="button"
            aria-controls="mobileMenu"
            aria-expanded={drawerOpen}
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
          >
            <span className="navbar-toggler-icon"></span>
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
              <Dropdown align="end">
                <Dropdown.Toggle variant="primary" id="settings-dropdown">
                  Settings
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

      {/* Mobile side panel menu */}
      <Offcanvas show={drawerOpen} onHide={() => setDrawerOpen(false)} placement="start" id="mobileMenu" className="mobile-offcanvas">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="list-group">
            <Link to="/dashboard/bins" className="list-group-item list-group-item-action" onClick={() => setDrawerOpen(false)}>
              Bins
            </Link>
            <Link to="/dashboard/monitoring" className="list-group-item list-group-item-action" onClick={() => setDrawerOpen(false)}>
              Monitoring
            </Link>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

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