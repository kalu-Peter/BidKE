import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, BarChart3, DollarSign } from "lucide-react";

// Import individual tab components
import PostItemTab from "@/components/dashboard/seller/PostItemTab";
import ListingsTab from "@/components/dashboard/seller/ListingsTab";
import DraftsTab from "@/components/dashboard/seller/DraftsTab";
import SalesTab from "@/components/dashboard/seller/SalesTab";
import MyBidsTab from "@/components/dashboard/seller/MyBidsTab";
import WatchlistTab from "@/components/dashboard/seller/WatchlistTab";
import WonAuctionsTab from "@/components/dashboard/seller/WonAuctionsTab";
import BrowseAuctionsContent from "@/components/dashboard/BrowseAuctionsContent";

const SellerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/dashboard/post-item")) return "post-item";
    if (path.includes("/dashboard/listings")) return "listings";
    if (path.includes("/dashboard/drafts")) return "drafts";
    if (path.includes("/dashboard/sales")) return "sales";
    if (path.includes("/dashboard/payouts")) return "sales"; // Payouts is part of sales tab
    // Company profile moved to dedicated seller profile page
    if (path.includes("/dashboard/seller-browse")) return "browse";
    if (path.includes("/dashboard/seller-bids")) return "my-bids";
    if (path.includes("/dashboard/seller-watchlist")) return "watchlist";
    if (path.includes("/dashboard/seller-won")) return "won";
    return "browse"; // Default to auctions
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
      case "post-item":
        newPath = "/dashboard/post-item";
        break;
      case "listings":
        newPath = "/dashboard/listings";
        break;
      case "drafts":
        newPath = "/dashboard/drafts";
        break;
      case "sales":
        newPath = "/dashboard/sales";
        break;
      case "browse":
        newPath = "/dashboard/seller-browse";
        break;
      case "my-bids":
        newPath = "/dashboard/seller-bids";
        break;
      case "watchlist":
        newPath = "/dashboard/seller-watchlist";
        break;
      case "won":
        newPath = "/dashboard/seller-won";
        break;
      default:
        newPath = "/dashboard/seller-browse";
        break;
    }
    navigate(newPath);
  };

  // Mock data for stats
  const stats = {
    activeListings: 8,
    totalSales: 15,
    pendingPayouts: 285000,
    thisMonthRevenue: 520000,
  };

  return (
    <DashboardLayout
      userRole={user?.role as "seller" | "admin"}
      userStatus={user?.status as "email_verified" | "approved"}
      userName={user?.name || user?.username || "User"}
    >
      <div className="space-y-8">
        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="post-item">Post Item</TabsTrigger>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="browse">Auctions</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            <TabsTrigger value="won">Won Auctions</TabsTrigger>
          </TabsList>

          <TabsContent value="post-item">
            <PostItemTab />
          </TabsContent>

          <TabsContent value="listings">
            <ListingsTab />
          </TabsContent>

          <TabsContent value="drafts">
            <DraftsTab />
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
