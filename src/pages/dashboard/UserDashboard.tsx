import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import StatsCard from "@/components/dashboard/StatsCard";
import { cn } from "@/lib/utils";
import {
  FileText,
  BarChart3,
  DollarSign,
  Bell,
  Search,
  Eye,
  Heart,
  Trophy,
  Plus,
  User,
} from "lucide-react";

// Import individual tab components
import PostItemTab from "@/components/dashboard/seller/PostItemTab";
import ListingsTab from "@/components/dashboard/seller/ListingsTab";
import SalesTab from "@/components/dashboard/seller/SalesTab";
import MyBidsTab from "@/components/dashboard/seller/MyBidsTab";
import WatchlistTab from "@/components/dashboard/seller/WatchlistTab";
import WonAuctionsTab from "@/components/dashboard/seller/WonAuctionsTab";
import ProfileTab from "@/components/dashboard/seller/ProfileTab";
import BrowseAuctionsContent from "@/components/dashboard/BrowseAuctionsContent";
import NotificationsTab from "@/components/dashboard/admin/NotificationsTab";

const UserDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Determine active tab based on current URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/dashboard/post-item")) return "post-item";
    if (path.includes("/dashboard/listings")) return "listings";
    if (path.includes("/dashboard/sales")) return "sales";
    if (path.includes("/dashboard/payouts")) return "sales"; // Payouts is part of sales tab
    if (path.includes("/dashboard/notifications")) return "notifications";
    // Company profile moved to dedicated seller profile page
    if (path.includes("/dashboard/seller-browse")) return "browse";
    if (path.includes("/dashboard/seller-bids")) return "my-bids";
    if (path.includes("/dashboard/seller-watchlist")) return "watchlist";
    if (path.includes("/dashboard/seller-won")) return "won";
    if (path.includes("/dashboard/profile")) return "profile";
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
      case "sales":
        newPath = "/dashboard/sales";
        break;
      case "notifications":
        newPath = "/dashboard/notifications";
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
      case "profile":
        newPath = "/dashboard/profile";
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

  // Sidebar navigation items
  const navigationItems = [
    {
      id: "post-item",
      label: "Post Item",
      icon: Plus,
      description: "Create new auction listing",
    },
    {
      id: "listings",
      label: "My Listings",
      icon: FileText,
      description: "Manage your auctions",
    },
    {
      id: "sales",
      label: "Sales",
      icon: DollarSign,
      description: "View sales and payouts",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      description: "Recent notifications",
    },
    {
      id: "browse",
      label: "Auctions",
      icon: Search,
      description: "Browse all auctions",
    },
    {
      id: "my-bids",
      label: "My Bids",
      icon: BarChart3,
      description: "Track your bids",
    },
    {
      id: "watchlist",
      label: "Watchlist",
      icon: Heart,
      description: "Saved items",
    },
    {
      id: "won",
      label: "Won Auctions",
      icon: Trophy,
      description: "Auctions you've won",
    },
    {
      id: "profile",
      label: "Profile",
      icon: User,
      description: "Manage your account",
    },
  ];

  // Render the active content
  const renderActiveContent = () => {
    switch (activeTab) {
      case "post-item":
        return <PostItemTab />;
      case "listings":
        return <ListingsTab />;
      case "sales":
        return <SalesTab />;
      case "notifications":
        return <NotificationsTab />;
      case "browse":
        return <BrowseAuctionsContent />;
      case "my-bids":
        return <MyBidsTab />;
      case "watchlist":
        return <WatchlistTab />;
      case "won":
        return <WonAuctionsTab />;
      case "profile":
        return <ProfileTab />;
      default:
        return <BrowseAuctionsContent />;
    }
  };

  return (
    <DashboardLayout
      userRole={user?.role as "seller" | "admin"}
      userStatus={user?.status as "email_verified" | "approved"}
      userName={user?.name || user?.username || "User"}
    >
      <div className="flex h-full">
        {/* Sidebar Navigation */}
        <div
          className="w-64 flex-shrink-0 shadow-lg"
          style={{ background: "linear-gradient(to bottom, #084597, #06377a)" }}
        >
          <nav className="p-6 space-y-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-2 mb-2">
                <img
                  src="/logo.png"
                  alt="BidLode Logo"
                  className="w-6 h-6 object-contain brightness-0 invert"
                />
                <h2 className="text-lg font-bold text-white">Dashboard</h2>
              </div>
              <div className="h-px bg-white/20"></div>
            </div>

            {/* Navigation Items */}
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group",
                    isActive
                      ? "bg-white text-primary shadow-md scale-[1.02] transform"
                      : "text-white/90 hover:bg-white/10 hover:text-white hover:scale-[1.01] transform"
                  )}
                >
                  <IconComponent
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-white/80 group-hover:text-white"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        "text-sm font-medium transition-colors",
                        isActive
                          ? "text-primary"
                          : "text-white/90 group-hover:text-white"
                      )}
                    >
                      {item.label}
                    </div>
                    <div
                      className={cn(
                        "text-xs truncate transition-colors",
                        isActive
                          ? "text-primary/70"
                          : "text-white/60 group-hover:text-white/80"
                      )}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1 h-8 bg-secondary rounded-full"></div>
                  )}
                </button>
              );
            })}

            {/* Bottom Section */}
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="text-xs text-white/60 text-center">
                BidLode Platform
              </div>
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-6">{renderActiveContent()}</div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
