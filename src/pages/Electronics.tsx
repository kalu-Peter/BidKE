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


const mockElectronics = [
  {
    id: 1,
    title: "HP EliteBook 840 G5",
    category: "Laptops",
    currentBid: 32000,
    reservePrice: 35000,
    timeLeft: "1h 30m",
    bids: 8,
    seller: "TechHub Kenya",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "HP",
    condition: "Used"
  },
  {
    id: 2,
    title: "iPhone 14 Pro Max",
    category: "Phones",
    currentBid: 95000,
    reservePrice: 120000,
    timeLeft: "18h 45m",
    bids: 31,
    seller: "Digital Solutions",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80",
    featured: true,
    isWatched: true,
    brand: "Apple",
    condition: "New"
  },
  {
    id: 3,
    title: "Samsung 55'' 4K TV",
    category: "TVs",
    currentBid: 45000,
    reservePrice: 65000,
    timeLeft: "1h 30m",
    bids: 8,
    seller: "Electronics Plaza",
    image: "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?auto=format&fit=crop&w=500&q=80",
    featured: false,
    isWatched: false,
    brand: "Samsung",
    condition: "Used"
  },
  {
    id: 4,
    title: "MacBook Pro M2",
    category: "Laptops", 
    currentBid: 185000,
    reservePrice: 250000,
    timeLeft: "3d 2h",
    bids: 18,
    seller: "TechHub Kenya",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
    featured: true,
    isWatched: false,
    brand: "Apple",
    condition: "Like New"
  },
];

const categories = [
  { label: "All", value: "" },
  { label: "Phones", value: "Phones" },
  { label: "TVs", value: "TVs" },
  { label: "Laptops", value: "Laptops" },
];
const brands = [
  { label: "All", value: "" },
  { label: "HP", value: "HP" },
  { label: "Apple", value: "Apple" },
  { label: "Samsung", value: "Samsung" },
];
const conditions = [
  { label: "All", value: "" },
  { label: "Used", value: "Used" },
  { label: "New Repo", value: "New Repo" },
];
const sortOptions = [
  { label: "Ending soon", value: "ending" },
  { label: "Highest bid", value: "highest" },
  { label: "Lowest price", value: "lowest" },
];

const ElectronicsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [brand, setBrand] = useState("all");
  const [condition, setCondition] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [allElectronics, setAllElectronics] = useState(mockElectronics);

  // Filter electronics based on search criteria
  const filteredElectronics = allElectronics.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.seller.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.brand && item.brand.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = category === "all" || item.category.toLowerCase() === category.toLowerCase();
    const matchesBrand = brand === "all" || (item.brand && item.brand.toLowerCase() === brand.toLowerCase());
    const matchesCondition = condition === "all" || (item.condition && item.condition.toLowerCase() === condition.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesBrand && matchesCondition;
  });

  // Handler functions
  const handleToggleWatch = (itemId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setAllElectronics(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, isWatched: !item.isWatched }
        : item
    ));
  };

  const handlePlaceBid = (itemId: number) => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate(`/auction/${itemId}`);
  };

  const handleViewDetails = (itemId: number) => {
    navigate(`/auction/${itemId}`);  
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
                📱 Electronics Auctions
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-white/90">
                Discover amazing deals on phones, laptops, TVs and gadgets
              </p>
              
              {/* Search and Filters */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search electronics..." 
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
                      <SelectItem value="phones">Phones</SelectItem>
                      <SelectItem value="laptops">Laptops</SelectItem>
                      <SelectItem value="tvs">TVs</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger className="w-full lg:w-48 h-12 text-gray-900">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      <SelectItem value="apple">Apple</SelectItem>
                      <SelectItem value="samsung">Samsung</SelectItem>
                      <SelectItem value="hp">HP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">{allElectronics.length}</div>
                  <div className="text-white/80">Electronics</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{filteredElectronics.length}</div>
                  <div className="text-white/80">Matching</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">{allElectronics.filter(e => e.featured).length}</div>
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

        {/* Main Electronics Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {searchTerm || category !== "all" || brand !== "all" ? "Search Results" : "All Electronics"}
                </h2>
                <p className="text-gray-600">
                  Showing {filteredElectronics.length} of {allElectronics.length} electronics
                  {user && (
                    <span className="ml-2">
                      • {filteredElectronics.filter(e => e.isWatched).length} Watched
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

            {/* Electronics Grid */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
              {filteredElectronics.map((item) => (
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                    <img 
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.featured && (
                      <Badge className="absolute top-3 right-3 bg-accent text-white">
                        Featured
                      </Badge>
                    )}
                    {user && (
                      <button 
                        onClick={() => handleToggleWatch(item.id)}
                        className={`absolute top-3 left-3 p-2 rounded-full transition-colors ${
                          item.isWatched 
                            ? 'bg-accent text-white' 
                            : 'bg-white/90 text-gray-400 hover:text-accent hover:bg-white'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${item.isWatched ? 'fill-current' : ''}`} />
                      </button>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span className={item.timeLeft.includes('h') && !item.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                          {item.timeLeft}
                        </span>
                      </div>
                    </div>
                    <h3 
                      className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">by {item.seller}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current bid</span>
                        <span className="font-semibold text-green-600">Ksh {item.currentBid.toLocaleString()}</span>
                      </div>
                      {item.reservePrice && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Reserve price</span>
                          <span className="text-gray-900">Ksh {item.reservePrice.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{item.bids} bids</span>
                      </div>
                      <span className={item.timeLeft.includes('h') && !item.timeLeft.includes('d') ? 'text-accent font-medium' : ''}>
                        Ending {item.timeLeft.includes('h') && !item.timeLeft.includes('d') ? 'soon' : 'in ' + item.timeLeft}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        className="flex-1" 
                        onClick={() => handlePlaceBid(item.id)}
                      >
                        {user ? 'Place Bid' : 'Login to Bid'}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(item.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredElectronics.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No electronics found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search criteria or check back later for new electronics
                </p>
                <Button variant="outline" onClick={() => {
                  setSearchTerm("");
                  setCategory("all");
                  setBrand("all");
                  setCondition("all");
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

export default ElectronicsPage;
