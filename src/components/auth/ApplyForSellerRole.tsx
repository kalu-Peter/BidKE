import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, CheckCircle2, Store, User } from 'lucide-react';

interface ApplyForSellerRoleProps {
  onSuccess?: () => void;
}

const ApplyForSellerRole: React.FC<ApplyForSellerRoleProps> = ({ onSuccess }) => {
  const { user, isSubmitting } = useAuth();
  const [formData, setFormData] = useState({
    business_type: '',
    company_name: '',
    business_registration: '',
    tax_number: '',
    address: '',
    city: '',
    state: '',
    postal_code: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmittingForm(true);

    // Validate required fields
    if (!formData.business_type) {
      setError('Business type is required');
      setIsSubmittingForm(false);
      return;
    }

    if (formData.business_type !== 'individual' && !formData.company_name) {
      setError('Company name is required for business accounts');
      setIsSubmittingForm(false);
      return;
    }

    try {
      // TODO: Implement seller role application API call
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess('Your seller application has been submitted successfully! It will be reviewed within 2-3 business days.');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError('Application failed. Please try again.');
    } finally {
      setIsSubmittingForm(false);
    }
  };

  // Check if user already has seller role
  const userRoles = user?.roles?.map(role => role.role_name) || [];
  const hasSellerRole = userRoles.includes('seller');

  if (hasSellerRole) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Seller Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
            <Store className="w-5 h-5 text-green-600" />
            <span className="text-green-800">You already have seller privileges!</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="w-5 h-5" />
          Apply to Become a Seller
        </CardTitle>
        <p className="text-gray-600">
          Expand your BidKE experience by becoming a seller. You'll keep your buyer privileges too!
        </p>
      </CardHeader>
      <CardContent>
        {/* Current Roles Display */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Your Current Roles:</h3>
          <div className="flex gap-2">
            {user?.roles?.map((role, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {role.role_name.charAt(0).toUpperCase() + role.role_name.slice(1)}
              </Badge>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <span className="text-red-800 text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-800 text-sm">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="business_type">Business Type</Label>
            <Select value={formData.business_type} onValueChange={(value) => handleInputChange('business_type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual Seller</SelectItem>
                <SelectItem value="auctioneer">Professional Auctioneer</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
                <SelectItem value="business">Business/Company</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.business_type !== 'individual' && (
            <div>
              <Label htmlFor="company_name">Company/Business Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Enter your business name"
              />
            </div>
          )}

          {formData.business_type !== 'individual' && (
            <div>
              <Label htmlFor="business_registration">Business Registration Number</Label>
              <Input
                id="business_registration"
                value={formData.business_registration}
                onChange={(e) => handleInputChange('business_registration', e.target.value)}
                placeholder="e.g., C.12345/2023"
              />
            </div>
          )}

          {formData.business_type !== 'individual' && (
            <div>
              <Label htmlFor="tax_number">Tax Number (KRA PIN)</Label>
              <Input
                id="tax_number"
                value={formData.tax_number}
                onChange={(e) => handleInputChange('tax_number', e.target.value)}
                placeholder="e.g., A123456789Z"
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="e.g., Nairobi"
              />
            </div>
            <div>
              <Label htmlFor="state">County</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleInputChange('state', e.target.value)}
                placeholder="e.g., Nairobi County"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Business Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your business address"
              rows={3}
            />
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmittingForm}
            >
              {isSubmittingForm ? 'Submitting Application...' : 'Apply for Seller Role'}
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">What happens next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Your application will be reviewed within 2-3 business days</li>
            <li>• You may be contacted for additional verification</li>
            <li>• Once approved, you'll gain full seller privileges</li>
            <li>• You'll retain all your current buyer privileges</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplyForSellerRole;
