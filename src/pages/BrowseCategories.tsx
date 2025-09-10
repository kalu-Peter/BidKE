import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Car, 
  Bike, 
  Smartphone, 
  Home, 
  ShirtIcon as Shirt, 
  Watch,
  Laptop,
  Camera,
  Search,
  Filter,
  Grid3X3,
  List,
  Eye,
  Heart,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";

const BrowseCategories = () => {
  const categories = [
    {
      id: 'cars',
      title: 'Cars & Vehicles',
      icon: Car,
      count: 234,
      description: 'Sedans, SUVs, pickup trucks, and commercial vehicles',
      color: 'bg-blue-500',
      featured: true
    },
    {
      id: 'motorbikes',
      title: 'Motorbikes & Scooters',
      icon: Bike,
      count: 156,
      description: 'Motorcycles, scooters, and two-wheelers',
      color: 'bg-green-500',
      featured: true
    },
    {
      id: 'electronics',
      title: 'Electronics',
      icon: Smartphone,
      count: 423,
      description: 'Phones, laptops, TVs, and gadgets',
      color: 'bg-purple-500',
      featured: true
    },
    {
      id: 'real-estate',
      title: 'Real Estate',
      icon: Home,
      count: 89,
      description: 'Properties, land, and commercial spaces',
      color: 'bg-orange-500',
      featured: false
    },
    {
      id: 'fashion',
      title: 'Fashion & Accessories',
      icon: Shirt,
      count: 312,
      description: 'Clothing, shoes, bags, and accessories',
      color: 'bg-pink-500',
      featured: false
    },
    {
      id: 'watches',
      title: 'Watches & Jewelry',
      icon: Watch,
      count: 78,
      description: 'Luxury watches, jewelry, and accessories',
      color: 'bg-yellow-500',
      featured: false
    },
    {
      id: 'computers',
      title: 'Computers & IT',
      icon: Laptop,
      count: 167,
      description: 'Laptops, desktops, servers, and IT equipment',
      color: 'bg-indigo-500',
      featured: false
    },
    {
      id: 'cameras',
      title: 'Cameras & Photography',
      icon: Camera,
      count: 45,
      description: 'DSLR cameras, lenses, and photography equipment',
      color: 'bg-teal-500',
      featured: false
    }
  ];

  const featuredItems = [
    {
      id: 1,
      title: "Toyota Land Cruiser V8",
      category: "Cars & Vehicles",
      currentBid: 2800000,
      reservePrice: 3200000,
      timeLeft: "2d 14h",
      bids: 23,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=500&q=80",
      featured: true
    },
    {
      id: 2,
      title: "Honda CBR 1000RR",
      category: "Motorbikes",
      currentBid: 850000,
      reservePrice: 1200000,
      timeLeft: "1d 8h",
      bids: 15,
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=500&q=80",
      featured: true
    },
    {
      id: 3,
      title: "iPhone 14 Pro Max",
      category: "Electronics",
      currentBid: 95000,
      reservePrice: 120000,
      timeLeft: "18h 45m",
      bids: 31,
      image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=500&q=80",
      featured: true
    },
    {
      id: 4,
      title: "MacBook Pro M2",
      category: "Electronics",
      currentBid: 185000,
      reservePrice: 250000,
      timeLeft: "3d 2h",
      bids: 18,
      image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=500&q=80",
      featured: true
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Browse All Categories
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Discover amazing deals across all auction categories
              </p>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input 
                      placeholder="Search auctions..." 
                      className="pl-10 h-12 text-gray-900"
                    />
                  </div>
                  <Select>
                    <SelectTrigger className="w-full md:w-48 h-12 text-gray-900">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 h-12 px-8">
                    Search
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold">1,504</div>
                  <div className="text-blue-200">Active Auctions</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">8</div>
                  <div className="text-blue-200">Categories</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">12,450</div>
                  <div className="text-blue-200">Registered Users</div>
                </div>
                <div>
                  <div className="text-3xl font-bold">98%</div>
                  <div className="text-blue-200">Success Rate</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Categories */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Categories
              </h2>
              <p className="text-xl text-gray-600">
                Most popular auction categories with the highest activity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
              {categories.filter(cat => cat.featured).map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link key={category.id} to={`/${category.id}`}>
                    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-2 hover:border-blue-500">
                      <CardHeader className="text-center pb-4">
                        <div className={`w-20 h-20 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                          <IconComponent className="w-10 h-10 text-white" />
                        </div>
                        <CardTitle className="text-2xl group-hover:text-blue-600 transition-colors">
                          {category.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center">
                        <p className="text-gray-600 mb-4">{category.description}</p>
                        <div className="flex justify-between items-center">
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {category.count} items
                          </Badge>
                          <span className="text-sm text-blue-600 font-medium group-hover:underline">
                            Browse →
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* All Categories Grid */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  All Categories
                </h2>
                <p className="text-xl text-gray-600">
                  Explore all available auction categories
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Grid3X3 className="w-4 h-4 mr-2" />
                  Grid
                </Button>
                <Button variant="ghost" size="sm">
                  <List className="w-4 h-4 mr-2" />
                  List
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => {
                const IconComponent = category.icon;
                return (
                  <Link key={category.id} to={`/${category.id}`}>
                    <Card className="group hover:shadow-lg transition-all duration-200 hover:border-blue-300">
                      <CardContent className="p-6">
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 ${category.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <IconComponent className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {category.title}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {category.count} active auctions
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Featured Auctions */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Featured Auctions
              </h2>
              <p className="text-xl text-gray-600">
                Don't miss these trending auctions ending soon
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredItems.map((item) => (
                <Card key={item.id} className="group hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                    <img 
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <Badge className="absolute top-3 right-3 bg-red-500 text-white">
                      Featured
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="absolute top-3 left-3 bg-white/90 hover:bg-white"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {item.category}
                    </Badge>
                    <h3 className="font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Current bid</span>
                        <span className="font-semibold">Ksh {item.currentBid.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Reserve price</span>
                        <span className="text-gray-900">Ksh {item.reservePrice.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 mb-3">
                      <div className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{item.bids} bids</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{item.timeLeft}</span>
                      </div>
                    </div>
                    <Button className="w-full">
                      Place Bid
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" variant="outline">
                View All Auctions
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default BrowseCategories;
