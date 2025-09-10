import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, 
  Search, 
  Gavel, 
  CreditCard, 
  Package, 
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Users,
  TrendingUp,
  Play,
  FileText,
  Camera,
  DollarSign
} from "lucide-react";

const HowItWorks = () => {
  const sellerSteps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Create Seller Account",
      description: "Register as a business seller and complete your company verification process.",
      details: [
        "Provide business registration documents",
        "Upload company certificates",
        "Complete KYC verification",
        "Get approved within 24-48 hours"
      ],
      color: "bg-blue-500"
    },
    {
      step: 2,
      icon: Camera,
      title: "List Your Items",
      description: "Create detailed listings with high-quality photos and comprehensive descriptions.",
      details: [
        "Upload up to 8 high-resolution photos",
        "Set reserve prices and auction duration",
        "Provide detailed item condition reports",
        "Add relevant documents and certificates"
      ],
      color: "bg-green-500"
    },
    {
      step: 3,
      icon: Gavel,
      title: "Manage Auctions",
      description: "Monitor bidding activity and communicate with potential buyers.",
      details: [
        "Real-time bidding notifications",
        "Answer buyer questions",
        "Track auction performance",
        "Extend auctions if needed"
      ],
      color: "bg-purple-500"
    },
    {
      step: 4,
      icon: DollarSign,
      title: "Get Paid",
      description: "Receive payments securely after successful auction completion.",
      details: [
        "Automatic payment processing",
        "Funds held in escrow until delivery",
        "Direct bank transfers",
        "Transparent fee structure"
      ],
      color: "bg-orange-500"
    }
  ];

  const buyerSteps = [
    {
      step: 1,
      icon: UserPlus,
      title: "Sign Up & Verify",
      description: "Create your buyer account and complete identity verification.",
      details: [
        "Quick email registration",
        "Upload ID documents",
        "Complete KYC process",
        "Get verified instantly"
      ],
      color: "bg-blue-500"
    },
    {
      step: 2,
      icon: Search,
      title: "Browse & Research",
      description: "Explore auction categories and find items that interest you.",
      details: [
        "Advanced search filters",
        "Detailed item descriptions",
        "High-quality photos",
        "Seller ratings and reviews"
      ],
      color: "bg-green-500"
    },
    {
      step: 3,
      icon: Gavel,
      title: "Place Bids",
      description: "Participate in auctions by placing competitive bids.",
      details: [
        "Real-time bidding system",
        "Automatic bid increments",
        "Bid history tracking",
        "Outbid notifications"
      ],
      color: "bg-purple-500"
    },
    {
      step: 4,
      icon: Package,
      title: "Win & Collect",
      description: "Complete payment and arrange collection of your won items.",
      details: [
        "Secure online payments",
        "Flexible collection options",
        "Item inspection period",
        "Satisfaction guarantee"
      ],
      color: "bg-orange-500"
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Secure Transactions",
      description: "All payments are processed securely with escrow protection for both buyers and sellers."
    },
    {
      icon: Users,
      title: "Verified Community",
      description: "All users undergo KYC verification ensuring a trusted marketplace environment."
    },
    {
      icon: TrendingUp,
      title: "Fair Market Prices",
      description: "Competitive bidding ensures fair market value for all items sold on our platform."
    },
    {
      icon: Clock,
      title: "Real-time Updates",
      description: "Get instant notifications about bids, auctions ending, and important updates."
    }
  ];

  const faqs = [
    {
      question: "How long do auctions typically run?",
      answer: "Auction durations vary from 3 to 10 days, depending on the item and seller preference. Most popular items run for 5-7 days to maximize exposure and bidding activity."
    },
    {
      question: "What happens if I win an auction?",
      answer: "Once you win, you'll receive an email with payment instructions. You have 24 hours to complete payment, after which you can arrange collection or delivery with the seller."
    },
    {
      question: "Are there any fees for buyers?",
      answer: "Buyers don't pay listing fees. We only charge a small processing fee (2.5%) on successful purchases to cover payment processing and platform maintenance."
    },
    {
      question: "Can I inspect items before bidding?",
      answer: "Yes! Most sellers allow pre-auction viewing by appointment. Check the item listing for viewing times and contact details, or reach out to the seller directly."
    },
    {
      question: "What if an item doesn't match the description?",
      answer: "We offer buyer protection. If an item significantly differs from its description, you can return it within 48 hours of collection for a full refund."
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
                How BidLode Works
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Your complete guide to buying and selling on Kenya's premier auction platform
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <Play className="w-5 h-5 mr-2" />
                  Watch Demo Video
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <FileText className="w-5 h-5 mr-2" />
                  Download Guide
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* For Sellers Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 text-sm px-4 py-2 bg-blue-100 text-blue-800">
                For Sellers
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Selling Made Simple
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                From listing to payment, our platform makes it easy for businesses to reach buyers and maximize returns on their assets
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {sellerSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.step} className="relative">
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center pb-4">
                        <div className="relative mb-4">
                          <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {step.step}
                          </div>
                        </div>
                        <CardTitle className="text-xl mb-2">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    {index < sellerSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Start Selling Today
              </Button>
            </div>
          </div>
        </section>

        {/* For Buyers Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 text-sm px-4 py-2 bg-green-100 text-green-800">
                For Buyers
              </Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Bidding Made Easy
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover amazing deals and bid with confidence on Kenya's most trusted auction platform
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {buyerSteps.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <div key={step.step} className="relative">
                    <Card className="h-full hover:shadow-lg transition-shadow">
                      <CardHeader className="text-center pb-4">
                        <div className="relative mb-4">
                          <div className={`w-16 h-16 ${step.color} rounded-full flex items-center justify-center mx-auto mb-2`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {step.step}
                          </div>
                        </div>
                        <CardTitle className="text-xl mb-2">
                          {step.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-600 mb-4">{step.description}</p>
                        <ul className="space-y-2">
                          {step.details.map((detail, idx) => (
                            <li key={idx} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-600">{detail}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                    {index < buyerSteps.length - 1 && (
                      <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                        <ArrowRight className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-12">
              <Button size="lg" className="bg-green-600 hover:bg-green-700">
                Start Bidding Today
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose BidLode?
              </h2>
              <p className="text-xl text-gray-600">
                Built with security, transparency, and user experience in mind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-gray-600">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Got questions? We've got answers.
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {faq.answer}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Still have questions?</p>
              <Button variant="outline" size="lg">
                Contact Support
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default HowItWorks;
