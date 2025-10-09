import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  Loader2,
  Plus,
  CreditCard,
  Smartphone,
  Globe,
} from "lucide-react";
import { apiService } from "@/services/api";
import AddPayoutMethodModal, { PayoutMethod } from "./AddPayoutMethodModal";

interface PayoutMethodsManagerProps {
  onMethodsChange?: () => void;
}

const PayoutMethodsManager: React.FC<PayoutMethodsManagerProps> = ({
  onMethodsChange,
}) => {
  const [methods, setMethods] = useState<PayoutMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    fetchPayoutMethods();
  }, []);

  const fetchPayoutMethods = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiService.getPayoutMethods();

      if (result.success) {
        setMethods(result.data || []);
        onMethodsChange?.();
      } else {
        setError(
          result.error || result.message || "Failed to fetch payout methods"
        );
      }
    } catch (error) {
      console.error("Error fetching payout methods:", error);
      setError("Failed to load payout methods");
    } finally {
      setLoading(false);
    }
  };

  const setAsDefault = async (methodId: number) => {
    setActionLoading(methodId);

    try {
      const result = await apiService.setDefaultPayoutMethod(methodId);

      if (result.success) {
        await fetchPayoutMethods(); // Refresh the list
      } else {
        setError(
          result.error || result.message || "Failed to set default method"
        );
      }
    } catch (error) {
      console.error("Error setting default method:", error);
      setError("Failed to set default method");
    } finally {
      setActionLoading(null);
    }
  };

  const deleteMethod = async (methodId: number) => {
    if (!confirm("Are you sure you want to delete this payout method?")) {
      return;
    }

    setActionLoading(methodId);

    try {
      const result = await apiService.deletePayoutMethod(methodId);

      if (result.success) {
        await fetchPayoutMethods(); // Refresh the list
      } else {
        setError(
          result.error || result.message || "Failed to delete payout method"
        );
      }
    } catch (error) {
      console.error("Error deleting payout method:", error);
      setError("Failed to delete payout method");
    } finally {
      setActionLoading(null);
    }
  };

  const getMethodIcon = (methodType: string) => {
    switch (methodType) {
      case "bank_transfer":
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      case "mpesa":
        return <Smartphone className="w-6 h-6 text-green-600" />;
      case "paypal":
        return <Globe className="w-6 h-6 text-purple-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  const formatMethodDisplay = (method: PayoutMethod) => {
    switch (method.method_type) {
      case "bank_transfer":
        return {
          title: method.bank_name || "Bank Transfer",
          subtitle: `${method.account_name} - Account: ${method.account_number_masked}`,
        };
      case "mpesa":
        return {
          title: "M-Pesa",
          subtitle: `Mobile: ${method.phone_number_masked}`,
        };
      case "paypal":
        return {
          title: "PayPal",
          subtitle: method.paypal_email || "PayPal Account",
        };
      default:
        return {
          title: "Unknown Method",
          subtitle: "",
        };
    }
  };

  const handleAddSuccess = () => {
    fetchPayoutMethods();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
          <span>Loading payout methods...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Payout Settings</span>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Method
          </Button>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Manage how you receive payments from successful sales
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Error</span>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setError(null);
                fetchPayoutMethods();
              }}
            >
              Try Again
            </Button>
          </div>
        )}

        {methods.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No payout methods yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Add a payout method to receive your earnings
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Method
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => {
              const { title, subtitle } = formatMethodDisplay(method);
              const isProcessing = actionLoading === method.id;

              return (
                <div
                  key={method.id}
                  className={`p-4 rounded-lg border ${
                    method.is_default
                      ? "bg-green-500/10 border-green-200"
                      : "bg-muted/20"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      {getMethodIcon(method.method_type)}
                      <div>
                        <h4 className="font-medium flex items-center space-x-2">
                          <span>{title}</span>
                          {method.is_default && (
                            <Badge className="bg-green-100 text-green-800">
                              Default
                            </Badge>
                          )}
                          {method.is_verified && (
                            <Badge className="bg-blue-100 text-blue-800">
                              Verified
                            </Badge>
                          )}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!method.is_default && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAsDefault(method.id)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Set as Default"
                          )}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMethod(method.id)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Payout Information */}
        <div className="text-sm text-gray-600 space-y-2 pt-4 border-t">
          <p>• Payouts are processed twice weekly (Tuesdays and Fridays)</p>
          <p>• Minimum payout amount: Ksh 1,000</p>
          <p>• Bank transfers take 1-2 business days</p>
          <p>• M-Pesa transfers are instant</p>
          <p>• PayPal transfers may take 3-5 business days</p>
        </div>
      </CardContent>

      <AddPayoutMethodModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddSuccess}
      />
    </Card>
  );
};

export default PayoutMethodsManager;
