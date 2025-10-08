import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useUser } from '../../context/useUser';

const AdminRoute = () => {
  const { user, isLoading } = useUser(); // Assuming useUser provides a loading state
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/login" state={{ from: location }} replace />;
};

export default AdminRoute;