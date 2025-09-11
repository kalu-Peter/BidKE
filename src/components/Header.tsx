import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, Menu, X, Bike, Car, Smartphone, User, LogOut, Eye } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath } from "@/components/auth/ProtectedRoute";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  const handleDashboardClick = () => {
    if (user) {
      const dashboardPath = getDashboardPath(user.role, user.status);
      navigate(dashboardPath);
    }
  };

  const getLogoDestination = () => {
    if (isAuthenticated && user) {
      return getDashboardPath(user.role, user.status);
    }
    return "/";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={getLogoDestination()} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <img 
              src="/logo.png" 
              alt="BidLode Logo" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold text-foreground">BidLode</span>
            <Badge variant="outline" className="text-xs">
              Beta
            </Badge>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="px-2 text-muted-foreground hover:text-foreground">
                  Categories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Categories</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/motorbikes">
                    <Bike className="w-4 h-4 mr-2 text-primary" /> Motorbikes & Scooters
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/cars">
                    <Car className="w-4 h-4 mr-2 text-primary" /> Cars & Vehicles
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/electronics">
                    <Smartphone className="w-4 h-4 mr-2 text-primary" /> Electronics
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/browse-auctions">
                    <Eye className="w-4 h-4 mr-2 text-primary" /> Browse All Auctions
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link to="/trust-security" className="text-muted-foreground hover:text-foreground transition-colors">
              Trust & Security
            </Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              For Business
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{user.full_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {user.role}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboardClick}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button variant="hero">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-lg hover:bg-secondary"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-foreground" />
            ) : (
              <Menu className="w-6 h-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="py-4 space-y-4">
              <a 
                href="#categories" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
                onClick={toggleMenu}
              >
                Categories
              </a>
              <a 
                href="#how-it-works" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
                onClick={toggleMenu}
              >
                How It Works
              </a>
              <a 
                href="#trust" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
                onClick={toggleMenu}
              >
                Trust & Security
              </a>
              <Link 
                to="/signup" 
                className="block text-muted-foreground hover:text-foreground transition-colors"
                onClick={toggleMenu}
              >
                For Business
              </Link>
              <div className="pt-4 space-y-2">
                {isAuthenticated && user ? (
                  <>
                    <div className="px-3 py-2 text-sm">
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-muted-foreground capitalize">{user.role}</div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleDashboardClick}>
                      Dashboard
                    </Button>
                    <Link to="/dashboard/profile">
                      <Button variant="ghost" className="w-full justify-start">
                        Profile
                      </Button>
                    </Link>
                    <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/login">
                      <Button variant="ghost" className="w-full justify-start">
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/signup">
                      <Button variant="hero" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;