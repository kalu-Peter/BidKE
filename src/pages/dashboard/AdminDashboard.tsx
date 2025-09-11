import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import OverviewTab from "@/components/dashboard/admin/OverviewTab";
import UserManagementTab from "@/components/dashboard/admin/UserManagementTab";
import ListingsControlTab from "@/components/dashboard/admin/ListingsControlTab";
import TransactionsTab from "@/components/dashboard/admin/TransactionsTab";
import ReportsTab from "@/components/dashboard/admin/ReportsTab";
import AdminSignUpTab from "@/components/dashboard/admin/AdminSignUpTab";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Users, 
  FileText, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  UserPlus
} from "lucide-react";

const AdminDashboard = () => {
  const location = useLocation();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/users')) return 'users';
    if (path.includes('/dashboard/listings-control')) return 'listings';
    if (path.includes('/dashboard/transactions')) return 'transactions';
    if (path.includes('/dashboard/reports')) return 'reports';
    if (path.includes('/dashboard/notifications')) return 'overview'; // Notifications in overview
    return 'overview'; // Default to overview
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Mock data for dashboard stats
  const stats = {
    totalUsers: 1247,
    activeListings: 156,
    todayRevenue: 45000,
    totalRevenue: 2340000,
    pendingApprovals: 12,
    completedTransactions: 89
  };

  return (
    <DashboardLayout userRole="admin" userName="Admin User">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">
            Monitor platform activity, manage users, and oversee all auction operations.
          </p>
        </div>

        {/* Alert Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-800">Pending Approvals</h3>
                  <p className="text-sm text-yellow-700">
                    {stats.pendingApprovals} items require your attention
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-medium text-blue-800">Revenue Growth</h3>
                  <p className="text-sm text-blue-700">
                    +15% increase this month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            icon={<Users className="w-6 h-6" />}
            change="+24 this week"
            changeType="positive"
          />
          <StatsCard
            title="Active Listings"
            value={stats.activeListings}
            icon={<FileText className="w-6 h-6" />}
            change="+12 today"
            changeType="positive"
          />
          <StatsCard
            title="Today's Revenue"
            value={`Ksh ${stats.todayRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            change="+8% vs yesterday"
            changeType="positive"
          />
          <StatsCard
            title="Total Revenue"
            value={`Ksh ${stats.totalRevenue.toLocaleString()}`}
            icon={<BarChart3 className="w-6 h-6" />}
            subtitle="All-time platform earnings"
          />
          <StatsCard
            title="Pending Approvals"
            value={stats.pendingApprovals}
            icon={<AlertTriangle className="w-6 h-6" />}
            subtitle="Require immediate attention"
          />
          <StatsCard
            title="Completed Transactions"
            value={stats.completedTransactions}
            icon={<CheckCircle className="w-6 h-6" />}
            subtitle="This month"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="listings">Listings Control</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
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

          <TabsContent value="signup">
            <AdminSignUpTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
