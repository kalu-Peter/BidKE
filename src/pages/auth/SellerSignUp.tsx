import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormField from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const SellerSignUp = () => {
  const [formData, setFormData] = useState({
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    businessType: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const businessTypes = [
    { label: "Select business type", value: "" },
    { label: "Auctioneer", value: "auctioneer" },
    { label: "Bank", value: "bank" },
    { label: "Microfinance Institution", value: "microfinance" },
    { label: "SACCO", value: "sacco" },
    { label: "Car Dealer", value: "dealer" },
    { label: "Leasing Company", value: "leasing" },
    { label: "Other Financial Institution", value: "other" },
  ];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.contactName) newErrors.contactName = "Contact name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.businessType) newErrors.businessType = "Business type is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Create seller account
      console.log("Creating seller account:", formData);
      // Redirect to login or success page
      alert("Seller account created successfully! Please sign in.");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BidLode as a Seller</h1>
              <p className="text-gray-600">Create your seller account to start listing items for auction</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create Seller Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Contact Person Full Name"
                    value={formData.contactName}
                    onChange={(value) => updateField("contactName", value)}
                    required
                    error={errors.contactName}
                  />
                  <FormField
                    label="Business Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(value) => updateField("email", value)}
                    required
                    error={errors.email}
                    placeholder="📧 business@company.com"
                  />
                  <FormField
                    label="Official Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    required
                    error={errors.phone}
                    placeholder="📱 +254 700 000 000"
                  />
                  <div className="space-y-2">
                    <Label>Business Type *</Label>
                    <Select value={formData.businessType} onValueChange={(value) => updateField("businessType", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select business type" />
                      </SelectTrigger>
                      <SelectContent>
                        {businessTypes.slice(1).map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.businessType && <p className="text-red-500 text-sm">{errors.businessType}</p>}
                  </div>
                  <FormField
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(value) => updateField("password", value)}
                    required
                    error={errors.password}
                  />
                  <FormField
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(value) => updateField("confirmPassword", value)}
                    required
                    error={errors.confirmPassword}
                  />
                </div>

                <div className="mt-8">
                  <Button onClick={handleSubmit} className="w-full">
                    Create Seller Account
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SellerSignUp;
