import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search,
  Grid3X3,
  List,
  Eye,
  Heart,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";


const mockCars = [
  {
    id: 1,
    title: "Toyota Land Cruiser V8",
    category: "SUV",
    currentBid: 2800000,
    reservePrice: 3200000,
    timeLeft: "2d 14h",
    bids: 23,
    seller: "Auto Plaza Ltd",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=500&q=80",
    featured: true,
    isWatched: false,
    brand: "Toyota",
    year: "2019",
    transmission: "Automatic",
    mileage: 45000
  },
  {
    id: 2,
    title: "Mazda Demio 2018",
    category: "Sedan",
    currentBid: 800000,
    reservePrice: 950000,
    timeLeft: "2d 12h",
    bids: 15,
    seller: "Auto Dealers Ltd",
    image: "https://images.unsplash.com/photo-1465156799763-2c087c332922?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "Mazda",
    year: "2018",
    transmission: "Automatic",
    mileage: 42000
  },
  {
    id: 3,
    title: "Honda Civic 2019",
    category: "Sedan",
    currentBid: 1200000,
    reservePrice: 1450000,
    timeLeft: "1d 14h",
    bids: 28,
    seller: "Premium Motors",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "Honda",
    year: "2019",
    transmission: "Manual",
    mileage: 35000
  },
  {
    id: 4,
    title: "Toyota Axio 2016",
    category: "Sedan",
    currentBid: 950000,
    reservePrice: 1100000,
    timeLeft: "5h 30m",
    bids: 12,
    seller: "City Cars",
    image: "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: true,
    brand: "Toyota",
    year: "2016",
    transmission: "Automatic",
    mileage: 87000
  }
];



const CarsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [transmission, setTransmission] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allCars, setAllCars] = useState(mockCars);

  // Filter cars based on search criteria
  const filteredCars = allCars.filter(car => {
    const matchesSearch = car.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         car.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (car.brand && car.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = category === "all" || car.category.toLowerCase() === category.toLowerCase();
    const matchesBrand = brand === "all" || (car.brand && car.brand.toLowerCase() === brand.toLowerCase());
    const matchesTransmission = transmission === "all" || (car.transmission && car.transmission.toLowerCase() === transmission.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesBrand && matchesTransmission;
  });

  // Handler functions
  const handleToggleWatch = (carId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAllCars(prev => prev.map(car => 
      car.id === carId 
        ? { ...car, isWatched: !car.isWatched }
        : car
    ));
  };

  const handlePlaceBid = (carId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/auction/${carId}`);
  };

  const handleViewDetails = (carId: number) => {
    navigate(`/auction/${carId}`);  
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-hero text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                🚗 Car Auctions
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Find your perfect vehicle from sedans, SUVs, and pickup trucks
              </p>
              
              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search by make, model, year..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-12 text-gray-900"
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-gray-900">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="sedan">Sedan</SelectItem>
                      <SelectItem value="suv">SUV</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-gray-900">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="toyota">Toyota</SelectItem>
                      <SelectItem value="mazda">Mazda</SelectItem>
                      <SelectItem value="honda">Honda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{allCars.length}</div>
                  <div className="text-white/80">Cars</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{filteredCars.length}</div>
                  <div className="text-white/80">Matching</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{allCars.filter(c => c.featured).length}</div>
                  <div className="text-white/80">Featured</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-white/80">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Cars Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchTerm || category !== "all" || brand !== "all" ? "Search Results" : "All Cars"}
                </h2>
                <p className="text-gray-600">
                  Showing {filteredCars.length} of {allCars.length} cars
                  {user && (
                    <span className="ml-2">
                      • {filteredCars.filter(c => c.isWatched).length} Watched
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant={viewMode === "grid" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button 
                  variant={viewMode === "list" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setViewMode("list")}
                >
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            {/* Cars Grid */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {filteredCars.map((car) => (
                <Card key={car.id} className="group hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                    <img 
                      src={car.image}
                      alt={car.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {car.featured && (
                      <Badge className="absolute top-3 right-3 bg-accent text-white">
                        Featured
                      </Badge>
                    )}
                    {user && (
                      <button 
                        onClick={() => handleToggleWatch(car.id)}
                        className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                          car.isWatched 
                            ? 'bg-accent text-white' 
                            : 'bg-white/90 text-gray-400 hover:text-accent hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${car.isWatched ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {car.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className={car.timeLeft.includes('h') && !car.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                          {car.timeLeft}
                        </span>
                      </div>
                    </div>
                    <h3 
                      className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(car.id)}
                    >
                      {car.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-1">by {car.seller}</p>
                    <p className="text-xs text-gray-400 mb-3">{car.mileage?.toLocaleString()} km • {car.transmission}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current bid</span>
                        <span className="font-semibold text-green-600">Ksh {car.currentBid.toLocaleString()}</span>
                      </div>
                      {car.reservePrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reserve price</span>
                          <span className="text-gray-900">Ksh {car.reservePrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{car.bids} bids</span>
                      </div>
                      <span className={car.timeLeft.includes('h') && !car.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                        Ending {car.timeLeft.includes('h') && !car.timeLeft.includes('d') ? 'soon' : 'in ' + car.timeLeft}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => handlePlaceBid(car.id)}
                      >
                        {user ? 'Place Bid' : 'Login to Bid'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(car.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredCars.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No cars found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or check back later for new cars
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setCategory("all");
                  setBrand("all");
                  setTransmission("all");
                }}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default CarsPage;
