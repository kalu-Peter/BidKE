import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoriesSection from "@/components/CategoriesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import TrustSection from "@/components/TrustSection";
import BusinessModelSection from "@/components/BusinessModelSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
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
        <div id="business">
          <BusinessModelSection />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
