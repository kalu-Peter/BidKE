import React, { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  MessageSquare, 
  HeadphonesIcon as Headphones,
  FileText,
  AlertCircle,
  CheckCircle,
  Send,
  User,
  Building,
  HelpCircle,
  Users,
  ShieldCheck,
  CreditCard,
  Truck,
  Star
} from "lucide-react";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
    }, 2000);
  };

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our support team",
      details: "+254 700 123 456",
      availability: "Mon-Fri, 8AM-6PM EAT",
      color: "bg-green-500"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message",
      details: "support@bidlode.co.ke",
      availability: "Response within 24 hours",
      color: "bg-blue-500"
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Get instant help with live chat",
      details: "Available on website",
      availability: "Mon-Fri, 9AM-5PM EAT",
      color: "bg-purple-500"
    },
    {
      icon: FileText,
      title: "Help Center",
      description: "Browse our knowledge base",
      details: "Self-service resources",
      availability: "Available 24/7",
      color: "bg-orange-500"
    }
  ];

  const supportCategories = [
    {
      icon: User,
      title: "Account & Registration",
      description: "Issues with account creation, verification, and login",
      topics: ["Account verification", "Password reset", "Profile updates", "KYC issues"]
    },
    {
      icon: CreditCard,
      title: "Payments & Billing",
      description: "Payment processing, refunds, and billing questions",
      topics: ["Payment failures", "Refund requests", "Fee inquiries", "Bank transfers"]
    },
    {
      icon: ShieldCheck,
      title: "Security & Trust",
      description: "Security concerns, fraud reports, and safety issues",
      topics: ["Suspicious activity", "Account security", "Fraud reports", "Data privacy"]
    },
    {
      icon: Truck,
      title: "Orders & Delivery",
      description: "Issues with won auctions, delivery, and item collection",
      topics: ["Item collection", "Delivery issues", "Item conditions", "Returns"]
    }
  ];

  const faqItems = [
    {
      question: "How do I create an account?",
      answer: "Click 'Sign Up' and choose between Buyer or Seller registration. Complete the form and verify your email to get started."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept M-Pesa, bank transfers, and major credit/debit cards. All payments are processed securely through our platform."
    },
    {
      question: "How long does verification take?",
      answer: "Buyer verification is usually instant. Seller verification takes 24-48 hours as we review business documents."
    },
    {
      question: "Can I return an item if it's not as described?",
      answer: "Yes, we offer buyer protection. You can return items within 48 hours of collection if they don't match the description."
    },
    {
      question: "How do I report a problem with a seller?",
      answer: "Use the 'Report' button on the auction page or contact our support team directly. We investigate all reports promptly."
    }
  ];

  const officeLocations = [
    {
      city: "Nairobi (Headquarters)",
      address: "ABC Place, Waiyaki Way, Westlands",
      phone: "+254 700 123 456",
      email: "nairobi@bidlode.co.ke",
      hours: "Mon-Fri: 8AM-6PM, Sat: 9AM-2PM"
    },
    {
      city: "Mombasa",
      address: "Nyali Centre, Mombasa Road",
      phone: "+254 700 123 457",
      email: "mombasa@bidlode.co.ke",
      hours: "Mon-Fri: 8AM-5PM"
    },
    {
      city: "Kisumu",
      address: "Mega Plaza, Kakamega Road",
      phone: "+254 700 123 458",
      email: "kisumu@bidlode.co.ke",
      hours: "Mon-Fri: 8AM-5PM"
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-blue-600 to-green-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Help & Support
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                We're here to help you succeed on BidLode. Get the support you need, when you need it.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Start Live Chat
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                  <Phone className="w-5 h-5 mr-2" />
                  Call Support
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Get In Touch
              </h2>
              <p className="text-xl text-gray-600">
                Choose the support method that works best for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {contactMethods.map((method, index) => {
                const IconComponent = method.icon;
                return (
                  <Card key={index} className="hover:shadow-xl transition-all duration-300 group text-center">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 ${method.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{method.description}</p>
                      <p className="font-medium text-gray-900 mb-2">{method.details}</p>
                      <Badge variant="outline" className="text-xs">
                        {method.availability}
                      </Badge>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Send Us a Message
                </h2>
                <p className="text-xl text-gray-600">
                  Fill out the form below and we'll get back to you as soon as possible
                </p>
              </div>

              {isSubmitted ? (
                <Card className="max-w-2xl mx-auto text-center">
                  <CardContent className="p-12">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">Message Sent Successfully!</h3>
                    <p className="text-gray-600 mb-6">
                      Thank you for contacting us. We've received your message and will respond within 24 hours.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>
                      Send Another Message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Form */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Contact Form</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name *
                              </label>
                              <Input
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="Enter your full name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address *
                              </label>
                              <Input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange("email", e.target.value)}
                                placeholder="Enter your email"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                              </label>
                              <Input
                                value={formData.phone}
                                onChange={(e) => handleInputChange("phone", e.target.value)}
                                placeholder="+254 700 000 000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Support Category *
                              </label>
                              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="account">Account & Registration</SelectItem>
                                  <SelectItem value="payments">Payments & Billing</SelectItem>
                                  <SelectItem value="security">Security & Trust</SelectItem>
                                  <SelectItem value="orders">Orders & Delivery</SelectItem>
                                  <SelectItem value="technical">Technical Issues</SelectItem>
                                  <SelectItem value="general">General Inquiry</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Subject *
                            </label>
                            <Input
                              value={formData.subject}
                              onChange={(e) => handleInputChange("subject", e.target.value)}
                              placeholder="Brief description of your issue"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Message *
                            </label>
                            <Textarea
                              value={formData.message}
                              onChange={(e) => handleInputChange("message", e.target.value)}
                              placeholder="Please provide detailed information about your inquiry..."
                              rows={6}
                              required
                            />
                          </div>

                          <Button 
                            type="submit" 
                            className="w-full" 
                            size="lg"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>Sending Message...</>
                            ) : (
                              <>
                                <Send className="w-5 h-5 mr-2" />
                                Send Message
                              </>
                            )}
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Support Categories */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <HelpCircle className="w-5 h-5" />
                          <span>Support Categories</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {supportCategories.map((category, index) => {
                            const IconComponent = category.icon;
                            return (
                              <div key={index} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                                <div className="flex items-start space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <IconComponent className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 mb-1">{category.title}</h4>
                                    <p className="text-sm text-gray-600">{category.description}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Emergency Support</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                          <p className="text-sm text-gray-600 mb-4">
                            For urgent security issues or fraud reports
                          </p>
                          <Button variant="outline" className="w-full border-red-500 text-red-500 hover:bg-red-50">
                            <Phone className="w-4 h-4 mr-2" />
                            Emergency Hotline
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
              <p className="text-xl text-gray-600">
                Quick answers to common questions
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4">
              {faqItems.map((faq, index) => (
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
              <p className="text-gray-600 mb-4">Don't see your question answered?</p>
              <Button variant="outline" size="lg">
                <FileText className="w-5 h-5 mr-2" />
                Browse Help Center
              </Button>
            </div>
          </div>
        </section>

        {/* Office Locations */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Offices
              </h2>
              <p className="text-xl text-gray-600">
                Visit us at any of our locations across Kenya
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {officeLocations.map((office, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <MapPin className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{office.city}</h3>
                    </div>
                    
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{office.address}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{office.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{office.email}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-600">{office.hours}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Support Stats */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Support Excellence
              </h2>
              <p className="text-xl text-blue-100">
                Our commitment to providing outstanding customer support
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">24/7</div>
                <div className="text-blue-100">Emergency Support</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">&lt;2h</div>
                <div className="text-blue-100">Average Response Time</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">98%</div>
                <div className="text-blue-100">Customer Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">15+</div>
                <div className="text-blue-100">Support Languages</div>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
