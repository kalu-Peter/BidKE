import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Search, Gavel, CreditCard, Truck } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Sign Up & Verify",
    description: "Create your account and complete our verification process for secure bidding",
    icon: UserCheck,
    type: "buyer"
  },
  {
    step: "02", 
    title: "Browse & Search",
    description: "Explore categories and find the items you're interested in bidding on",
    icon: Search,
    type: "buyer"
  },
  {
    step: "03",
    title: "Place Your Bid",
    description: "Bid confidently with our transparent, real-time auction system",
    icon: Gavel,
    type: "buyer"
  },
  {
    step: "04",
    title: "Secure Payment",
    description: "Pay safely through our escrow system with M-Pesa or bank transfer",
    icon: CreditCard,
    type: "buyer"
  },
  {
    step: "05",
    title: "Collect Item",
    description: "Arrange pickup or delivery once payment is confirmed",
    icon: Truck,
    type: "buyer"
  }
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Simple Process
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our streamlined process makes it easy to find, bid on, and purchase 
            quality repossessed items safely and securely.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
          {steps.map((step, index) => (
            <Card key={index} className="relative border-0 shadow-card group hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6 text-center">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                    <step.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent text-accent-foreground rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
              </CardContent>
              
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border transform -translate-y-1/2 z-10" />
              )}
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="bg-card rounded-2xl p-8 max-w-4xl mx-auto shadow-card">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              For Businesses & Lenders
            </h3>
            <p className="text-muted-foreground mb-6">
              List your repossessed items, reach verified buyers, and maximize recovery rates 
              through our transparent auction platform.
            </p>
            <div className="grid md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-primary" />
                <span>Business verification</span>
              </div>
              <div className="flex items-center gap-2">
                <Gavel className="w-5 h-5 text-primary" />
                <span>Set reserve prices</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>Secure payouts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;