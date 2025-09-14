import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BrowseAuctionsContent from "@/components/dashboard/BrowseAuctionsContent";

const BrowseAuctions = () => (
  <>
    <Header />
    <div className="min-h-screen bg-gray-50 pt-20">
      <BrowseAuctionsContent />
    </div>
    <Footer />
  </>
);

export default BrowseAuctions;
