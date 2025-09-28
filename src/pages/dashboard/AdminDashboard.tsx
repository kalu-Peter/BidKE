import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OverviewTab from "@/components/dashboard/admin/OverviewTab";
import UserManagementTab from "@/components/dashboard/admin/UserManagementTab";
import ListingsControlTab from "@/components/dashboard/admin/ListingsControlTab";
import TransactionsTab from "@/components/dashboard/admin/TransactionsTab";
import ReportsTab from "@/components/dashboard/admin/ReportsTab";
import AdminSignUpTab from "@/components/dashboard/admin/AdminSignUpTab";
import SellerVerificationsTab from "@/components/dashboard/admin/SellerVerificationsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
const AdminDashboard = () => {
  const location = useLocation();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/dashboard/users")) return "users";
    if (path.includes("/dashboard/listings-control")) return "listings";
    if (path.includes("/dashboard/transactions")) return "transactions";
    if (path.includes("/dashboard/reports")) return "reports";
    if (path.includes("/dashboard/notifications")) return "overview"; // Notifications in overview
    return "overview"; // Default to overview
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="listings">Listings Control</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="verifications">Verifications</TabsTrigger>
            <TabsTrigger value="signup">Add Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="users">
            <UserManagementTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsControlTab />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionsTab />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="verifications">
            <SellerVerificationsTab />
          </TabsContent>

          <TabsContent value="signup">
            <AdminSignUpTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
