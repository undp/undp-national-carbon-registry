import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MRVDashboard from '../mrv/dashboard';
import RegistryDashboard from '../registry/dashboard';

const Dashboard = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RegistryDashboard />} />
        <Route path="product" element={<MRVDashboard />} />
      </Routes>
    </Router>
  );
};

export default Dashboard;
