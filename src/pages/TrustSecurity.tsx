import React from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  CheckCircle, 
  CreditCard, 
  UserCheck, 
  FileText, 
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Star,
  Award,
  Users,
  TrendingUp,
  DollarSign,
  Zap
} from "lucide-react";

const TrustSecurity = () => {
  const securityFeatures = [
    {
      icon: Shield,
      title: "256-bit SSL Encryption",
      description: "All data transmission is protected with military-grade encryption to keep your information secure.",
      color: "bg-blue-500"
    },
    {
      icon: UserCheck,
      title: "KYC Verification",
      description: "Every user completes identity verification ensuring a trusted community of buyers and sellers.",
      color: "bg-green-500"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "PCI-compliant payment processing with escrow protection for all transactions.",
      color: "bg-purple-500"
    },
    {
      icon: Eye,
      title: "Transparent Process",
      description: "Open bidding history, seller ratings, and detailed item descriptions for informed decisions.",
      color: "bg-orange-500"
    },
    {
      icon: Lock,
      title: "Data Protection",
      description: "GDPR-compliant data handling with strict privacy controls and regular security audits.",
      color: "bg-red-500"
    },
    {
      icon: FileText,
      title: "Legal Compliance",
      description: "Fully licensed and compliant with Kenyan financial regulations and auction laws.",
      color: "bg-indigo-500"
    }
  ];

  const trustIndicators = [
    {
      icon: Users,
      value: "12,450+",
      label: "Verified Users",
      description: "Growing community of trusted buyers and sellers"
    },
    {
      icon: TrendingUp,
      value: "98.5%",
      label: "Success Rate",
      description: "Successful auction completion rate"
    },
    {
      icon: DollarSign,
      value: "Ksh 2.8B+",
      label: "Transaction Volume",
      description: "Total value of items sold on our platform"
    },
    {
      icon: Award,
      value: "4.8/5",
      label: "User Rating",
      description: "Average satisfaction rating from our users"
    }
  ];

  const protectionPolicies = [
    {
      title: "Buyer Protection",
      items: [
        "Item not as described - full refund within 48 hours",
        "Seller doesn't deliver - automatic refund processing",
        "Damaged items - return and refund guarantee",
        "Dispute resolution - free mediation service"
      ]
    },
    {
      title: "Seller Protection",
      items: [
        "Payment guarantee - funds secured before listing",
        "Identity verification - all buyers are KYC verified",
        "Anti-fraud measures - advanced detection systems",
        "Legal support - assistance with payment disputes"
      ]
    },
    {
      title: "Platform Security",
      items: [
        "24/7 monitoring - continuous security surveillance",
        "Regular audits - quarterly security assessments",
        "Incident response - immediate threat mitigation",
        "Data backup - secure off-site data protection"
      ]
    }
  ];

  const certifications = [
    {
      name: "PCI DSS Certified",
      description: "Payment Card Industry Data Security Standard compliance",
      badge: "Level 1"
    },
    {
      name: "ISO 27001",
      description: "International standard for information security management",
      badge: "Certified"
    },
    {
      name: "CBK Licensed",
      description: "Licensed by Central Bank of Kenya for financial services",
      badge: "Licensed"
    },
    {
      name: "GDPR Compliant",
      description: "European data protection regulation compliance",
      badge: "Compliant"
    }
  ];

  const reportingOptions = [
    {
      icon: AlertTriangle,
      title: "Report Suspicious Activity",
      description: "Immediately report any fraudulent listings or suspicious user behavior",
      action: "Report Now"
    },
    {
      icon: FileText,
      title: "Dispute Resolution",
      description: "File a formal dispute for transaction or delivery issues",
      action: "File Dispute"
    },
    {
      icon: Phone,
      title: "Emergency Support",
      description: "24/7 emergency support for urgent security concerns",
      action: "Call Support"
    }
  ];

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-20">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Trust & Security
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-green-100">
                Your safety and security are our top priorities. Learn how we protect every transaction.
              </p>
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100">
                  <FileText className="w-5 h-5 mr-2" />
                  Security Documentation
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-600">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Security Team
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Multi-Layer Security Protection
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                We employ industry-leading security measures to protect your data, transactions, and privacy
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="hover:shadow-xl transition-all duration-300 group">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 ${feature.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-center">{feature.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Thousands
              </h2>
              <p className="text-xl text-gray-600">
                Numbers that showcase our commitment to trust and reliability
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trustIndicators.map((indicator, index) => {
                const IconComponent = indicator.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-green-600" />
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {indicator.value}
                      </div>
                      <div className="text-lg font-semibold text-gray-700 mb-2">
                        {indicator.label}
                      </div>
                      <p className="text-sm text-gray-600">
                        {indicator.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Protection Policies */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Comprehensive Protection Policies
              </h2>
              <p className="text-xl text-gray-600">
                Detailed policies designed to protect all participants in our marketplace
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {protectionPolicies.map((policy, index) => (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl text-center text-gray-900">
                      {policy.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {policy.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex items-start space-x-3">
                          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Certifications */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Certifications & Compliance
              </h2>
              <p className="text-xl text-gray-600">
                Recognized certifications and regulatory compliance demonstrate our commitment to security
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {certifications.map((cert, index) => (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-blue-600" />
                    </div>
                    <Badge className="mb-3 bg-blue-100 text-blue-800">
                      {cert.badge}
                    </Badge>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {cert.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {cert.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Incident Reporting */}
        <section className="py-16 bg-red-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Report Security Concerns
              </h2>
              <p className="text-xl text-gray-600">
                Help us maintain a safe platform by reporting any security issues or suspicious activity
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {reportingOptions.map((option, index) => {
                const IconComponent = option.icon;
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="w-8 h-8 text-red-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {option.title}
                      </h3>
                      <p className="text-gray-600 mb-6">
                        {option.description}
                      </p>
                      <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white">
                        {option.action}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security Tips */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Security Best Practices
                </h2>
                <p className="text-xl text-gray-600">
                  Follow these guidelines to keep your account and transactions secure
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lock className="w-5 h-5 text-blue-600" />
                      <span>Account Security</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Use a strong, unique password</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Enable two-factor authentication</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Keep your contact details updated</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Log out from shared devices</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Shield className="w-5 h-5 text-green-600" />
                      <span>Safe Trading</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Verify seller ratings and reviews</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Use our secure payment system only</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Inspect items before final payment</span>
                      </li>
                      <li className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">Report suspicious behavior immediately</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Security Team */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">
                Security Team Contact
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Have security concerns or need to report an incident? Our security team is here to help.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center justify-center space-x-2">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <span>security@bidlode.co.ke</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  <span>+254 700 123 456</span>
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  <span>24/7 Emergency Support</span>
                </div>
              </div>

              <Button size="lg" className="bg-red-600 hover:bg-red-700">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Report Security Issue
              </Button>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default TrustSecurity;
