import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Car, Bike, Smartphone } from "lucide-react";
import motorbikesImage from "@/assets/category-motorbikes.jpg";
import carsImage from "@/assets/category-cars.jpg";
import electronicsImage from "@/assets/category-electronics.jpg";

const categories = [
  {
    title: "Motorbikes & Scooters",
    description: "Quality repossessed motorcycles, boda bodas, and scooters from verified lenders",
    image: motorbikesImage,
    icon: Bike,
    itemCount: "150+ Items",
    startingPrice: "From Ksh 45,000"
  },
  {
    title: "Cars & Vehicles",
    description: "Sedans, SUVs, pickup trucks and commercial vehicles at competitive prices",
    image: carsImage,
    icon: Car,
    itemCount: "80+ Items",
    startingPrice: "From Ksh 180,000"
  },
  {
    title: "Electronics",
    description: "Laptops, smartphones, appliances and gadgets from repossession companies",
    image: electronicsImage,
    icon: Smartphone,
    itemCount: "200+ Items",
    startingPrice: "From Ksh 8,000"
  }
];

const CategoriesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Browse by Category
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover quality repossessed items across different categories. 
            All listings are verified and come from trusted businesses.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {categories.map((category, index) => (
            <Card key={index} className="group hover:shadow-card transition-all duration-300 border-0 overflow-hidden">
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-card/90 backdrop-blur-sm p-2 rounded-lg">
                    <category.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                  {category.itemCount}
                </div>
              </div>
              
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {category.title}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {category.description}
                </p>
                
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Starting Price</span>
                  <span className="text-lg font-semibold text-primary">
                    {category.startingPrice}
                  </span>
                </div>
                
                <Button className="w-full group" variant="outline">
                  View Auctions
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;