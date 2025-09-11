import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardPath } from "@/components/auth/ProtectedRoute";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormField from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, AlertCircle, CheckCircle, Clock } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    selectedRole: "buyer", // Role selection for dashboard preference
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Get the intended destination from location state or default to dashboard
  const from = location.state?.from?.pathname || null;
  
  // Handle success message from registration
  useEffect(() => {
    if (location.state?.message && location.state?.type === 'success') {
      setSuccessMessage(location.state.message);
      // If coming from admin signup, set default role preference to admin
      if (location.state.message.includes('Admin account')) {
        setFormData(prev => ({ ...prev, selectedRole: 'admin' }));
      }
      // Clear the message from location state
      window.history.replaceState({}, document.title);
      
      // Clear success message after 10 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 10000);
    }
  }, [location.state]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.username) {
      newErrors.username = "Username is required";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);
    setLoginAttempted(true);

    try {
      const result = await login(formData.username, formData.password, formData.selectedRole);
      
      if (result.success && result.user) {
        setLoginSuccess(true);
        
        // Determine redirect path based on user preference and permissions
        let redirectPath: string;
        
        if (from && from !== '/login') {
          redirectPath = from;
        } else {
          // Use the user's role (already set by AuthContext based on preference)
          redirectPath = getDashboardPath(result.user.role, result.user.status);
        }

        // Show success message briefly, then redirect
        setTimeout(() => {
          navigate(redirectPath, { replace: true });
        }, 2000);
      } else {
        throw new Error(result.error || 'Login failed');
      }

    } catch (error: any) {
      setErrors({ submit: error.message || "Invalid username or password. Please try again." });
      setLoginAttempted(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!user) return null;

    const statusConfigs = {
      buyer: {
        email_verified: {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          title: "Account Partially Active",
          message: "Your email is verified. Complete KYC verification to start bidding.",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
          capabilities: ["Browse auctions", "Add to watchlist", "View auction details"],
          limitations: ["Cannot place bids until KYC approved"]
        },
        approved: {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: "Account Fully Active",
          message: "Welcome back! Your account is fully verified and ready to use.",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          capabilities: ["Browse auctions", "Place bids", "Make payments", "Full access to all features"],
          limitations: []
        }
      },
      seller: {
        email_verified: {
          icon: <Clock className="w-5 h-5 text-yellow-600" />,
          title: "Business Account Under Review",
          message: "Your contact details are verified. Business documents are being reviewed.",
          bgColor: "bg-yellow-50",
          textColor: "text-yellow-800",
          capabilities: ["Access dashboard", "View analytics", "Update company profile"],
          limitations: ["Cannot list items until business approval"]
        },
        approved: {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: "Business Account Active",
          message: "Welcome back! Your business is verified and ready to list items.",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          capabilities: ["List auction items", "Manage inventory", "View sales analytics", "Process payments"],
          limitations: []
        }
      },
      admin: {
        approved: {
          icon: <CheckCircle className="w-5 h-5 text-green-600" />,
          title: "Admin Access Granted",
          message: "Welcome back! You have full administrative access to the platform.",
          bgColor: "bg-green-50",
          textColor: "text-green-800",
          capabilities: ["Manage users", "Oversee transactions", "Platform analytics", "Full system access"],
          limitations: []
        }
      }
    };

    const config = statusConfigs[user.role]?.[user.status];
    if (!config) return null;

    return (
      <div className={`p-6 rounded-lg ${config.bgColor} mt-6`}>
        <div className="flex items-start space-x-3">
          {config.icon}
          <div className="flex-1">
            <h3 className={`font-semibold ${config.textColor} mb-2`}>
              {config.title}
            </h3>
            <p className={`${config.textColor} mb-4`}>
              {config.message}
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className={`font-medium ${config.textColor} mb-2`}>You can:</h4>
                <ul className={`text-sm ${config.textColor} space-y-1`}>
                  {config.capabilities.map((capability, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {config.limitations.length > 0 && (
                <div>
                  <h4 className={`font-medium ${config.textColor} mb-2`}>Limitations:</h4>
                  <ul className={`text-sm ${config.textColor} space-y-1`}>
                    {config.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                        <span>{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            {user.status === 'email_verified' && user.role !== 'admin' && (
              <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                <p className={`text-sm ${config.textColor}`}>
                  {user.role === 'buyer' 
                    ? "Complete your KYC verification to unlock full bidding features."
                    : "Your business verification is in progress. We'll notify you once approved."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Sign In to BidLode</CardTitle>
                <p className="text-gray-600 text-sm">
                  Access your unified buyer and seller dashboard
                </p>
              </CardHeader>
              <CardContent>
                {successMessage && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Unified Access Info */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-2">✨ Unified Account Access</h4>
                  <p className="text-sm text-blue-700">
                    Your account includes both buyer and seller features. Choose your preferred dashboard to start with - you can switch between them anytime.
                  </p>
                </div>
                {loginSuccess && user ? (
                  <div>
                    <div className="text-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <h3 className="text-lg font-semibold text-green-800">Login Successful!</h3>
                      <p className="text-sm text-gray-600">Redirecting you to dashboard...</p>
                    </div>
                    {getStatusDisplay()}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Dashboard Preference Selection */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        Preferred Dashboard <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 mb-2">
                        Choose which dashboard to access first. You can switch between buyer and seller features anytime.
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => updateField("selectedRole", "buyer")}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.selectedRole === "buyer"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <div className="font-medium text-sm">🛒 Buyer</div>
                          <div className="text-xs mt-1 opacity-75">Browse & bid</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("selectedRole", "seller")}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.selectedRole === "seller"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <div className="font-medium text-sm">🏪 Seller</div>
                          <div className="text-xs mt-1 opacity-75">List & sell</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField("selectedRole", "admin")}
                          className={`p-3 border-2 rounded-lg text-center transition-all ${
                            formData.selectedRole === "admin"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-gray-200 hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <div className="font-medium text-sm">🛡️ Admin</div>
                          <div className="text-xs mt-1 opacity-75">Platform admin</div>
                        </button>
                      </div>
                    </div>

                    <FormField
                      label="Username"
                      type="text"
                      value={formData.username}
                      onChange={(value) => updateField("username", value)}
                      required
                      error={errors.username}
                      placeholder="Enter your username"
                    />
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="Enter your password"
                          value={formData.password}
                          onChange={(e) => updateField("password", e.target.value)}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password}</p>
                      )}
                    </div>

                    {errors.submit && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{errors.submit}</AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-sm text-primary hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      size="lg"
                      disabled={isLoading}
                    >
                      {isLoading 
                        ? "Signing in..." 
                        : `Access ${
                            formData.selectedRole === "buyer" ? "Buyer" : 
                            formData.selectedRole === "seller" ? "Seller" : "Admin"
                          } Dashboard`
                      }
                    </Button>
                  </form>
                )}

                {!loginSuccess && (
                  <>
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="text-center space-y-2">
                        <p className="text-sm text-gray-600">
                          Don't have an account?{" "}
                          <Link to="/signup" className="text-primary hover:underline font-medium">
                            Sign up here
                          </Link>
                        </p>
                        <p className="text-sm text-gray-600">
                          Need admin access?{" "}
                          <Link to="/admin-signup" className="text-primary hover:underline font-medium">
                            Admin registration
                          </Link>
                        </p>
                        <p className="text-xs text-gray-500">
                          New accounts get both buyer and seller access. Choose your preferred starting dashboard above.
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-800 mb-2">Demo Accounts:</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <p><strong>Unified Account:</strong> testuser789 / password123</p>
                        <p><strong>Admin Account:</strong> purejson / testpass123</p>
                        <p className="text-xs italic">Regular accounts have both buyer and seller access</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LoginPage;
