import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'buyer' | 'seller' | 'admin';
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole,
  requireApproval = false 
}) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard if user has wrong role
    const redirectPath = getDashboardPath(user?.role || 'buyer', user?.status || 'email_verified');
    return <Navigate to={redirectPath} replace />;
  }

  if (requireApproval && user?.status !== 'approved') {
    // Redirect to dashboard with limited access
    const redirectPath = getDashboardPath(user?.role || 'buyer', user?.status || 'email_verified');
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export const getDashboardPath = (role: string, status: string): string => {
  switch (role) {
    case 'buyer':
      return '/dashboard/browse';
    case 'seller':
      return '/dashboard/seller';
    case 'admin':
      return '/dashboard/admin';
    default:
      return '/dashboard/browse';
  }
};

export default ProtectedRoute;
