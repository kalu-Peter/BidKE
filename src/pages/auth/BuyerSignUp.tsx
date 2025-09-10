import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormField from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BuyerSignUp = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      // Create buyer account
      console.log("Creating buyer account:", formData);
      // Redirect to login or success page
      alert("Buyer account created successfully! Please sign in.");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BidLode as a Buyer</h1>
              <p className="text-gray-600">Create your account to start bidding on quality items</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create Buyer Account</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(value) => updateField("firstName", value)}
                    required
                    error={errors.firstName}
                  />
                  <FormField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(value) => updateField("lastName", value)}
                    required
                    error={errors.lastName}
                  />
                  <FormField
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={(value) => updateField("email", value)}
                    required
                    error={errors.email}
                    placeholder="📧 your.email@example.com"
                  />
                  <FormField
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={(value) => updateField("phone", value)}
                    required
                    error={errors.phone}
                    placeholder="📱 +254 700 000 000"
                  />
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
                    Create Buyer Account
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

export default BuyerSignUp;
