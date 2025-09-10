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
  LogOut 
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: 'buyer' | 'seller' | 'admin';
  userStatus?: 'email_verified' | 'approved';
  userName?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  userRole: propUserRole, 
  userStatus: propUserStatus,
  userName: propUserName 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Use props if provided, otherwise use auth context
  const userRole = propUserRole || user?.role || 'buyer';
  const userStatus = propUserStatus || user?.status || 'email_verified';
  const userName = propUserName || user?.name || "User";

  const buyerNavItems = [
    { icon: Home, label: "Browse Auctions", path: "/dashboard/browse", active: true },
    { icon: Gavel, label: "My Bids", path: "/dashboard/bids" },
    { icon: Heart, label: "Watchlist", path: "/dashboard/watchlist" },
    { icon: Trophy, label: "Won Auctions", path: "/dashboard/won" },
    { icon: User, label: "Profile & Verification", path: "/dashboard/profile" },
  ];

  const sellerNavItems = [
    // Seller Functions
    { icon: Plus, label: "Post New Item", path: "/dashboard/post-item", section: "selling" },
    { icon: FileText, label: "My Listings", path: "/dashboard/listings", section: "selling" },
    { icon: BarChart3, label: "Sales Reports", path: "/dashboard/sales", section: "selling" },
    { icon: DollarSign, label: "Payouts", path: "/dashboard/payouts", section: "selling" },
    { icon: Building2, label: "Company Profile", path: "/dashboard/company", section: "selling" },
    // Buyer Functions (Seller-specific routes)
    { icon: Home, label: "Browse Auctions", path: "/dashboard/seller-browse", section: "buying" },
    { icon: Gavel, label: "My Bids", path: "/dashboard/seller-bids", section: "buying" },
    { icon: Heart, label: "Watchlist", path: "/dashboard/seller-watchlist", section: "buying" },
    { icon: Trophy, label: "Won Auctions", path: "/dashboard/seller-won", section: "buying" },
  ];

  const adminNavItems = [
    { icon: BarChart3, label: "Overview & Analytics", path: "/dashboard/overview" },
    { icon: Users, label: "User Management", path: "/dashboard/users" },
    { icon: FileText, label: "Listings Control", path: "/dashboard/listings-control" },
    { icon: DollarSign, label: "Transactions & Payments", path: "/dashboard/transactions" },
    { icon: FileText, label: "Reports", path: "/dashboard/reports" },
    { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
  ];

  const getNavItems = (): Array<{icon: any, label: string, path: string, section?: string}> => {
    switch (userRole) {
      case 'buyer': return buyerNavItems;
      case 'seller': return sellerNavItems;
      case 'admin': return adminNavItems;
      default: return [];
    }
  };

  const getRoleDisplay = () => {
    const roles = {
      buyer: { label: "Buyer", color: "bg-blue-100 text-blue-800" },
      seller: { label: "Seller", color: "bg-purple-100 text-purple-800" },
      admin: { label: "Admin", color: "bg-red-100 text-red-800" }
    };
    return roles[userRole];
  };

  const getStatusBadge = () => {
    if (userRole === 'admin') return null;
    
    const statusConfig = {
      email_verified: { label: "Pending Verification", color: "bg-yellow-100 text-yellow-800" },
      approved: { label: "Verified", color: "bg-green-100 text-green-800" }
    };
    
    return statusConfig[userStatus];
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getDashboardUrl = () => {
    switch (userRole) {
      case 'buyer':
        return '/dashboard/browse';
      case 'seller':
        return '/dashboard/seller';
      case 'admin':
        return '/dashboard/admin';
      default:
        return '/dashboard/browse';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link to={getDashboardUrl()} className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">BidLode</span>
              </Link>
              <Badge variant="outline" className="text-xs">Dashboard</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="text-gray-600">Welcome, </span>
                <span className="font-medium">{userName}</span>
              </div>
              <Badge className={getRoleDisplay().color}>
                {getRoleDisplay().label}
              </Badge>
              {getStatusBadge() && (
                <Badge className={getStatusBadge()!.color}>
                  {getStatusBadge()!.label}
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {userRole === 'seller' ? (
                <>
                  {/* Selling Section */}
                  <div className="mb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
                      Selling
                    </h3>
                    {getNavItems().filter(item => item.section === 'selling').map((item, index) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={`selling-${index}`}
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Buying Section */}
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-4">
                      Buying
                    </h3>
                    {getNavItems().filter(item => item.section === 'buying').map((item, index) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <Link
                          key={`buying-${index}`}
                          to={item.path}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            isActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </>
              ) : (
                getNavItems().map((item, index) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={index}
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })
              )}
            </nav>
            
            {/* Status Alert for Limited Users */}
            {userStatus === 'email_verified' && userRole !== 'admin' && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-medium text-yellow-800 mb-2">
                  {userRole === 'buyer' ? 'Limited Access' : 'Pending Approval'}
                </h4>
                <p className="text-sm text-yellow-700">
                  {userRole === 'buyer' 
                    ? 'Complete KYC verification to unlock full bidding features.'
                    : 'Your business verification is under review.'
                  }
                </p>
                <Link to="/dashboard/profile">
                  <Button variant="outline" size="sm" className="mt-2 text-yellow-800 border-yellow-300">
                    {userRole === 'buyer' ? 'Complete KYC' : 'View Status'}
                  </Button>
                </Link>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
