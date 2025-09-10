import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Shield, 
  Bell, 
  CreditCard, 
  Eye, 
  EyeOff, 
  Camera,
  CheckCircle,
  AlertCircle,
  Upload,

  Building2,
  FileText,
  TrendingUp,
  DollarSign
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const SellerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mock seller data
  const [sellerProfile, setSellerProfile] = useState({
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "+254 700 987 654",
    location: "Mombasa, Kenya",
    bio: "Professional seller specializing in electronics and automotive parts. Quality guaranteed on all items.",
    profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b612b743?auto=format&fit=crop&w=400&q=80",
    joinedDate: "2023-03-10",
    verified: false,
    sellerRating: 4.9,
    totalListings: 234,
    successfulSales: 189,
    totalEarnings: 2450000,
    // Business information
    businessName: "TechParts Kenya Ltd",
    businessType: "Limited Company",
    businessRegistration: "BN123456789",
    taxNumber: "P051234567M",
    businessAddress: "123 Digo Road, Mombasa",
    businessEmail: "info@techpartskenya.com",
    businessPhone: "+254 700 123 789"
  });

  // Verification status for sellers
  const [verification, setVerification] = useState({
    identityVerified: false,
    phoneVerified: false,
    emailVerified: true,
    addressVerified: false,
    businessVerified: false,
    taxVerified: false,
    bankAccountVerified: false
  });

  // Verification documents
  const [verificationDocs, setVerificationDocs] = useState({
    idDocument: null,
    proofOfAddress: null,
    businessRegistration: null,
    taxCertificate: null,
    bankStatement: null
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: true,
    orderUpdates: true,
    paymentNotifications: true,
    marketingEmails: false,
    currency: "KES",
    language: "en",
    timezone: "Africa/Nairobi",
    autoAcceptOffers: false,
    minimumOfferPercentage: 80
  });

  const handleSave = () => {
    setIsEditing(false);
    // Save profile logic here
  };

  const handleDocumentUpload = (docType: string, file: File) => {
    setVerificationDocs(prev => ({
      ...prev,
      [docType]: file
    }));
  };

  const submitForVerification = (type: string) => {
    console.log(`Submitting ${type} verification`);
  };

  const verificationProgress = Object.values(verification).filter(Boolean).length;
  const totalVerifications = Object.keys(verification).length;
  const progressPercentage = (verificationProgress / totalVerifications) * 100;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Seller Profile & Verification</h1>
          <p className="text-muted-foreground">Manage your business account and complete verification</p>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={sellerProfile.profilePicture} />
                      <AvatarFallback>{sellerProfile.firstName[0]}{sellerProfile.lastName[0]}</AvatarFallback>
                    </Avatar>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">
                      {sellerProfile.firstName} {sellerProfile.lastName}
                    </h1>
                    <p className="text-primary font-medium mb-2">{sellerProfile.businessName}</p>
                    <p className="text-muted-foreground mb-4">{sellerProfile.bio}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {sellerProfile.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {sellerProfile.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        {sellerProfile.sellerRating} Rating
                      </div>
                    </div>
                  </div>

                  {/* Seller Stats & Verification */}
                  <div className="text-right">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{sellerProfile.totalListings}</div>
                        <div className="text-xs text-muted-foreground">Total Listings</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{sellerProfile.successfulSales}</div>
                        <div className="text-xs text-muted-foreground">Successful Sales</div>
                      </div>
                    </div>
                    
                    <div className="mb-2">
                      <Badge variant={verification.businessVerified ? "default" : "secondary"}>
                        {verification.businessVerified ? "Business Verified" : "Unverified"}
                        {verification.businessVerified ? 
                          <CheckCircle className="h-3 w-3 ml-1" /> : 
                          <AlertCircle className="h-3 w-3 ml-1" />
                        }
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Verification: {Math.round(progressPercentage)}% Complete
                    </div>
                    <div className="w-32 bg-secondary rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Main Content */}
        <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="business">Business</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Information Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Personal Information</CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  >
                    {isEditing ? "Save Changes" : "Edit Profile"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={sellerProfile.firstName}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={sellerProfile.lastName}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          lastName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={sellerProfile.email}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={sellerProfile.phone}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={sellerProfile.location}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={sellerProfile.bio}
                        disabled={!isEditing}
                        rows={4}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          bio: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Business Information Tab */}
            <TabsContent value="business">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Business Information</CardTitle>
                  <Button
                    variant={isEditing ? "default" : "outline"}
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  >
                    {isEditing ? "Save Changes" : "Edit Business Info"}
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input
                        id="businessName"
                        value={sellerProfile.businessName}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          businessName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select 
                        value={sellerProfile.businessType} 
                        onValueChange={(value) => setSellerProfile(prev => ({...prev, businessType: value}))}
                        disabled={!isEditing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Sole Proprietorship">Sole Proprietorship</SelectItem>
                          <SelectItem value="Partnership">Partnership</SelectItem>
                          <SelectItem value="Limited Company">Limited Company</SelectItem>
                          <SelectItem value="Corporation">Corporation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessRegistration">Business Registration Number</Label>
                      <Input
                        id="businessRegistration"
                        value={sellerProfile.businessRegistration}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          businessRegistration: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">Tax Number (PIN)</Label>
                      <Input
                        id="taxNumber"
                        value={sellerProfile.taxNumber}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          taxNumber: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="businessAddress">Business Address</Label>
                      <Textarea
                        id="businessAddress"
                        value={sellerProfile.businessAddress}
                        disabled={!isEditing}
                        rows={3}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          businessAddress: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessEmail">Business Email</Label>
                      <Input
                        id="businessEmail"
                        type="email"
                        value={sellerProfile.businessEmail}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          businessEmail: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessPhone">Business Phone</Label>
                      <Input
                        id="businessPhone"
                        value={sellerProfile.businessPhone}
                        disabled={!isEditing}
                        onChange={(e) => setSellerProfile(prev => ({
                          ...prev,
                          businessPhone: e.target.value
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Seller Verification</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete your verification to build trust with buyers and unlock all seller features
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Identity Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Identity Verification</h3>
                            <p className="text-sm text-muted-foreground">
                              Upload your government-issued ID
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.identityVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload('idDocument', e.target.files[0])}
                                className="hidden"
                                id="id-upload"
                              />
                              <Button variant="outline" size="sm" asChild>
                                <label htmlFor="id-upload" className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload ID
                                </label>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => submitForVerification('identity')}
                                disabled={!verificationDocs.idDocument}
                              >
                                Submit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Business Registration */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Building2 className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Business Registration</h3>
                            <p className="text-sm text-muted-foreground">
                              Upload your business registration certificate
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.businessVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload('businessRegistration', e.target.files[0])}
                                className="hidden"
                                id="business-upload"
                              />
                              <Button variant="outline" size="sm" asChild>
                                <label htmlFor="business-upload" className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </label>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => submitForVerification('business')}
                                disabled={!verificationDocs.businessRegistration}
                              >
                                Submit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Tax Certificate */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <FileText className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Tax Certificate</h3>
                            <p className="text-sm text-muted-foreground">
                              Upload your KRA PIN certificate
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.taxVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload('taxCertificate', e.target.files[0])}
                                className="hidden"
                                id="tax-upload"
                              />
                              <Button variant="outline" size="sm" asChild>
                                <label htmlFor="tax-upload" className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </label>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => submitForVerification('tax')}
                                disabled={!verificationDocs.taxCertificate}
                              >
                                Submit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bank Account Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Bank Account Verification</h3>
                            <p className="text-sm text-muted-foreground">
                              Verify your bank account for payouts
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.bankAccountVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => navigate('/dashboard/bank-account')}>
                              Add Bank Account
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Phone & Email Verification */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Phone className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                              <h3 className="font-medium">Phone</h3>
                              <p className="text-sm text-muted-foreground">Verify phone</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {verification.phoneVerified ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Button size="sm" variant="outline">
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>

                        <div className="flex items-start justify-between p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <Mail className="h-5 w-5 mt-0.5 text-primary" />
                            <div>
                              <h3 className="font-medium">Email</h3>
                              <p className="text-sm text-muted-foreground">Verify email</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {verification.emailVerified ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Button size="sm" variant="outline">
                                Verify
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Seller Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Order Updates</Label>
                          <p className="text-sm text-muted-foreground">Get notified when you receive new orders</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.orderUpdates}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            orderUpdates: e.target.checked
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Payment Notifications</Label>
                          <p className="text-sm text-muted-foreground">Get notified about payments and payouts</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.paymentNotifications}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            paymentNotifications: e.target.checked
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Selling Preferences</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Auto-accept Offers</Label>
                          <p className="text-sm text-muted-foreground">Automatically accept offers above threshold</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.autoAcceptOffers}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            autoAcceptOffers: e.target.checked
                          }))}
                        />
                      </div>
                      {preferences.autoAcceptOffers && (
                        <div className="space-y-2">
                          <Label>Minimum Offer Percentage</Label>
                          <Select 
                            value={preferences.minimumOfferPercentage.toString()} 
                            onValueChange={(value) => setPreferences(prev => ({
                              ...prev, 
                              minimumOfferPercentage: parseInt(value)
                            }))}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="70">70% of asking price</SelectItem>
                              <SelectItem value="80">80% of asking price</SelectItem>
                              <SelectItem value="90">90% of asking price</SelectItem>
                              <SelectItem value="95">95% of asking price</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Password</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative">
                          <Input
                            id="currentPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter current password"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Enable Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your seller account
                        </p>
                      </div>
                      <Button variant="outline">
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SellerProfile;
