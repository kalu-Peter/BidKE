import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Upload,
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
    kyc_documents?: string[];
    kyc_type?: string;
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
    full_name: "",
    date_of_birth: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "Kenya",
    phone: "",
    national_id: "",
    preferred_categories: [] as string[],
    max_bid_limit: 0,
    auto_bid_enabled: false,
    default_shipping_address: "",
    preferred_payment_methods: [] as string[],
    bid_notifications: true,
    outbid_notifications: true,
    winning_notifications: true,
    auction_ending_notifications: true,
  });
  // KYC state
  const [kycType, setKycType] = useState<
    "national_id" | "passport" | "driving_license" | ""
  >("");
  // local view of uploaded document URLs (keeps UI responsive while editing)
  const [localKycDocs, setLocalKycDocs] = useState<string[] | null>(null);
  const [kycFiles, setKycFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

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

        // initialize KYC local state
        const existingDocs = result.data.profile?.kyc_documents || [];
        setLocalKycDocs(Array.isArray(existingDocs) ? existingDocs : []);
        setKycType((result.data.profile && result.data.profile.kyc_type) || "");

        // Populate form with existing data
        const profile = result.data.profile || {};
        const userData = result.data.user;
        setFormData({
          full_name: userData.full_name || "",
          date_of_birth: userData.date_of_birth || "",
          address: userData.address || "",
          city: userData.city || "",
          state: userData.state || "",
          postal_code: userData.postal_code || "",
          country: userData.country || "Kenya",
          phone: userData.phone || "",
          national_id: profile.national_id || "",
          preferred_categories: profile.preferred_categories || [],
          max_bid_limit: profile.max_bid_limit || 0,
          auto_bid_enabled: profile.auto_bid_enabled || false,
          default_shipping_address: profile.default_shipping_address || "",
          preferred_payment_methods: profile.preferred_payment_methods || [],
          bid_notifications: profile.bid_notifications !== false,
          outbid_notifications: profile.outbid_notifications !== false,
          winning_notifications: profile.winning_notifications !== false,
          auction_ending_notifications:
            profile.auction_ending_notifications !== false,
        });
      } else {
        setError(result.error || "Failed to fetch profile data");
      }
    } catch (err) {
      setError("Failed to load profile data");
      console.error("Profile error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | string[] | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
    setSuccess(null);
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Clean form data before sending - remove empty values
      const cleanedFormData = { ...formData };

      // Handle date field - don't send if empty
      if (cleanedFormData.date_of_birth === "") {
        delete cleanedFormData.date_of_birth;
      }

      // Handle other empty string fields and empty arrays
      Object.keys(cleanedFormData).forEach((key) => {
        const value = cleanedFormData[key as keyof typeof cleanedFormData];
        if (value === "" && key !== "full_name") {
          // Keep full_name even if empty
          delete cleanedFormData[key as keyof typeof cleanedFormData];
        }
        // Remove empty arrays to avoid PostgreSQL issues
        if (Array.isArray(value) && value.length === 0) {
          delete cleanedFormData[key as keyof typeof cleanedFormData];
        }
      });

      const result = await apiService.updateBuyerProfile(cleanedFormData);

      if (result.success) {
        setSuccess("Profile updated successfully!");
        // Refresh profile data
        await fetchProfileData();
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("Failed to save profile");
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  // Remove a document by index and persist change
  const handleRemoveDocument = async (index: number) => {
    if (!profileData) return;
    const docs = profileData.profile?.kyc_documents || [];
    if (!docs || docs.length === 0) return;
    const confirmed = window.confirm(
      "Are you sure you want to remove this document? You will need to re-upload to complete verification."
    );
    if (!confirmed) return;

    const newDocs = docs.filter((_, i) => i !== index);
    try {
      setUploading(true);
      setError(null);
      const payload: any = { kyc_documents: newDocs };
      // Keep kyc_type if present
      if (profileData.profile?.kyc_type)
        payload.kyc_type = profileData.profile.kyc_type;
      const res = await apiService.updateBuyerProfile(payload);
      if (res.success) {
        setSuccess("Document removed");
        await fetchProfileData();
      } else {
        setError(res.error || "Failed to remove document");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to remove document");
    } finally {
      setUploading(false);
    }
  };

  // Replace a document at index with a newly selected file
  const handleReplaceDocument = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const file = files[0];
    if (!profileData) return;
    try {
      setUploading(true);
      setError(null);
      const uploadRes = await apiService.uploadFile(file, "document");
      if (!uploadRes.success || !(uploadRes.data as any)?.url) {
        throw new Error(uploadRes.error || "Upload failed");
      }
      const newUrl = (uploadRes.data as any).url;
      const docs = profileData.profile?.kyc_documents || [];
      const updated = docs.slice();
      updated[index] = newUrl;
      const payload: any = { kyc_documents: updated };
      if (profileData.profile?.kyc_type)
        payload.kyc_type = profileData.profile.kyc_type;
      const res = await apiService.updateBuyerProfile(payload);
      if (res.success) {
        setSuccess("Document replaced successfully");
        await fetchProfileData();
      } else {
        setError(res.error || "Failed to replace document");
      }
    } catch (err: any) {
      setError(err?.message || "Replace failed");
    } finally {
      setUploading(false);
    }
  };

  const getVerificationStatus = () => {
    const status = profileData?.profile?.national_id_verified
      ? "verified"
      : "pending";
    const statusConfig = {
      pending: {
        label: "Pending Verification",
        color: "bg-yellow-100 text-yellow-800",
        icon: AlertCircle,
      },
      verified: {
        label: "Verified",
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
      },
      rejected: {
        label: "Verification Failed",
        color: "bg-red-100 text-red-800",
        icon: AlertCircle,
      },
    };
    return (
      statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    );
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

  // Ensure kyc_documents is always treated as an array in the UI to avoid crashes
  const kycDocsArray: string[] = (() => {
    const raw = profileData?.profile?.kyc_documents;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string" && raw.trim() !== "") {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (_e) {
        // Not JSON — treat as single URL string
        return [raw];
      }
    }
    return [];
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Buyer Profile</h1>
            <p className="text-gray-600">
              Manage your personal information and verification status
            </p>
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
            <AlertDescription className="text-red-700">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              {success}
            </AlertDescription>
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
                    <Input value={profileData?.user.username || ""} disabled />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profileData?.user.email || ""} disabled />
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
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="national_id">National ID</Label>
                    <Input
                      id="national_id"
                      value={formData.national_id}
                      onChange={(e) =>
                        handleInputChange("national_id", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("date_of_birth", e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        handleInputChange("phone", e.target.value)
                      }
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
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
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      placeholder="State/Province"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) =>
                        handleInputChange("postal_code", e.target.value)
                      }
                      placeholder="Postal Code"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={formData.country}
                    onValueChange={(value) =>
                      handleInputChange("country", value)
                    }
                  >
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
                  Complete your identity verification to unlock full bidding
                  features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    KYC Verification
                  </h3>
                  <p className="text-gray-600 mb-4">
                    To participate in auctions, you need to verify your
                    identity. This helps ensure a secure marketplace for all
                    users.
                  </p>
                  <Badge className={verificationStatus.color}>
                    <verificationStatus.icon className="w-3 h-3 mr-1" />
                    {verificationStatus.label}
                  </Badge>
                </div>

                {!profileData?.profile?.national_id_verified && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="kyc_type">Document Type</Label>
                        <Select
                          value={kycType}
                          onValueChange={(val) => {
                            setKycType(val as any);
                            setKycFiles([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="national_id">
                              National ID (Front & Back)
                            </SelectItem>
                            <SelectItem value="passport">
                              Passport (Photo page)
                            </SelectItem>
                            <SelectItem value="driving_license">
                              Driving License (Front)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Upload Documents</Label>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            multiple={kycType === "national_id"}
                            onChange={(e) => {
                              const files = e.target.files
                                ? Array.from(e.target.files)
                                : [];
                              // If passport or driving_license, only keep first file
                              if (
                                kycType !== "national_id" &&
                                files.length > 1
                              ) {
                                setKycFiles([files[0]]);
                              } else {
                                setKycFiles(files);
                              }
                            }}
                          />
                          <div className="text-sm text-gray-600">
                            {kycType === "national_id"
                              ? "Upload front and back images"
                              : "Upload one image"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={async () => {
                          // Validate selected files against kycType before uploading
                          if (kycFiles.length === 0) {
                            setError("Please select document files to upload");
                            return;
                          }

                          if (
                            kycType === "national_id" &&
                            kycFiles.length !== 2
                          ) {
                            setError(
                              "National ID requires two images (front and back)"
                            );
                            return;
                          }
                          if (
                            (kycType === "passport" ||
                              kycType === "driving_license") &&
                            kycFiles.length !== 1
                          ) {
                            setError(
                              "Passport or driving license requires exactly one image"
                            );
                            return;
                          }

                          try {
                            setUploading(true);
                            setError(null);
                            const uploadedUrls: string[] = [];
                            for (const f of kycFiles) {
                              const res = await apiService.uploadFile(
                                f,
                                "document"
                              );
                              if (
                                res.success &&
                                res.data &&
                                (res.data as any).url
                              ) {
                                uploadedUrls.push((res.data as any).url);
                              } else {
                                throw new Error(res.error || "Upload failed");
                              }
                            }

                            // Prepare payload: send kyc_documents as array of URLs
                            const payload: any = {};
                            payload.kyc_type = kycType || undefined;
                            payload.kyc_documents = uploadedUrls;

                            const result = await apiService.updateBuyerProfile(
                              payload
                            );
                            if (result.success) {
                              setSuccess(
                                "Documents uploaded and submitted for verification"
                              );
                              await fetchProfileData();
                            } else {
                              setError(
                                result.error ||
                                  result.message ||
                                  "Failed to submit documents"
                              );
                            }
                          } catch (err: any) {
                            setError(err?.message || "Upload failed");
                          } finally {
                            setUploading(false);
                          }
                        }}
                        disabled={uploading}
                      >
                        {uploading
                          ? "Uploading..."
                          : "Upload & Submit for Verification"}
                      </Button>
                    </div>
                  </div>
                )}
                {/* If there are existing uploaded documents, show them with controls */}
                {kycDocsArray.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Uploaded Documents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {kycDocsArray.map((url: string, idx: number) => (
                        <div key={idx} className="border rounded p-2">
                          <div className="h-40 w-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {/* Image preview */}
                            <img
                              src={url}
                              alt={`doc-${idx}`}
                              className="object-contain h-full w-full"
                            />
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-sm text-gray-600 truncate">
                              {url}
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-blue-600 cursor-pointer">
                                Replace
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) =>
                                    handleReplaceDocument(e as any, idx)
                                  }
                                />
                              </label>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveDocument(idx)}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
                  <Label htmlFor="preferred_payment_method">
                    Preferred Payment Method
                  </Label>
                  <Select
                    value={formData.preferred_payment_methods[0] || ""}
                    onValueChange={(value) =>
                      handleInputChange("preferred_payment_methods", [value])
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mpesa">M-Pesa</SelectItem>
                      <SelectItem value="bank_transfer">
                        Bank Transfer
                      </SelectItem>
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
