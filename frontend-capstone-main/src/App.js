import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard from './components/Dashboard';
import BinsPage from './components/BinsPage';
import MonitoringPage from './components/MonitoringPage';
import ChangePasswordPage from './components/ChangePasswordPage';
import ResetPasswordPage from './components/ResetPasswordPage';
// import TestConnection from './components/TestConnection';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

    // Set document title
  useEffect(() => {
    document.title = "LNU Trash Monitoring System";
  }, []);

  // Pick up existing JWT token to persist session
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      try {
        const u = JSON.parse(localStorage.getItem('user'));
        if (u) setUser(u);
      } catch {}
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch {}
    setUser(null);
    setIsAuthenticated(false);
  };

  const AppRoutes = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const verified = params.get('verified');
  const forceShowLogin = verified === '1' || verified === '0';
    // If a verification param is present, force a logout in memory so we don't redirect away
    useEffect(() => {
      if (forceShowLogin && isAuthenticated) {
        // Clear in-memory session (token already cleared later in LoginPage if present)
        setIsAuthenticated(false);
        setUser(null);
      }
    }, [forceShowLogin]);
    return (
      <Routes>
        <Route path="/login" element={
          (isAuthenticated && !forceShowLogin) ?
            <Navigate to="/dashboard/bins" /> :
            <LoginPage onLogin={handleLogin} />
        } />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/register" element={
            isAuthenticated ? 
            <Navigate to="/dashboard/bins" /> : 
            <RegisterPage />
          } />
          <Route path="/dashboard" element={
            forceShowLogin ? (
              // Always bounce to login with same query so message appears there
              <Navigate to={`/login${location.search}`} replace />
            ) : isAuthenticated ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" />
            )
          }>
            <Route path="bins" element={<BinsPage />} />
            <Route path="monitoring" element={<MonitoringPage />} />
          </Route>
          <Route path="/dashboard/change-password" element={
            isAuthenticated ? 
            <ChangePasswordPage user={user} onLogout={handleLogout} /> : 
            <Navigate to="/login" />
          } />
          <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  };

  return (
    <Router>
      <div className="app-container">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;