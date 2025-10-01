import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, ArrowLeftRight, Palette } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

const UserHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const getDashboardUrl = () => {
    switch (user?.role) {
      case "buyer":
        return "/dashboard/seller-browse";
      case "seller":
        return "/dashboard/seller-browse";
      case "admin":
        return "/dashboard/admin";
      default:
        return "/dashboard/seller-browse";
    }
  };

  const getStatusBadge = () => {
    if (!user) return null;
    const statusConfig: any = {
      email_verified: {
        label: "Pending Verification",
        color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      },
      approved: {
        label: "Verified",
        color: "bg-green-500/10 text-green-600 dark:text-green-400",
      },
    };
    return statusConfig[user.status || "email_verified"];
  };

  return (
    <header className="bg-card shadow-sm border-b border-border">
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

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6 ml-8">
              <Link
                to="/browse-auctions"
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                Auctions
              </Link>
              <Link
                to={getDashboardUrl()}
                className="text-gray-700 hover:text-primary transition-colors font-medium"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                  {(() => {
                    const name = user?.name || user?.username || "User";
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
                  <div className="font-medium">
                    {user?.name || user?.username}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user?.role}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Palette className="mr-2 h-4 w-4" />
                  Theme
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {getStatusBadge() && (
              <Badge className={getStatusBadge().color}>
                {getStatusBadge().label}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
