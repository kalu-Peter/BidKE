import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Percent, Tag, Crown, Megaphone, TrendingUp, Users } from "lucide-react";

const monetizationOptions = [
  {
    title: "Commission on Sales",
    description: "Small percentage (3-5%) charged on successful transactions",
    icon: Percent,
    feature: "Performance-based",
    color: "text-green-500"
  },
  {
    title: "Listing Fees",
    description: "Companies pay Ksh 200-500 per item listing",
    icon: Tag,
    feature: "Predictable revenue",
    color: "text-blue-500"
  },
  {
    title: "Premium Accounts",
    description: "Enhanced features for serious bidders and sellers",
    icon: Crown,
    feature: "Recurring income",
    color: "text-purple-500"
  },
  {
    title: "Platform Advertising",
    description: "Targeted ads for dealers, mechanics, and insurance firms",
    icon: Megaphone,
    feature: "Additional revenue",
    color: "text-orange-500"
  }
];

const targetCustomers = [
  {
    category: "Repossession Companies",
    description: "Banks, microfinance institutions, and auctioneers",
    icon: TrendingUp,
    count: "50+ Verified"
  },
  {
    category: "Individual Buyers", 
    description: "People seeking affordable vehicles and electronics",
    icon: Users,
    count: "2,000+ Active"
  },
  {
    category: "Car/Bike Dealers",
    description: "Businesses looking to restock inventory cheaply",
    icon: Tag,
    count: "150+ Registered"
  }
];

const BusinessModelSection = () => {
  return (
    <section className="py-20 bg-secondary/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4">
            Business Model
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Sustainable Revenue Streams
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Multiple monetization strategies ensure platform sustainability 
            while providing value to all stakeholders.
          </p>
        </div>

        {/* Revenue Streams */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Revenue Streams
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {monetizationOptions.map((option, index) => (
              <Card key={index} className="border-0 shadow-card hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <option.icon className={`w-8 h-8 ${option.color}`} />
                  </div>
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    {option.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    {option.description}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {option.feature}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Target Customers */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-foreground mb-8 text-center">
            Target Customers
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            {targetCustomers.map((customer, index) => (
              <Card key={index} className="border-0 shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <customer.icon className="w-8 h-8 text-primary mr-3" />
                    <div>
                      <h4 className="text-lg font-semibold text-foreground">
                        {customer.category}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {customer.count}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground">
                    {customer.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-card rounded-2xl p-8 text-center shadow-card">
          <h3 className="text-2xl font-bold text-foreground mb-4">
            Ready to Join Our Platform?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Whether you're a business looking to sell repossessed items or a buyer 
            seeking great deals, our platform offers the perfect solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              Register as Seller
            </Button>
            <Button variant="accent" size="lg">
              Start Bidding Today
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessModelSection;