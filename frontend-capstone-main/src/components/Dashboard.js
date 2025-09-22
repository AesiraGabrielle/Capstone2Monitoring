import React, { useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = ({ user, onLogout }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Only redirect the bare dashboard root to bins. Preserve explicit monitoring route on refresh.
  useEffect(() => {
    if (location.pathname === '/dashboard' || location.pathname === '/dashboard/') {
      navigate('/dashboard/bins', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Track last visited dashboard sub-route for persistence on refresh/login
  useEffect(() => {
    if (location.pathname.startsWith('/dashboard/')) {
      // store only sub-routes (exclude bare /dashboard redirect case)
      if (location.pathname !== '/dashboard' && location.pathname !== '/dashboard/') {
        localStorage.setItem('last_dashboard_route', location.pathname);
      }
    }
  }, [location.pathname]);
  return (
    <div className="dashboard-container">
      <Navbar user={user} onLogout={onLogout} />
      
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;