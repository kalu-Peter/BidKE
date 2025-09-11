import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Motorbikes from "./pages/Motorbikes";
import Cars from "./pages/Cars";
import Electronics from "./pages/Electronics";
import SignUp from "./pages/auth/SignUp";
import Login from "./pages/auth/Login";
import BuyerDashboard from "./pages/dashboard/BuyerDashboard";
import SellerDashboard from "./pages/dashboard/SellerDashboard";
import AdminDashboard from "./pages/dashboard/AdminDashboard";
import BrowseAuctions from "./pages/BrowseAuctions";
import AuctionDetails from "./pages/AuctionDetails";
import HowItWorks from "./pages/HowItWorks";
import TrustSecurity from "./pages/TrustSecurity";
import Contact from "./pages/Contact";
import BuyerProfile from "./pages/dashboard/BuyerProfile";
import SellerProfile from "./pages/profile/SellerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/motorbikes" element={<Motorbikes />} />
            <Route path="/cars" element={<Cars />} />
            <Route path="/electronics" element={<Electronics />} />
            <Route path="/browse-auctions" element={<BrowseAuctions />} />
            <Route path="/auction/:id" element={<AuctionDetails />} />
            {/* Redirect old browse-categories route to new browse-auctions route */}
            <Route path="/browse-categories" element={<Navigate to="/browse-auctions" replace />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/trust-security" element={<TrustSecurity />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/signup" element={<SignUp />} />
            {/* Redirect old signup routes to new unified signup */}
            <Route path="/signup/buyer" element={<Navigate to="/signup" replace />} />
            <Route path="/signup/seller" element={<Navigate to="/signup" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard Routes */}
            <Route 
              path="/dashboard/buyer" 
              element={<Navigate to="/dashboard/browse" replace />} 
            />
            <Route 
              path="/dashboard/browse" 
              element={
                <ProtectedRoute>
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/bids" 
              element={
                <ProtectedRoute>
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/watchlist" 
              element={
                <ProtectedRoute>
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/won" 
              element={
                <ProtectedRoute>
                  <BuyerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/profile" 
              element={
                <ProtectedRoute>
                  <BuyerProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Profile Routes */}
            <Route 
              path="/profile/buyer" 
              element={
                <ProtectedRoute>
                  <BuyerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/seller" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/seller" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/post-item" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/listings" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/sales" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/payouts" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/company" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/seller-browse" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/seller-bids" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/seller-watchlist" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/seller-won" 
              element={
                <ProtectedRoute requiredRole="seller">
                  <SellerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/admin" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/overview" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/users" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/listings-control" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/transactions" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/reports" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/notifications" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
