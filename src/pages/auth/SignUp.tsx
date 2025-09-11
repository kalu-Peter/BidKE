import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FormField from "@/components/auth/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

const SignUp = () => {
  const navigate = useNavigate();
  const { register, isSubmitting } = useAuth();
  
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [successMessage, setSuccessMessage] = useState<string>("");

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.username) newErrors.username = "Username is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.phone) newErrors.phone = "Phone number is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const registrationData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      };

      const result = await register(registrationData);
      
      if (result.success) {
        setSuccessMessage("Registration successful! Please check your email for verification instructions.");
        setErrors({});
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please log in to continue.',
              email: formData.email 
            }
          });
        }, 3000);
      } else {
        setErrors({ submit: result.error || "Registration failed. Please try again." });
        setSuccessMessage("");
      }
    } catch (error) {
      setErrors({ submit: "Registration failed. Please try again." });
      setSuccessMessage("");
    }
  };

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 pt-24 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Join BidLode</h1>
              <p className="text-gray-600">Create your account to start your auction journey</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
              </CardHeader>
              <CardContent>
                {successMessage && (
                  <Alert variant="default" className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {successMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {errors.submit && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{errors.submit}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <FormField
                    label="Username"
                    value={formData.username}
                    onChange={(value) => updateField("username", value)}
                    required
                    error={errors.username}
                    placeholder="Enter your username"
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(value) => updateField("email", value)}
                      required
                      error={errors.email}
                      placeholder="📧 your.email@example.com"
                    />
                    <FormField
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(value) => updateField("phone", value)}
                      required
                      error={errors.phone}
                      placeholder="📱 +254 700 000 000"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      label="Password"
                      type="password"
                      value={formData.password}
                      onChange={(value) => updateField("password", value)}
                      required
                      error={errors.password}
                      placeholder="Minimum 8 characters"
                    />
                    <FormField
                      label="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(value) => updateField("confirmPassword", value)}
                      required
                      error={errors.confirmPassword}
                      placeholder="Confirm your password"
                    />
                  </div>

                  <div className="mt-8">
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={isSubmitting}
                      size="lg"
                    >
                      {isSubmitting ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
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

export default SignUp;
