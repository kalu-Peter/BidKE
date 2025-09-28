import React from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewTab from "@/components/dashboard/admin/OverviewTab";
import UserManagementTab from "@/components/dashboard/admin/UserManagementTab";
import ListingsControlTab from "@/components/dashboard/admin/ListingsControlTab";
import TransactionsTab from "@/components/dashboard/admin/TransactionsTab";
import ReportsTab from "@/components/dashboard/admin/ReportsTab";
import AdminSignUpTab from "@/components/dashboard/admin/AdminSignUpTab";
import SellerVerificationsTab from "@/components/dashboard/admin/SellerVerificationsTab";

const AdminDashboard = () => {
  const { pathname } = useLocation();

  // Determine which admin panel to show based on the current route.
  const renderPanel = () => {
    if (pathname.startsWith("/dashboard/users")) return <UserManagementTab />;
    if (pathname.startsWith("/dashboard/listings-control"))
      return <ListingsControlTab />;
    if (pathname.startsWith("/dashboard/transactions"))
      return <TransactionsTab />;
    if (pathname.startsWith("/dashboard/reports")) return <ReportsTab />;
    if (pathname.startsWith("/dashboard/verifications"))
      return <SellerVerificationsTab />;
    if (
      pathname.startsWith("/dashboard/admin-signup") ||
      pathname.startsWith("/admin-signup")
    )
      return <AdminSignUpTab />;

    // Default to Overview
    return <OverviewTab />;
  };

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-8">{renderPanel()}</div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
