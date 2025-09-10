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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SellerSignUp = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [activeTab, setActiveTab] = useState("account");
  const [formData, setFormData] = useState({
    // Step 1: Account Details
    contactName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    // Step 2: Company Details
    companyName: "",
    registrationNumber: "",
    kraPin: "",
    streetAddress: "",
    city: "",
    country: "Kenya",
    businessType: "",
    // Step 3: Verification Documents
    companyCert: null as File | null,
    auctionLicense: null as File | null,
    authLetter: null as File | null,
    companyLogo: null as File | null,
    // Step 4: Payment Details
    payoutMethod: "",
    bankAccount: "",
    accountName: "",
    mpesaTill: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const steps = ["Account Info", "Verify Contact", "Business Setup", "Pending Approval"];

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

  const validateAccountInfo = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.contactName) newErrors.contactName = "Contact name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCompanyInfo = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.companyName) newErrors.companyName = "Company name is required";
    if (!formData.registrationNumber) newErrors.registrationNumber = "Registration number is required";
    if (!formData.streetAddress) newErrors.streetAddress = "Address is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.businessType) newErrors.businessType = "Business type is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDocuments = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.companyCert) newErrors.companyCert = "Company certificate is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0 && validateAccountInfo()) {
      // Insert into users → role = seller, status = unverified
      // Insert into sellers with company details
      // Generate OTP → insert into verifications (type='email')
      setCurrentStep(1);
      console.log("Seller user created with status: unverified, OTP generated");
    } else if (currentStep === 1) {
      // On OTP success → update users.status='email_verified'
      // Seller can now login but with limited access until admin approval
      setCurrentStep(2);
      console.log("Seller status updated to: email_verified");
    } else if (currentStep === 2 && validateCompanyInfo() && validateDocuments()) {
      // Upload company documents (user_documents with doc_type = 'cr12', 'license', etc.)
      // Admin reviews → update sellers.verification_status='approved' and users.status='approved'
      setCurrentStep(3);
      console.log("Company documents uploaded, pending admin review");
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
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BidLode as a Seller</h1>
              <p className="text-gray-600">Register your business to start listing repossessed items for auction</p>
            </div>

            <ProgressBar steps={steps} currentStep={currentStep} />

            <Card>
              <CardHeader>
                <CardTitle>
                  {currentStep === 0 && "Business Registration"}
                  {currentStep === 1 && "Verify Your Contact"}
                  {currentStep === 2 && "Complete Business Setup"}
                  {currentStep === 3 && "Application Under Review"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentStep === 0 && (
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
                )}

                {currentStep === 1 && (
                  <div className="text-center space-y-6">
                    <div className="bg-blue-50 p-6 rounded-lg">
                      <h3 className="text-lg font-semibold mb-4">Verify Your Business Contact</h3>
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
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="company">Company Info</TabsTrigger>
                      <TabsTrigger value="documents">Documents</TabsTrigger>
                      <TabsTrigger value="payout">Payout</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="company" className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          label="Company/Business Name"
                          value={formData.companyName}
                          onChange={(value) => updateField("companyName", value)}
                          required
                          error={errors.companyName}
                        />
                        <FormField
                          label="Registration Number"
                          value={formData.registrationNumber}
                          onChange={(value) => updateField("registrationNumber", value)}
                          required
                          error={errors.registrationNumber}
                          placeholder="Certificate/BN Number"
                        />
                        <FormField
                          label="KRA PIN"
                          value={formData.kraPin}
                          onChange={(value) => updateField("kraPin", value)}
                          placeholder="Optional but recommended"
                        />
                        <FormField
                          label="City"
                          value={formData.city}
                          onChange={(value) => updateField("city", value)}
                          required
                          error={errors.city}
                        />
                      </div>
                      <FormField
                        label="Physical Address"
                        value={formData.streetAddress}
                        onChange={(value) => updateField("streetAddress", value)}
                        required
                        error={errors.streetAddress}
                        placeholder="Street address, building name, floor"
                      />
                    </TabsContent>

                    <TabsContent value="documents" className="space-y-6 mt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FileUpload
                          label="Company Certificate"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(file) => setFormData(prev => ({ ...prev, companyCert: file }))}
                          required
                        />
                        <FileUpload
                          label="Auction License"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(file) => setFormData(prev => ({ ...prev, auctionLicense: file }))}
                        />
                        <FileUpload
                          label="Authorization Letter"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={(file) => setFormData(prev => ({ ...prev, authLetter: file }))}
                        />
                        <FileUpload
                          label="Company Logo"
                          accept="image/*"
                          onChange={(file) => setFormData(prev => ({ ...prev, companyLogo: file }))}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="payout" className="space-y-6 mt-6">
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label>Payout Method *</Label>
                          <Select value={formData.payoutMethod} onValueChange={(value) => updateField("payoutMethod", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payout method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank">Bank Transfer</SelectItem>
                              <SelectItem value="mpesa">M-Pesa</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {formData.payoutMethod === "bank" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              label="Bank Account Number"
                              value={formData.bankAccount}
                              onChange={(value) => updateField("bankAccount", value)}
                              required
                            />
                            <FormField
                              label="Account Name"
                              value={formData.accountName}
                              onChange={(value) => updateField("accountName", value)}
                              required
                            />
                          </div>
                        )}

                        {formData.payoutMethod === "mpesa" && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              label="Till/Paybill Number"
                              value={formData.mpesaTill}
                              onChange={(value) => updateField("mpesaTill", value)}
                              required
                            />
                            <FormField
                              label="Business Name"
                              value={formData.accountName}
                              onChange={(value) => updateField("accountName", value)}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                )}

                {currentStep === 3 && (
                  <div className="text-center space-y-6">
                    <div className="bg-yellow-50 p-8 rounded-lg">
                      <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">⏳</span>
                      </div>
                      <h3 className="text-2xl font-bold text-yellow-800 mb-2">Application Under Review!</h3>
                      <p className="text-yellow-700 mb-4">
                        Your seller application has been submitted successfully. We'll contact you within 2-3 business days.
                      </p>
                      <div className="bg-white p-4 rounded border mb-4">
                        <h4 className="font-semibold text-gray-800 mb-2">Current Account Status:</h4>
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                          <span className="text-sm">Email/Phone Verified</span>
                        </div>
                        <div className="flex items-center justify-center space-x-2">
                          <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                          <span className="text-sm">Business Documents Under Review</span>
                        </div>
                      </div>
                      <div className="text-sm text-yellow-600">
                        <p>Application ID: <span className="font-mono">BS-{Date.now()}</span></p>
                        <p className="mt-2">You can sign in to track your application status.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Link to="/login">
                        <Button variant="outline" className="w-full">
                          Sign In to Account
                        </Button>
                      </Link>
                      <Link to="/">
                        <Button className="w-full">
                          Return to Home
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
                      {currentStep === 2 && "Submit for Review"}
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

export default SellerSignUp;
