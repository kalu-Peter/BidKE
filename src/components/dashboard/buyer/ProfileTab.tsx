import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Mail, Phone, MapPin, Shield, Bell, CreditCard, Eye, EyeOff, Camera } from "lucide-react";

const ProfileTab: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeSection, setActiveSection] = useState("profile");

  // Mock user data
  const [userProfile, setUserProfile] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+254 700 123 456",
    location: "Nairobi, Kenya",
    bio: "Passionate about technology and always looking for great deals on electronics and gadgets.",
    profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    joinedDate: "2023-06-15",
    verified: true,
    bidderRating: 4.8,
    totalBids: 147,
    wonAuctions: 23,
    totalSpent: 245000
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

  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    loginNotifications: true,
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleSaveProfile = () => {
    console.log("Save profile:", userProfile);
    setIsEditing(false);
    // Handle profile save logic
  };

  const handleSavePreferences = () => {
    console.log("Save preferences:", preferences);
    // Handle preferences save logic
  };

  const handleChangePassword = () => {
    console.log("Change password");
    // Handle password change logic
  };

  const handleUploadPhoto = () => {
    console.log("Upload profile photo");
    // Handle photo upload logic
  };

  const renderProfileSection = () => (
    <div className="space-y-6">
      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <img 
            src={userProfile.profilePicture} 
            alt="Profile" 
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          {isEditing && (
            <button 
              onClick={handleUploadPhoto}
              className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold">{userProfile.firstName} {userProfile.lastName}</h3>
          <p className="text-gray-600">{userProfile.email}</p>
          <div className="flex items-center mt-2">
            {userProfile.verified && (
              <Badge className="bg-green-100 text-green-800 mr-2">
                <Shield className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            <Badge variant="outline">
              Rating: {userProfile.bidderRating}/5
            </Badge>
          </div>
        </div>
      </div>

      {/* Profile Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-blue-800">{userProfile.totalBids}</p>
          <p className="text-sm text-blue-600">Total Bids</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-green-800">{userProfile.wonAuctions}</p>
          <p className="text-sm text-green-600">Won Auctions</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-lg font-bold text-purple-800">Ksh {userProfile.totalSpent.toLocaleString()}</p>
          <p className="text-sm text-purple-600">Total Spent</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <p className="text-2xl font-bold text-orange-800">{userProfile.bidderRating}</p>
          <p className="text-sm text-orange-600">Buyer Rating</p>
        </div>
      </div>

      {/* Profile Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={userProfile.firstName}
              onChange={(e) => setUserProfile(prev => ({ ...prev, firstName: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={userProfile.lastName}
              onChange={(e) => setUserProfile(prev => ({ ...prev, lastName: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={userProfile.email}
              onChange={(e) => setUserProfile(prev => ({ ...prev, email: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={userProfile.phone}
              onChange={(e) => setUserProfile(prev => ({ ...prev, phone: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={userProfile.location}
              onChange={(e) => setUserProfile(prev => ({ ...prev, location: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label htmlFor="joinedDate">Member Since</Label>
            <Input
              id="joinedDate"
              value={new Date(userProfile.joinedDate).toLocaleDateString()}
              disabled
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={userProfile.bio}
          onChange={(e) => setUserProfile(prev => ({ ...prev, bio: e.target.value }))}
          disabled={!isEditing}
          rows={3}
          placeholder="Tell us about yourself..."
        />
      </div>

      <div className="flex space-x-2">
        {isEditing ? (
          <>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
            <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
          </>
        ) : (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>
    </div>
  );

  const renderPreferencesSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-gray-600">Receive updates via email</p>
            </div>
            <input
              id="emailNotifications"
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => setPreferences(prev => ({ ...prev, emailNotifications: e.target.checked }))}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="smsNotifications">SMS Notifications</Label>
              <p className="text-sm text-gray-600">Receive updates via SMS</p>
            </div>
            <input
              id="smsNotifications"
              type="checkbox"
              checked={preferences.smsNotifications}
              onChange={(e) => setPreferences(prev => ({ ...prev, smsNotifications: e.target.checked }))}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="bidUpdates">Bid Updates</Label>
              <p className="text-sm text-gray-600">Get notified when you're outbid</p>
            </div>
            <input
              id="bidUpdates"
              type="checkbox"
              checked={preferences.bidUpdates}
              onChange={(e) => setPreferences(prev => ({ ...prev, bidUpdates: e.target.checked }))}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auctionReminders">Auction Reminders</Label>
              <p className="text-sm text-gray-600">Reminders for watched auctions ending soon</p>
            </div>
            <input
              id="auctionReminders"
              type="checkbox"
              checked={preferences.auctionReminders}
              onChange={(e) => setPreferences(prev => ({ ...prev, auctionReminders: e.target.checked }))}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketingEmails">Marketing Emails</Label>
              <p className="text-sm text-gray-600">Promotional offers and newsletters</p>
            </div>
            <input
              id="marketingEmails"
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) => setPreferences(prev => ({ ...prev, marketingEmails: e.target.checked }))}
              className="rounded"
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Regional Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={preferences.currency} onValueChange={(value) => setPreferences(prev => ({ ...prev, currency: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                <SelectItem value="EUR">Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={preferences.language} onValueChange={(value) => setPreferences(prev => ({ ...prev, language: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="sw">Swahili</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={preferences.timezone} onValueChange={(value) => setPreferences(prev => ({ ...prev, timezone: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Nairobi">Africa/Nairobi</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Button onClick={handleSavePreferences}>Save Preferences</Button>
    </div>
  );

  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Password & Security</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showPassword ? "text" : "password"}
                value={security.currentPassword}
                onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={security.newPassword}
              onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
              placeholder="Enter new password"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={security.confirmPassword}
              onChange={(e) => setSecurity(prev => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
            />
          </div>
          <Button onClick={handleChangePassword}>Change Password</Button>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Security Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
              <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
            </div>
            <input
              id="twoFactorEnabled"
              type="checkbox"
              checked={security.twoFactorEnabled}
              onChange={(e) => setSecurity(prev => ({ ...prev, twoFactorEnabled: e.target.checked }))}
              className="rounded"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="loginNotifications">Login Notifications</Label>
              <p className="text-sm text-gray-600">Get notified of new logins to your account</p>
            </div>
            <input
              id="loginNotifications"
              type="checkbox"
              checked={security.loginNotifications}
              onChange={(e) => setSecurity(prev => ({ ...prev, loginNotifications: e.target.checked }))}
              className="rounded"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="w-5 h-5" />
          <span>Profile Settings</span>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage your account information, preferences, and security settings
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 border-b">
          <button
            onClick={() => setActiveSection("profile")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${
              activeSection === "profile" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <User className="w-4 h-4 inline mr-1" />
            Profile
          </button>
          <button
            onClick={() => setActiveSection("preferences")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${
              activeSection === "preferences" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1" />
            Preferences
          </button>
          <button
            onClick={() => setActiveSection("security")}
            className={`pb-2 px-1 text-sm font-medium border-b-2 ${
              activeSection === "security" 
                ? "border-blue-500 text-blue-600" 
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Shield className="w-4 h-4 inline mr-1" />
            Security
          </button>
        </div>

        {/* Section Content */}
        {activeSection === "profile" && renderProfileSection()}
        {activeSection === "preferences" && renderPreferencesSection()}
        {activeSection === "security" && renderSecuritySection()}

        {/* Account Actions */}
        <Separator />
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-red-600">Danger Zone</h3>
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileTab;
