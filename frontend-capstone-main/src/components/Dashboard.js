import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Dashboard = ({ user, onLogout }) => {
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