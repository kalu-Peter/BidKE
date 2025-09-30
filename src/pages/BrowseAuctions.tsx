import React from "react";
import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import Footer from "@/components/Footer";
import BrowseAuctionsContent from "@/components/dashboard/BrowseAuctionsContent";
import { useAuth } from "@/contexts/AuthContext";

const BrowseAuctions = () => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch (e) {
    // Auth context not available; treat as guest
    user = null;
  }

  return (
    <>
      {user ? <UserHeader /> : <Header />}
      <div className="min-h-screen bg-gray-50 pt-20">
        <BrowseAuctionsContent />
      </div>
      <Footer />
    </>
  );
};

export default BrowseAuctions;
