import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";

interface PayoutMethod {
  id: number;
  method_type: "bank_transfer" | "mpesa" | "paypal";
  bank_name?: string;
  account_number_masked?: string;
  account_name?: string;
  branch_code?: string;
  phone_number_masked?: string;
  paypal_email?: string;
  is_default: boolean;
  is_verified: boolean;
  status: string;
  created_at: string;
  updated_at: string;
}

interface PayoutMethodFormData {
  method_type: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  branch_code?: string;
  phone_number?: string;
  paypal_email?: string;
  is_default?: boolean;
}

interface AddPayoutMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddPayoutMethodModal: React.FC<AddPayoutMethodModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<PayoutMethodFormData>({
    method_type: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.createPayoutMethod({
        method_type: formData.method_type as
          | "bank_transfer"
          | "mpesa"
          | "paypal",
        bank_name: formData.bank_name,
        account_number: formData.account_number,
        account_name: formData.account_name,
        branch_code: formData.branch_code,
        phone_number: formData.phone_number,
        paypal_email: formData.paypal_email,
        is_default: formData.is_default,
      });

      if (result.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({ method_type: "" });
      } else {
        setError(
          result.error || result.message || "Failed to add payout method"
        );
      }
    } catch (error) {
      console.error("Error adding payout method:", error);
      setError("Failed to add payout method");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const renderMethodSpecificFields = () => {
    switch (formData.method_type) {
      case "bank_transfer":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="bank_name">Bank Name</Label>
              <Input
                id="bank_name"
                type="text"
                placeholder="e.g., Standard Chartered Bank"
                value={formData.bank_name || ""}
                onChange={(e) => handleInputChange("bank_name", e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="account_name">Account Name</Label>
              <Input
                id="account_name"
                type="text"
                placeholder="Full name on the account"
                value={formData.account_name || ""}
                onChange={(e) =>
                  handleInputChange("account_name", e.target.value)
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="account_number">Account Number</Label>
              <Input
                id="account_number"
                type="text"
                placeholder="Account number"
                value={formData.account_number || ""}
                onChange={(e) =>
                  handleInputChange("account_number", e.target.value)
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="branch_code">Branch Code (Optional)</Label>
              <Input
                id="branch_code"
                type="text"
                placeholder="Branch code if required"
                value={formData.branch_code || ""}
                onChange={(e) =>
                  handleInputChange("branch_code", e.target.value)
                }
              />
            </div>
          </div>
        );

      case "mpesa":
        return (
          <div>
            <Label htmlFor="phone_number">M-Pesa Phone Number</Label>
            <Input
              id="phone_number"
              type="text"
              placeholder="254XXXXXXXXX or 0XXXXXXXXX"
              value={formData.phone_number || ""}
              onChange={(e) =>
                handleInputChange("phone_number", e.target.value)
              }
              required
            />
            <p className="text-sm text-gray-600 mt-1">
              Use format: 254XXXXXXXXX or 0XXXXXXXXX
            </p>
          </div>
        );

      case "paypal":
        return (
          <div>
            <Label htmlFor="paypal_email">PayPal Email</Label>
            <Input
              id="paypal_email"
              type="email"
              placeholder="your.email@example.com"
              value={formData.paypal_email || ""}
              onChange={(e) =>
                handleInputChange("paypal_email", e.target.value)
              }
              required
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payout Method</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">Error</span>
              </div>
              <p className="text-red-700 mt-1">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="method_type">Payout Method Type</Label>
            <Select
              value={formData.method_type}
              onValueChange={(value) => handleInputChange("method_type", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="mpesa">M-Pesa</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {renderMethodSpecificFields()}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.method_type}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Method"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPayoutMethodModal;
export type { PayoutMethod };
