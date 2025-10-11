import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import HeroSection from "@/components/HeroSection";
import AuctionDetailsModal from "@/components/modals/AuctionDetailsModal";
import CategoriesSection from "@/components/CategoriesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  // Auth context
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch (e) {
    user = null;
  }

  // Modal state
  const [selectedAuctionId, setSelectedAuctionId] = useState<number | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewAuction = (auctionId: number) => {
    setSelectedAuctionId(auctionId);
    setIsModalOpen(true);
  };

  const handleViewAllAuctions = () => {
    navigate("/browse-auctions");
  };

  return (
    <div className="min-h-screen">
      {user ? <UserHeader /> : <Header />}
      <main>
        <HeroSection
          onViewAuction={handleViewAuction}
          onViewAllAuctions={handleViewAllAuctions}
        />
        <div id="categories">
          <CategoriesSection />
        </div>
        <div id="how-it-works">
          <HowItWorksSection />
        </div>
        <div id="trust">
          <TrustSection />
        </div>
      </main>
      <Footer />

      {/* Auction Details Modal */}
      {selectedAuctionId && (
        <AuctionDetailsModal
          auctionId={selectedAuctionId}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedAuctionId(null);
          }}
        />
      )}
    </div>
  );
};

export default Index;
