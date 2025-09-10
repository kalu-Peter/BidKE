import React, { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProgressBar from "@/components/auth/ProgressBar";
import FormField from "@/components/auth/FormField";
import FileUpload from "@/components/auth/FileUpload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const BuyerSignUp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Step 1: Account Details
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Profile & KYC
    idNumber: "",
    dateOfBirth: "",
    city: "",
    country: "Kenya",
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const steps = ["Account Details", "Verify Contact", "Account Created", "KYC Pending"];

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep1 = () => {
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

  const validateStep2 = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.idNumber) newErrors.idNumber = "ID/Passport number is required";
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.idFront) newErrors.idFront = "ID front image is required";
    if (!formData.idBack) newErrors.idBack = "ID back image is required";
    if (!formData.selfie) newErrors.selfie = "Selfie is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && validateStep1()) {
      // Insert into users → role = buyer, status = unverified
      // Insert into buyer_profiles with empty/null fields
      // Generate OTP → insert into verifications (type='email')
      setCurrentStep(1);
      console.log("User created with status: unverified, OTP generated");
    } else if (currentStep === 1) {
      // On OTP success → update users.status='email_verified'
      // User can now login but with limited access until KYC approved
      setCurrentStep(2);
      console.log("User status updated to: email_verified");
    } else if (currentStep === 2 && validateStep2()) {
      // Upload KYC docs → insert into user_documents
      // Admin will review → update users.status='approved'
      setCurrentStep(3);
      console.log("KYC documents uploaded, pending admin review");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
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
              <p className="text-gray-600">Create your account to start bidding on quality repossessed items</p>
            </div>

            <ProgressBar steps={steps} currentStep={currentStep} />

            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 0 && "Account Details"}
                  {currentStep === 1 && "Verify Your Contact"}
                  {currentStep === 2 && "Complete KYC Verification"}
                  {currentStep === 3 && "Account Created Successfully!"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === 0 && (
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
                )}

                {currentStep === 1 && (
                  <div className="text-center space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Verify Your Contact Information</h3>
                      <p className="text-gray-600 mb-4">
                        We've sent verification codes to:
                      </p>
                      <div className="space-y-2">
                        <p className="font-medium">📧 {formData.email}</p>
                        <p className="font-medium">📱 {formData.phone}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Email Verification Code"
                        placeholder="Enter 6-digit code"
                        value=""
                        onChange={() => {}}
                      />
                      <FormField
                        label="SMS Verification Code"
                        placeholder="Enter 6-digit code"
                        value=""
                        onChange={() => {}}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="text-center space-y-6">
                    <div className="bg-green-50 p-6 rounded-lg mb-6">
                      <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-white text-xl">✓</span>
                      </div>
                      <h3 className="text-lg font-semibold text-green-800 mb-2">Contact Verified!</h3>
                      <p className="text-green-700 text-sm">
                        Your account is active. Complete KYC verification to unlock full bidding features.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h4 className="font-semibold text-blue-800 mb-2">You can now:</h4>
                      <ul className="text-sm text-blue-700 space-y-1 text-left">
                        <li>• Browse all auctions</li>
                        <li>• Add items to watchlist</li>
                        <li>• View auction details</li>
                      </ul>
                      <p className="text-xs text-blue-600 mt-2 italic">
                        Complete KYC below to start bidding
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="National ID / Passport Number"
                          value={formData.idNumber}
                          onChange={(value) => updateField("idNumber", value)}
                          required
                          error={errors.idNumber}
                        />
                        <FormField
                          label="Date of Birth"
                          type="date"
                          value={formData.dateOfBirth}
                          onChange={(value) => updateField("dateOfBirth", value)}
                          required
                          error={errors.dateOfBirth}
                        />
                        <FormField
                          label="City"
                          value={formData.city}
                          onChange={(value) => updateField("city", value)}
                          required
                          error={errors.city}
                        />
                        <div className="space-y-2">
                          <Label>Country *</Label>
                          <Select value={formData.country} onValueChange={(value) => updateField("country", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Kenya">Kenya</SelectItem>
                              <SelectItem value="Uganda">Uganda</SelectItem>
                              <SelectItem value="Tanzania">Tanzania</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileUpload
                          label="ID Front"
                          onChange={(file) => setFormData(prev => ({ ...prev, idFront: file }))}
                          required
                        />
                        <FileUpload
                          label="ID Back"
                          onChange={(file) => setFormData(prev => ({ ...prev, idBack: file }))}
                          required
                        />
                      </div>
                      <div className="max-w-md mx-auto">
                        <FileUpload
                          label="Selfie Photo"
                          onChange={(file) => setFormData(prev => ({ ...prev, selfie: file }))}
                          required
                        />
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="text-center space-y-6">
                    <div className="bg-yellow-50 p-8 rounded-lg">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">⏳</span>
                      </div>
                      <h3 className="text-2xl font-bold text-yellow-800 mb-2">KYC Under Review</h3>
                      <p className="text-yellow-700 mb-4">
                        Your KYC documents have been submitted successfully. Our team will review them within 24-48 hours.
                      </p>
                      <div className="bg-white p-4 rounded border mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Current Account Status:</h4>
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span className="text-sm">Email/Phone Verified</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                          <span className="text-sm">KYC Pending Approval</span>
                        </div>
                      </div>
                      <div className="text-sm text-yellow-600">
                        <p>You can browse auctions and build your watchlist while waiting for approval.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link to="/login">
                        <Button variant="outline" className="w-full">
                          Sign In to Your Account
                        </Button>
                      </Link>
                      <Link to="/">
                        <Button className="w-full">
                          Browse Auctions
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {currentStep < 3 && (
                  <div className="flex justify-between mt-8">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 0}
                    >
                      Back
                    </Button>
                    <Button onClick={handleNext}>
                      {currentStep === 0 && "Create Account & Verify"}
                      {currentStep === 1 && "Verify Codes"}
                      {currentStep === 2 && "Submit KYC Documents"}
                    </Button>
                  </div>
                )}
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
