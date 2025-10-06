import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { DashboardDataProvider, useDashboardData } from '../context/DashboardDataContext';
import { AlertTriangle } from 'lucide-react';

const WarningsPanel = () => {
  const { warnings, markWarningAsRead } = useDashboardData();
  const [open, setOpen] = useState(false);

  return (
    <div className="position-relative ms-auto me-3">
      {/* Warning button */}
      <button
        className="btn btn-warning position-relative"
        onClick={() => setOpen((prev) => !prev)}
      >
        <AlertTriangle size={20} />
        {warnings.length > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            {warnings.length}
          </span>
        )}
      </button>

      {/* Dropdown list of warnings */}
      {open && (
        <div
          className="card position-absolute end-0 mt-2 shadow-lg"
          style={{ width: '300px', zIndex: 1050 }}
        >
          <div className="card-header bg-warning fw-bold">Warnings</div>
          <div className="card-body">
            {warnings.length === 0 ? (
              <div className="text-muted small">No warnings</div>
            ) : (
              warnings.map((w, idx) => (
                <div key={idx} className="d-flex justify-content-between align-items-start mb-2">
                  <span className="text-dark">{w}</span>
                  <button
                    className="btn btn-sm btn-outline-secondary ms-2"
                    onClick={() => markWarningAsRead(idx)}
                  >
                    Read
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DashboardContent = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to /dashboard/bins by default
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/bins', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Track last visited dashboard route
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/') &&
      location.pathname !== '/dashboard' &&
      location.pathname !== '/dashboard/') {
      localStorage.setItem('last_dashboard_route', location.pathname);
    }
  }, [location.pathname]);

  return (
    <div className="dashboard-container">
      <div className="d-flex align-items-center justify-content-between px-3 py-2 bg-primary">
        <Navbar user={user} onLogout={onLogout} />
        {/* ✅ Added warnings button here */}
        <WarningsPanel />
      </div>
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};

const Dashboard = ({ user, onLogout }) => {
  return (
    <DashboardDataProvider>
      <DashboardContent user={user} onLogout={onLogout} />
    </DashboardDataProvider>
  );
};

export default Dashboard;
