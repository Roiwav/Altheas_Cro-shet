import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../context/useUser';

const AdminRoute = () => {
  const { user, isLoading } = useUser(); // Assuming useUser provides a loading state

  if (isLoading) {
    return <div>Loading...</div>; // Or a spinner component
  }

  return user?.role === 'admin' ? <Outlet /> : <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
};

export default AdminRoute;