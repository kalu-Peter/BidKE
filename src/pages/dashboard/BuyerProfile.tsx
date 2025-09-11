import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Save,
  Upload
} from "lucide-react";

interface BuyerProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
    status: string;
    is_verified: boolean;
    created_at: string;
    full_name?: string;
    date_of_birth?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  profile: {
    id?: number;
    user_id?: number;
    national_id?: string;
    national_id_verified?: boolean;
    preferred_categories?: string[];
    max_bid_limit?: number;
    auto_bid_enabled?: boolean;
    default_shipping_address?: string;
    preferred_payment_methods?: string[];
    total_bids?: number;
    successful_bids?: number;
    total_spent?: number;
    won_auctions?: number;
    buyer_rating?: number;
    bid_notifications?: boolean;
    outbid_notifications?: boolean;
    winning_notifications?: boolean;
    auction_ending_notifications?: boolean;
  } | null;
  stats: {
    activeBids: number;
    watchlistItems: number;
    wonAuctions: number;
    totalSpent: number;
  };
}

const BuyerProfile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<BuyerProfileData | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    full_name: '',
    date_of_birth: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'Kenya',
    phone: '',
    national_id: '',
    preferred_categories: [] as string[],
    max_bid_limit: 0,
    auto_bid_enabled: false,
    default_shipping_address: '',
    preferred_payment_methods: [] as string[],
    bid_notifications: true,
    outbid_notifications: true,
    winning_notifications: true,
    auction_ending_notifications: true
  });

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiService.getBuyerProfile();
      
      if (result.success && result.data) {
        setProfileData(result.data);
        
        // Populate form with existing data
        const profile = result.data.profile || {};
        const userData = result.data.user;
        setFormData({
          full_name: userData.full_name || '',
          date_of_birth: userData.date_of_birth || '',
          address: userData.address || '',
          city: userData.city || '',
          state: userData.state || '',
          postal_code: userData.postal_code || '',
          country: userData.country || 'Kenya',
          phone: userData.phone || '',
          national_id: profile.national_id || '',
          preferred_categories: profile.preferred_categories || [],
          max_bid_limit: profile.max_bid_limit || 0,
          auto_bid_enabled: profile.auto_bid_enabled || false,
          default_shipping_address: profile.default_shipping_address || '',
          preferred_payment_methods: profile.preferred_payment_methods || [],
          bid_notifications: profile.bid_notifications !== false,
          outbid_notifications: profile.outbid_notifications !== false,
          winning_notifications: profile.winning_notifications !== false,
          auction_ending_notifications: profile.auction_ending_notifications !== false
        });
      } else {
        setError(result.error || 'Failed to fetch profile data');
      }
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | string[] | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await apiService.updateBuyerProfile(formData);
      
      if (result.success) {
        setSuccess('Profile updated successfully!');
        // Refresh profile data
        await fetchProfileData();
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to save profile');
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const getVerificationStatus = () => {
    const status = profileData?.profile?.national_id_verified ? 'verified' : 'pending';
    const statusConfig = {
      pending: { label: 'Pending Verification', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
      verified: { label: 'Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Verification Failed', color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  const verificationStatus = getVerificationStatus();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Buyer Profile</h1>
            <p className="text-gray-600">Manage your personal information and verification status</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={verificationStatus.color}>
              <verificationStatus.icon className="w-3 h-3 mr-1" />
              {verificationStatus.label}
            </Badge>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList>
            <TabsTrigger value="personal">Personal Information</TabsTrigger>
            <TabsTrigger value="verification">Verification & KYC</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Info (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <Input value={profileData?.user.username || ''} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profileData?.user.email || ''} disabled />
                  </div>
                </div>

                <Separator />

                {/* Editable Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) => handleInputChange('national_id', e.target.value)}
                      placeholder="Enter your national ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your full address"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange('postal_code', e.target.value)}
                      placeholder="Postal Code"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="KE">Kenya</SelectItem>
                      <SelectItem value="UG">Uganda</SelectItem>
                      <SelectItem value="TZ">Tanzania</SelectItem>
                      <SelectItem value="RW">Rwanda</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Identity Verification (KYC)
                </CardTitle>
                <CardDescription>
                  Complete your identity verification to unlock full bidding features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">KYC Verification</h3>
                  <p className="text-gray-600 mb-4">
                    To participate in auctions, you need to verify your identity. This helps ensure a secure marketplace for all users.
                  </p>
                  <Badge className={verificationStatus.color}>
                    <verificationStatus.icon className="w-3 h-3 mr-1" />
                    {verificationStatus.label}
                  </Badge>
                </div>

                {!profileData?.profile?.national_id_verified && (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600">Upload your identity documents</p>
                      <Button variant="outline" className="mt-2">
                        Choose Files
                      </Button>
                    </div>
                    <p className="text-sm text-gray-500">
                      Required documents: Government-issued ID (passport, national ID, or driver's license)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Bidding Preferences
                </CardTitle>
                <CardDescription>
                  Configure your bidding and payment preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="preferred_payment_method">Preferred Payment Method</Label>
                  <Select 
                    value={formData.preferred_payment_methods[0] || ''} 
                    onValueChange={(value) => handleInputChange('preferred_payment_methods', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </>
                    )}
                  </Button>
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
