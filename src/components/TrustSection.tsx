import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Lock, Eye, CheckCircle, Phone, FileText } from "lucide-react";

const trustFeatures = [
  {
    title: "Verified Sellers",
    description: "All businesses go through strict verification including business registration and financial checks",
    icon: CheckCircle,
    color: "text-green-500"
  },
  {
    title: "Escrow System",
    description: "Your payment is held securely until you confirm receipt of your item",
    icon: Lock,
    color: "text-blue-500"
  },
  {
    title: "Transparent Bidding",
    description: "See all bid history and compete fairly with real-time updates",
    icon: Eye,
    color: "text-purple-500"
  },
  {
    title: "Secure Platform",
    description: "SSL encryption, secure payments, and data protection compliance",
    icon: Shield,
    color: "text-primary"
  },
  {
    title: "24/7 Support",
    description: "Customer support team available to help resolve any issues",
    icon: Phone,
    color: "text-orange-500"
  },
  {
    title: "Legal Documentation",
    description: "Proper transfer documents and receipts for all transactions",
    icon: FileText,
    color: "text-indigo-500"
  }
];

const TrustSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 border-primary text-primary">
            Trust & Security
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why Choose Our Platform?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've built multiple layers of security and verification to ensure 
            safe, transparent, and reliable transactions for all users.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trustFeatures.map((feature, index) => (
            <Card key={index} className="border-0 shadow-card hover:shadow-elegant transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                      <feature.icon className={`w-6 h-6 ${feature.color}`} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16">
          <div className="bg-gradient-primary rounded-2xl p-8 text-center text-primary-foreground">
            <h3 className="text-2xl font-bold mb-4">
              Ready to Start Bidding?
            </h3>
            <p className="text-primary-foreground/90 mb-6 max-w-2xl mx-auto">
              Join thousands of satisfied customers who have found great deals 
              on our trusted auction platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Badge variant="secondary" className="px-4 py-2">
                <Shield className="w-4 h-4 mr-2" />
                SSL Secured
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Verified Platform
              </Badge>
              <Badge variant="secondary" className="px-4 py-2">
                <Lock className="w-4 h-4 mr-2" />
                Escrow Protected
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;