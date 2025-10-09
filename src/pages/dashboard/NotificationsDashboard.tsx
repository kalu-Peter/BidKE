import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import AdminDashboard from "./AdminDashboard";
import UserDashboard from "./UserDashboard";

const NotificationsDashboard: React.FC = () => {
  const { user } = useAuth();

  // Route to appropriate dashboard based on user role
  switch (user?.role) {
    case "admin":
      return <AdminDashboard />;
    case "seller":
    case "buyer":
    default:
      // All non-admin users use UserDashboard
      return <UserDashboard />;
  }
};

export default NotificationsDashboard;
