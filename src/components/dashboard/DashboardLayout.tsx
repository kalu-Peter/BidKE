import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Home,
  Gavel,
  Heart,
  Trophy,
  User,
  Plus,
  FileText,
  DollarSign,
  Building2,
  BarChart3,
  Users,
  Settings,
  Bell,
  LogOut,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "seller" | "admin";
  userStatus?: "email_verified" | "approved";
  userName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  userRole: propUserRole,
  userStatus: propUserStatus,
  userName: propUserName,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Use props if provided, otherwise use auth context
  const userRole = propUserRole || user?.role || "seller";
  const userStatus = propUserStatus || user?.status || "email_verified";
  const userName = propUserName || user?.name || "User";

  const buyerNavItems = [
    {
      icon: Home,
      label: "Browse Auctions",
      path: "/dashboard/browse",
      active: true,
    },
    { icon: Gavel, label: "My Bids", path: "/dashboard/bids" },
    { icon: Heart, label: "Watchlist", path: "/dashboard/watchlist" },
    { icon: Trophy, label: "Won Auctions", path: "/dashboard/won" },
    { icon: User, label: "Profile & Verification", path: "/dashboard/profile" },
  ];

  const sellerNavItems = [
    // Seller Functions
    {
      icon: Plus,
      label: "Post New Item",
      path: "/dashboard/post-item",
      section: "selling",
    },
    {
      icon: FileText,
      label: "My Listings",
      path: "/dashboard/listings",
      section: "selling",
    },
    {
      icon: FileText,
      label: "Drafts & Pending",
      path: "/dashboard/drafts",
      section: "selling",
    },
    {
      icon: BarChart3,
      label: "Sales Reports",
      path: "/dashboard/sales",
      section: "selling",
    },
    {
      icon: DollarSign,
      label: "Payouts",
      path: "/dashboard/payouts",
      section: "selling",
    },
    {
      icon: User,
      label: "Profile & Verification",
      path: "/dashboard/company",
      section: "selling",
    },
    // Buyer Functions (Seller-specific routes)
    {
      icon: Home,
      label: "Browse Auctions",
      path: "/dashboard/seller-browse",
      section: "buying",
    },
    {
      icon: Gavel,
      label: "My Bids",
      path: "/dashboard/seller-bids",
      section: "buying",
    },
    {
      icon: Heart,
      label: "Watchlist",
      path: "/dashboard/seller-watchlist",
      section: "buying",
    },
    {
      icon: Trophy,
      label: "Won Auctions",
      path: "/dashboard/seller-won",
      section: "buying",
    },
  ];

  // Admin uses header-only tabs; remove previous admin nav items to avoid duplication
  // Use correct type for adminNavItems to match getNavItems return type
  const adminNavItems: Array<{
    icon: any;
    label: string;
    path: string;
    section?: string;
  }> = [];

  const getNavItems = (): Array<{
    icon: any;
    label: string;
    path: string;
    section?: string;
  }> => {
    // Defensive: ensure we always return an array. Log in dev to help
    // diagnose unexpected userRole values.
    try {
      switch (userRole) {
        case "buyer":
          return buyerNavItems || [];
        case "seller":
          return sellerNavItems || [];
        case "admin":
          return [];
        default:
          if (process.env.NODE_ENV === "development") {
            // eslint-disable-next-line no-console
            console.warn("Unknown userRole in DashboardLayout:", userRole);
          }
          return [];
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("getNavItems error:", err, { userRole, adminNavItems });
      }
      return [];
    }
  };

  const getRoleDisplay = () => {
    const roles = {
      buyer: { label: "Buyer", color: "bg-secondary/10 text-secondary" },
      seller: { label: "Seller", color: "bg-primary/10 text-primary" },
      admin: { label: "Admin", color: "bg-accent/10 text-accent" },
    };
    return roles[userRole];
  };

  const getStatusBadge = () => {
    if (userRole === "admin") return null;

    const statusConfig = {
      email_verified: {
        label: "Pending Verification",
        color: "bg-yellow-100 text-yellow-800",
      },
      approved: { label: "Verified", color: "bg-green-100 text-green-800" },
    };

    return statusConfig[userStatus];
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getDashboardUrl = () => {
    switch (userRole) {
      case "buyer":
        return "/dashboard/browse";
      case "seller":
        return "/dashboard/seller";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/dashboard/browse";
    }
  };

  // no client-side Tabs state here — admin header uses route Links

  // Build the layout markup once and return it either wrapped by Tabs for admin
  const layout = (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link
                to={getDashboardUrl()}
                className="flex items-center space-x-2"
              >
                <img
                  src="/logo.png"
                  alt="BidLode Logo"
                  className="w-8 h-8 object-contain"
                />
                <span className="text-xl font-bold text-gray-900">BidLode</span>
              </Link>
              <Badge variant="outline" className="text-xs">
                Dashboard
              </Badge>

              {/* Desktop nav - grouped for sellers */}
              <div className="hidden lg:flex items-center space-x-3 ml-6">
                {userRole === "seller" ? (
                  <>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Selling
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Selling</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sellerNavItems
                          .filter((i) => i.section === "selling")
                          .map((item, idx) => (
                            <DropdownMenuItem asChild key={`sell-${idx}`}>
                              <Link to={item.path}>{item.label}</Link>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Buying
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Buying</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {sellerNavItems
                          .filter((i) => i.section === "buying")
                          .map((item, idx) => (
                            <DropdownMenuItem asChild key={`buy-${idx}`}>
                              <Link to={item.path}>{item.label}</Link>
                            </DropdownMenuItem>
                          ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <nav className="hidden lg:flex items-center space-x-2">
                    {getNavItems().map((item, index) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={index}
                          to={item.path}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                )}
              </div>
              {/* Admin horizontal TabsList (render only for admin) */}
              {userRole === "admin" && (
                <div className="hidden lg:block ml-8">
                  <div className="flex space-x-2">
                    <Link
                      to="/dashboard/overview"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Overview
                    </Link>
                    <Link
                      to="/dashboard/users"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      User Management
                    </Link>
                    <Link
                      to="/dashboard/listings-control"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Listings Control
                    </Link>
                    <Link
                      to="/dashboard/transactions"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Transactions
                    </Link>
                    <Link
                      to="/dashboard/reports"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Reports
                    </Link>
                    <Link
                      to="/dashboard/verifications"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Verifications
                    </Link>
                    <Link
                      to="/dashboard/admin-signup"
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Add Admin
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {(() => {
                        const name = userName || "User";
                        const parts = name.split(" ").filter(Boolean);
                        const initials =
                          parts.length === 1
                            ? parts[0].slice(0, 2)
                            : parts[0][0] + parts[1][0];
                        return initials.toUpperCase();
                      })()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-4 py-3">
                      <div className="font-medium">{userName}</div>
                      <div className="text-xs text-muted-foreground">
                        {user?.role}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Mobile nav dropdown */}
              <div className="lg:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Menu
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {userRole === "seller" ? (
                      <>
                        <DropdownMenuLabel className="mt-1">
                          Selling
                        </DropdownMenuLabel>
                        {sellerNavItems
                          .filter((i) => i.section === "selling")
                          .map((item, idx) => (
                            <DropdownMenuItem asChild key={`m-sell-${idx}`}>
                              <Link to={item.path}>{item.label}</Link>
                            </DropdownMenuItem>
                          ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Buying</DropdownMenuLabel>
                        {sellerNavItems
                          .filter((i) => i.section === "buying")
                          .map((item, idx) => (
                            <DropdownMenuItem asChild key={`m-buy-${idx}`}>
                              <Link to={item.path}>{item.label}</Link>
                            </DropdownMenuItem>
                          ))}
                      </>
                    ) : userRole === "admin" ? (
                      <>
                        <DropdownMenuLabel className="mt-1">
                          Admin
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/overview">Overview</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/users">User Management</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/listings-control">
                            Listings Control
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/transactions">Transactions</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/reports">Reports</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/verifications">
                            Verifications
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/dashboard/admin-signup">Add Admin</Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      getNavItems().map((item, index) => (
                        <DropdownMenuItem asChild key={`mobile-nav-${index}`}>
                          <Link to={item.path}>{item.label}</Link>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Badge className={getRoleDisplay().color}>
                {getRoleDisplay().label}
              </Badge>
              {getStatusBadge() && (
                <Badge className={getStatusBadge()!.color}>
                  {getStatusBadge()!.label}
                </Badge>
              )}
              {/* Logout control moved into avatar dropdown */}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          {/* Main Content (full width now that nav moved to header) */}
          <main>{children}</main>
        </div>
      </div>
    </div>
  );

  return layout;
};

export default DashboardLayout;
