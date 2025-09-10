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

} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BuyerProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Mock user data - in real app, this would come from API
  const [userProfile, setUserProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+254 700 123 456",
    location: "Nairobi, Kenya",
    bio: "Passionate about technology and always looking for great deals on electronics and gadgets.",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    joinedDate: "2023-06-15",
    verified: false, // Changed to false for verification demo
    bidderRating: 4.8,
    totalBids: 147,
    wonAuctions: 23,
    totalSpent: 245000
  });

  // Verification status
  const [verification, setVerification] = useState({
    identityVerified: false,
    phoneVerified: false,
    emailVerified: true,
    addressVerified: false,
    paymentVerified: false
  });

  // Verification documents
  const [verificationDocs, setVerificationDocs] = useState({
    idDocument: null,
    proofOfAddress: null,
    bankStatement: null
  });

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    smsNotifications: false,
    bidUpdates: true,
    auctionReminders: true,
    marketingEmails: false,
    currency: "KES",
    language: "en",
    timezone: "Africa/Nairobi"
  });

  const handleSave = () => {
    // Save profile logic here
    setIsEditing(false);
    // Show success message
  };

  const handleDocumentUpload = (docType: string, file: File) => {
    // Handle document upload logic
    setVerificationDocs(prev => ({
      ...prev,
      [docType]: file
    }));
  };

  const submitForVerification = (type: string) => {
    // Submit verification request
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
          <h1 className="text-2xl font-bold">Profile & Verification</h1>
          <p className="text-muted-foreground">Manage your account and complete verification</p>
        </div>

        {/* Profile Header */}
        <div className="mb-8">
          <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                  <div className="relative">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={userProfile.profilePicture} />
                      <AvatarFallback>{userProfile.firstName[0]}{userProfile.lastName[0]}</AvatarFallback>
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
                      {userProfile.firstName} {userProfile.lastName}
                    </h1>
                    <p className="text-muted-foreground mb-4">{userProfile.bio}</p>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {userProfile.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {userProfile.location}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        Member since {new Date(userProfile.joinedDate).getFullYear()}
                      </div>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="text-right">
                    <div className="mb-2">
                      <Badge variant={verification.identityVerified ? "default" : "secondary"}>
                        {verification.identityVerified ? "Verified" : "Unverified"}
                        {verification.identityVerified ? 
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">Profile Info</TabsTrigger>
              <TabsTrigger value="verification">Verification</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
            </TabsList>

            {/* Profile Information Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Profile Information</CardTitle>
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
                        value={userProfile.firstName}
                        disabled={!isEditing}
                        onChange={(e) => setUserProfile(prev => ({
                          ...prev,
                          firstName: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={userProfile.lastName}
                        disabled={!isEditing}
                        onChange={(e) => setUserProfile(prev => ({
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
                        value={userProfile.email}
                        disabled={!isEditing}
                        onChange={(e) => setUserProfile(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={userProfile.phone}
                        disabled={!isEditing}
                        onChange={(e) => setUserProfile(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={userProfile.location}
                        disabled={!isEditing}
                        onChange={(e) => setUserProfile(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={userProfile.bio}
                        disabled={!isEditing}
                        rows={4}
                        onChange={(e) => setUserProfile(prev => ({
                          ...prev,
                          bio: e.target.value
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
                    <CardTitle>Account Verification</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Complete your verification to increase trust and unlock all features
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

                      {/* Phone Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Phone className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Phone Verification</h3>
                            <p className="text-sm text-muted-foreground">
                              Verify your phone number with SMS
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.phoneVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => submitForVerification('phone')}>
                              Verify Phone
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Email Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <Mail className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Email Verification</h3>
                            <p className="text-sm text-muted-foreground">
                              Confirm your email address
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.emailVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => submitForVerification('email')}>
                              Verify Email
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Address Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Address Verification</h3>
                            <p className="text-sm text-muted-foreground">
                              Upload proof of address (utility bill, bank statement)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.addressVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <div className="flex gap-2">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => e.target.files?.[0] && handleDocumentUpload('proofOfAddress', e.target.files[0])}
                                className="hidden"
                                id="address-upload"
                              />
                              <Button variant="outline" size="sm" asChild>
                                <label htmlFor="address-upload" className="cursor-pointer">
                                  <Upload className="h-4 w-4 mr-1" />
                                  Upload
                                </label>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => submitForVerification('address')}
                                disabled={!verificationDocs.proofOfAddress}
                              >
                                Submit
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment Verification */}
                      <div className="flex items-start justify-between p-4 border rounded-lg">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 mt-0.5 text-primary" />
                          <div>
                            <h3 className="font-medium">Payment Method</h3>
                            <p className="text-sm text-muted-foreground">
                              Add and verify a payment method
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {verification.paymentVerified ? (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          ) : (
                            <Button size="sm" onClick={() => navigate('/dashboard/payment-methods')}>
                              Add Payment
                            </Button>
                          )}
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
                  <CardTitle>Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.emailNotifications}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            emailNotifications: e.target.checked
                          }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">Receive updates via SMS</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={preferences.smsNotifications}
                          onChange={(e) => setPreferences(prev => ({
                            ...prev,
                            smsNotifications: e.target.checked
                          }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-lg font-medium mb-4">Regional Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Currency</Label>
                        <Select value={preferences.currency} onValueChange={(value) => setPreferences(prev => ({...prev, currency: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="KES">KES (Kenyan Shilling)</SelectItem>
                            <SelectItem value="USD">USD (US Dollar)</SelectItem>
                            <SelectItem value="EUR">EUR (Euro)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Language</Label>
                        <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({...prev, language: value}))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="sw">Swahili</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                          Add an extra layer of security to your account
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

export default BuyerProfile;
