import Header from "@/components/Header";
import UserHeader from "@/components/UserHeader";
import { useAuth } from "@/contexts/AuthContext";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

const Index = () => {
  // Auth context
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch (e) {
    user = null;
  }

  return (
    <div className="min-h-screen">
      {user ? <UserHeader /> : <Header />}
      <main>
        <HeroSection />
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
    </div>
  );
};

export default Index;
