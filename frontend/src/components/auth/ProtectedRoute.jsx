import { Navigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { toast } from 'react-toastify';

export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, isAuthenticated, isLoading } = useUser();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page, but save the location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific role
  if (requiredRole && user?.role !== requiredRole) {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/" replace />;
  }

  return children;
};

export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);
