import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, DollarSign } from "lucide-react";

// Import individual tab components
import OverviewTab from "@/components/dashboard/seller/OverviewTab";
import PostItemTab from "@/components/dashboard/seller/PostItemTab";
import ListingsTab from "@/components/dashboard/seller/ListingsTab";
import SalesTab from "@/components/dashboard/seller/SalesTab";
import MyBidsTab from "@/components/dashboard/seller/MyBidsTab";
import WatchlistTab from "@/components/dashboard/seller/WatchlistTab";
import WonAuctionsTab from "@/components/dashboard/seller/WonAuctionsTab";
import BrowseAuctionsContent from "@/components/dashboard/BrowseAuctionsContent";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/post-item')) return 'post-item';
    if (path.includes('/dashboard/listings')) return 'listings';
    if (path.includes('/dashboard/sales')) return 'sales';
    if (path.includes('/dashboard/payouts')) return 'sales'; // Payouts is part of sales tab
    // Company profile moved to dedicated seller profile page
    if (path.includes('/dashboard/seller-browse')) return 'browse';
    if (path.includes('/dashboard/seller-bids')) return 'my-bids';
    if (path.includes('/dashboard/seller-watchlist')) return 'watchlist';
    if (path.includes('/dashboard/seller-won')) return 'won';
    return 'overview'; // Default to overview
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Handle tab changes with navigation
  const handleTabChange = (tab: string) => {
    let newPath: string;
    switch (tab) {
      case 'post-item':
        newPath = '/dashboard/post-item';
        break;
      case 'listings':
        newPath = '/dashboard/listings';
        break;
      case 'sales':
        newPath = '/dashboard/sales';
        break;
      case 'browse':
        newPath = '/dashboard/seller-browse';
        break;
      case 'my-bids':
        newPath = '/dashboard/seller-bids';
        break;
      case 'watchlist':
        newPath = '/dashboard/seller-watchlist';
        break;
      case 'won':
        newPath = '/dashboard/seller-won';
        break;
      default:
        newPath = '/dashboard/seller';
        break;
    }
    navigate(newPath);
  };

  // Mock data for stats
  const stats = {
    activeListings: 8,
    totalSales: 15,
    pendingPayouts: 285000,
    thisMonthRevenue: 520000
  };

  return (
    <DashboardLayout userRole="seller" userStatus="approved" userName="ABC Auctioneers Ltd">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h1>
          <p className="text-gray-600">
            Manage your auction listings and track your sales performance.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Listings"
            value={stats.activeListings}
            icon={<FileText className="w-6 h-6" />}
            change="+2 this week"
            changeType="positive"
          />
          <StatsCard
            title="Total Sales"
            value={stats.totalSales}
            icon={<BarChart3 className="w-6 h-6" />}
            change="+3 this month"
            changeType="positive"
          />
          <StatsCard
            title="Pending Payouts"
            value={`Ksh ${stats.pendingPayouts.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            subtitle="2 payments pending"
          />
          <StatsCard
            title="This Month Revenue"
            value={`Ksh ${stats.thisMonthRevenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            change="+12% vs last month"
            changeType="positive"
          />
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="post-item">Post New Item</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="sales">Sales & Payouts</TabsTrigger>
            <TabsTrigger value="browse">Browse Auctions</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="won">Won Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewTab onTabChange={handleTabChange} />
          </TabsContent>

          <TabsContent value="post-item">
            <PostItemTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsTab />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="browse">
            <BrowseAuctionsContent />
          </TabsContent>

          <TabsContent value="my-bids">
            <MyBidsTab />
          </TabsContent>

          <TabsContent value="watchlist">
            <WatchlistTab />
          </TabsContent>

          <TabsContent value="won">
            <WonAuctionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SellerDashboard;
