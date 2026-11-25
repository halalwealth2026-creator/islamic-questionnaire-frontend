import React, { useState } from 'react';
import AdminDashboard from './AdminDashboard';
import AdminLogin from './AdminLogin';
import { getAdminToken } from './auth';

const ProtectedRoute = () => {
  const [token, setToken] = useState(() => getAdminToken());

  if (!token) {
    return <AdminLogin onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  return <AdminDashboard onLoggedOut={() => setToken('')} />;
};

export default ProtectedRoute;
