import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "seller" | "admin";
  requireApproval?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requireApproval = false,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while validating session
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate dashboard if user has wrong role
    const redirectPath = getDashboardPath(
      user?.role || "seller",
      user?.status || "email_verified",
    );
    return <Navigate to={redirectPath} replace />;
  }

  if (requireApproval && user?.status !== "approved") {
    // Redirect to dashboard with limited access
    const redirectPath = getDashboardPath(
      user?.role || "seller",
      user?.status || "email_verified",
    );
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export const getDashboardPath = (role: string, status: string): string => {
  switch (role) {
    case "seller":
      // Route sellers to their post-item page (List & Sell)
      return "/dashboard/post-item";
    case "admin":
      // Route admins to the admin dashboard
      return "/dashboard/admin";
    case "buyer":
      // Buyers can browse auctions (for now same as seller browse)
      return "/dashboard/seller-browse";
    default:
      return "/dashboard/seller-browse";
  }
};

export default ProtectedRoute;
