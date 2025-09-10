import React from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, ShoppingCart, Briefcase } from "lucide-react";

const SignUpChoice = () => {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Join BidLode</h1>
              <p className="text-xl text-gray-600">
                Choose how you'd like to participate in our auction marketplace
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Buyer Card */}
              <Link to="/signup/buyer" className="block">
                <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 group cursor-pointer h-full hover:shadow-lg transform hover:-translate-y-1">
                  <CardHeader className="text-center pb-6">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                      <ShoppingCart className="w-10 h-10 text-blue-600" />
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">I'm a Buyer</CardTitle>
                    <CardDescription className="text-lg">
                      I want to bid on and purchase repossessed items
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Browse and bid on quality repossessed items</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Access to cars, motorbikes, electronics, and more</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Secure payment and escrow services</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Real-time bidding notifications</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-4">Quick setup - usually takes 5-10 minutes</p>
                      <Button className="w-full" size="lg" onClick={(e) => e.preventDefault()}>
                        <Users className="w-5 h-5 mr-2" />
                        Sign Up as Buyer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              {/* Seller Card */}
              <Link to="/signup/seller" className="block">
                <Card className="relative overflow-hidden border-2 hover:border-primary transition-all duration-300 group cursor-pointer h-full hover:shadow-lg transform hover:-translate-y-1">
                  <CardHeader className="text-center pb-6">
                    <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                      <Building2 className="w-10 h-10 text-purple-600" />
                    </div>
                    <CardTitle className="text-2xl group-hover:text-primary transition-colors">I'm a Seller</CardTitle>
                    <CardDescription className="text-lg">
                      I represent a business that needs to auction repossessed items
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">List repossessed items for auction</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Reach verified buyers nationwide</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Automated bidding and payment processing</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-600">Detailed sales analytics and reporting</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-4">Business verification required - 2-3 days approval</p>
                      <Button className="w-full" size="lg" variant="outline" onClick={(e) => e.preventDefault()}>
                        <Briefcase className="w-5 h-5 mr-2" />
                        Sign Up as Seller
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="text-center mt-12 space-y-4">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in here
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                Need help choosing? <Link to="/contact" className="text-primary hover:underline">Contact our support team</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SignUpChoice;
