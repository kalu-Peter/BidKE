import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Heart, 
  Clock, 
  DollarSign, 
  Trophy,
  User,
  Gavel
} from "lucide-react";

// Import individual tab components
import BrowseAuctionsTab from "@/components/dashboard/buyer/BrowseAuctionsTab";
import MyBidsTab from "@/components/dashboard/buyer/MyBidsTab";
import WatchlistTab from "@/components/dashboard/buyer/WatchlistTab";
import WonAuctionsTab from "@/components/dashboard/buyer/WonAuctionsTab";
import ProfileTab from "@/components/dashboard/buyer/ProfileTab";

const BuyerDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes('/dashboard/bids')) return 'bids';
    if (path.includes('/dashboard/watchlist')) return 'watchlist';
    if (path.includes('/dashboard/won')) return 'won';
    if (path.includes('/dashboard/profile')) return 'profile';
    return 'browse'; // Default to browse
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  // Update tab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);

  // Handle tab changes with navigation
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    let newPath: string;
    switch (tab) {
      case 'browse':
        newPath = '/dashboard/browse';
        break;
      case 'bids':
        newPath = '/dashboard/bids';
        break;
      case 'watchlist':
        newPath = '/dashboard/watchlist';
        break;
      case 'won':
        newPath = '/dashboard/won';
        break;
      case 'profile':
        newPath = '/dashboard/profile';
        break;
      default:
        newPath = '/dashboard/browse';
        break;
    }
    navigate(newPath);
  };

  // Mock data for dashboard stats
  const stats = {
    activeBids: 3,
    watchlistItems: 12,
    wonAuctions: 5,
    totalSpent: 450000
  };

  return (
    <DashboardLayout userRole="buyer" userStatus="approved" userName="John Doe">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, John!</h1>
          <p className="text-gray-600">
            You have {stats.activeBids} active bids and {stats.watchlistItems} items in your watchlist.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Active Bids"
            value={stats.activeBids}
            icon={<Gavel className="w-6 h-6" />}
            subtitle="Currently bidding"
          />
          <StatsCard
            title="Watchlist Items"
            value={stats.watchlistItems}
            icon={<Heart className="w-6 h-6" />}
            subtitle="Items you're watching"
          />
          <StatsCard
            title="Won Auctions"
            value={stats.wonAuctions}
            icon={<Trophy className="w-6 h-6" />}
            subtitle="Successful purchases"
          />
          <StatsCard
            title="Total Spent"
            value={`Ksh ${stats.totalSpent.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6" />}
            subtitle="Lifetime purchases"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="browse" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>Browse</span>
            </TabsTrigger>
            <TabsTrigger value="bids" className="flex items-center space-x-2">
              <Gavel className="w-4 h-4" />
              <span>My Bids</span>
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="flex items-center space-x-2">
              <Heart className="w-4 h-4" />
              <span>Watchlist</span>
            </TabsTrigger>
            <TabsTrigger value="won" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Won</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            <BrowseAuctionsTab />
          </TabsContent>

          <TabsContent value="bids" className="mt-6">
            <MyBidsTab />
          </TabsContent>

          <TabsContent value="watchlist" className="mt-6">
            <WatchlistTab />
          </TabsContent>

          <TabsContent value="won" className="mt-6">
            <WonAuctionsTab />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <ProfileTab />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default BuyerDashboard;
