import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Gavel, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import BusinessModelSection from "@/components/BusinessModelSection";

const Footer = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <>
      {/* Admin-only Business Model Section */}
      {isAdmin && <BusinessModelSection />}
      
      <footer className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <img 
                src="/logo.png" 
                alt="BidLode Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold">BidLode</span>
            </div>
            <p className="text-primary-foreground/80 mb-6">
              Kenya's premier platform for repossession auctions. 
              Connecting verified businesses with serious buyers.
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-accent" />
                <span className="text-sm">info@bidlode.co.ke</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-accent" />
                <span className="text-sm">+254 700 000 000</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-accent" />
                <span className="text-sm">Nairobi, Kenya</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Quick Links</h3>
            <div className="space-y-3">
              <Link to="/browse-auctions" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Browse Auctions
              </Link>
              <Link to="/how-it-works" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                How It Works
              </Link>
              <Link to="/trust-security" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Trust & Security
              </Link>
              <Link to="/cars" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Cars & Vehicles
              </Link>
              <Link to="/motorbikes" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Motorbikes
              </Link>
              <Link to="/electronics" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Electronics
              </Link>
            </div>
          </div>

          {/* For Business */}
          <div>
            <h3 className="text-lg font-semibold mb-6">For Business</h3>
            <div className="space-y-3">
              <Link to="/signup" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Seller Registration
              </Link>
              <Link to="/login" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Seller Login
              </Link>
              <Link to="/how-it-works" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                How to Sell
              </Link>
              <a href="#" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Pricing & Fees
              </a>
              <a href="#" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Business Resources
              </a>
              <Link to="/contact" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Support Center
              </Link>
            </div>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Account</h3>
            <div className="space-y-3">
              <Link to="/signup" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Sign Up
              </Link>
              <Link to="/login" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Sign In
              </Link>
              <Link to="/signup" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Buyer Registration
              </Link>
              <a href="#" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                My Dashboard
              </a>
              <a href="#" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Account Settings
              </a>
              <Link to="/contact" className="block text-primary-foreground/80 hover:text-accent transition-colors">
                Help & Support
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-lg font-semibold mb-6">Stay Updated</h3>
            <p className="text-primary-foreground/80 mb-4 text-sm">
              Get notified about new auctions and platform updates.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <Button variant="accent" className="w-full">
                Subscribe
              </Button>
            </div>
            
            {/* Social Links */}
            <div className="flex space-x-4 mt-6">
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-primary-foreground/10 rounded-lg flex items-center justify-center hover:bg-accent transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <Separator className="my-8 bg-primary-foreground/20" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-primary-foreground/60 mb-4 md:mb-0">
            © 2025 BidLode. All rights reserved. | Kenya's Premier Auction Platform
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Cookie Policy
            </a>
            <a href="#" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Sitemap
            </a>
            <Link to="/trust-security" className="text-primary-foreground/60 hover:text-accent transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
};

export default Footer;