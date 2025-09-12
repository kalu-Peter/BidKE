import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Upload, Car, Smartphone, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api";

const PostItemTab: React.FC = () => {
  const [formData, setFormData] = useState({
    // Item type selection
    itemType: "", // "vehicle" or "electronic"
    
    // Common fields
    title: "",
    description: "",
    startingPrice: "",
    reservePrice: "",
    hasReservePrice: false,
    auctionStartDate: "",
    auctionStartTime: "",
    auctionEndDate: "",
    auctionEndTime: "",
    
    // Vehicle specific fields
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleMileage: "",
    vehicleCondition: "",
    
    // Electronics specific fields
    electronicsBrand: "",
    electronicsModel: "",
    electronicsYear: "",
    electronicsCondition: "",
    
    // Images
    images: [] as Array<{ url: string; alt_text?: string; file?: File }>
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitResult, setSubmitResult] = useState<any>(null);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (formData.images.length >= 8) {
        alert('Maximum 8 images allowed');
        break;
      }
      
      try {
        const response = await apiService.uploadFile(file, 'auction');
        if (response.success && response.data) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, { 
              url: response.data.url, 
              alt_text: file.name,
              file: file 
            }]
          }));
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationErrors: { [key: string]: string } = {};
    
    if (!formData.itemType) {
      validationErrors.itemType = "Please select an item type";
    }
    
    if (!formData.title.trim()) {
      validationErrors.title = "Title is required";
    }
    
    if (!formData.description.trim()) {
      validationErrors.description = "Description is required";
    }
    
    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      validationErrors.startingPrice = "Valid starting price is required";
    }
    
    if (formData.hasReservePrice && (!formData.reservePrice || parseFloat(formData.reservePrice) <= 0)) {
      validationErrors.reservePrice = "Valid reserve price is required when enabled";
    }
    
    if (!formData.auctionStartDate) {
      validationErrors.auctionStartDate = "Auction start date is required";
    }
    
    if (!formData.auctionStartTime) {
      validationErrors.auctionStartTime = "Auction start time is required";
    }
    
    if (!formData.auctionEndDate) {
      validationErrors.auctionEndDate = "Auction end date is required";
    }
    
    if (!formData.auctionEndTime) {
      validationErrors.auctionEndTime = "Auction end time is required";
    }

    // Validate item-specific fields
    if (formData.itemType === "vehicle") {
      if (!formData.vehicleMake) validationErrors.vehicleMake = "Vehicle make is required";
      if (!formData.vehicleModel) validationErrors.vehicleModel = "Vehicle model is required";
      if (!formData.vehicleYear) validationErrors.vehicleYear = "Vehicle year is required";
      if (!formData.vehicleMileage) validationErrors.vehicleMileage = "Vehicle mileage is required";
      if (!formData.vehicleCondition) validationErrors.vehicleCondition = "Vehicle condition is required";
    } else if (formData.itemType === "electronic") {
      if (!formData.electronicsBrand) validationErrors.electronicsBrand = "Electronics brand is required";
      if (!formData.electronicsModel) validationErrors.electronicsModel = "Electronics model is required";
      if (!formData.electronicsYear) validationErrors.electronicsYear = "Electronics year is required";
      if (!formData.electronicsCondition) validationErrors.electronicsCondition = "Electronics condition is required";
    }

    // Check date/time logic
    const startDateTime = new Date(`${formData.auctionStartDate}T${formData.auctionStartTime}`);
    const endDateTime = new Date(`${formData.auctionEndDate}T${formData.auctionEndTime}`);
    const now = new Date();

    if (startDateTime <= now) {
      validationErrors.auctionStartDate = "Auction start time must be in the future";
    }

    if (endDateTime <= startDateTime) {
      validationErrors.auctionEndDate = "Auction end time must be after start time";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Prepare auction data
      const auctionData = {
        itemType: formData.itemType as 'vehicle' | 'electronic',
        title: formData.title.trim(),
        description: formData.description.trim(),
        startingPrice: parseFloat(formData.startingPrice),
        reservePrice: formData.hasReservePrice ? parseFloat(formData.reservePrice) : undefined,
        hasReservePrice: formData.hasReservePrice,
        auctionStartDate: formData.auctionStartDate,
        auctionStartTime: formData.auctionStartTime,
        auctionEndDate: formData.auctionEndDate,
        auctionEndTime: formData.auctionEndTime,
        // Vehicle specific
        ...(formData.itemType === 'vehicle' && {
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehicleMileage: formData.vehicleMileage,
          vehicleCondition: formData.vehicleCondition,
        }),
        // Electronics specific
        ...(formData.itemType === 'electronic' && {
          electronicsBrand: formData.electronicsBrand,
          electronicsModel: formData.electronicsModel,
          electronicsYear: formData.electronicsYear,
          electronicsCondition: formData.electronicsCondition,
        }),
        // Images (uploaded URLs)
        images: formData.images
      };

      const result = await apiService.createAuction(auctionData);

      if (result.success) {
        setSubmitResult(result.data);
        setSuccessMessage("Auction created successfully! Your item has been submitted for review.");
        
        // Reset form
        setFormData({
          itemType: "",
          title: "",
          description: "",
          startingPrice: "",
          reservePrice: "",
          hasReservePrice: false,
          auctionStartDate: "",
          auctionStartTime: "",
          auctionEndDate: "",
          auctionEndTime: "",
          vehicleMake: "",
          vehicleModel: "",
          vehicleYear: "",
          vehicleMileage: "",
          vehicleCondition: "",
          electronicsBrand: "",
          electronicsModel: "",
          electronicsYear: "",
          electronicsCondition: "",
          images: []
        });
      } else {
        setErrors({ submit: result.error || "Failed to create auction. Please try again." });
      }
    } catch (error: any) {
      setErrors({ submit: error.message || "Failed to create auction. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItemTypeSelection = () => (
    <div className="space-y-4">
      <label className="text-sm font-medium">Item Type *</label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => handleInputChange("itemType", "vehicle")}
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            formData.itemType === "vehicle"
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 text-gray-700"
          }`}
        >
          <Car className="w-8 h-8 mx-auto mb-2" />
          <div className="font-medium">Vehicle</div>
          <div className="text-sm opacity-75">Cars, Motorbikes, Trucks</div>
        </button>
        <button
          type="button"
          onClick={() => handleInputChange("itemType", "electronic")}
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            formData.itemType === "electronic"
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 text-gray-700"
          }`}
        >
          <Smartphone className="w-8 h-8 mx-auto mb-2" />
          <div className="font-medium">Electronics</div>
          <div className="text-sm opacity-75">Phones, Laptops, TVs</div>
        </button>
      </div>
    </div>
  );

  const renderVehicleFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
        <Car className="w-5 h-5" />
        <span>Vehicle Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Make *</label>
          <Select value={formData.vehicleMake} onValueChange={(value) => handleInputChange("vehicleMake", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select make" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toyota">Toyota</SelectItem>
              <SelectItem value="nissan">Nissan</SelectItem>
              <SelectItem value="honda">Honda</SelectItem>
              <SelectItem value="mazda">Mazda</SelectItem>
              <SelectItem value="mitsubishi">Mitsubishi</SelectItem>
              <SelectItem value="subaru">Subaru</SelectItem>
              <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
              <SelectItem value="bmw">BMW</SelectItem>
              <SelectItem value="audi">Audi</SelectItem>
              <SelectItem value="volkswagen">Volkswagen</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model *</label>
          <Input 
            placeholder="e.g., Axio, Vitz, Fielder" 
            value={formData.vehicleModel}
            onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <Select value={formData.vehicleYear} onValueChange={(value) => handleInputChange("vehicleYear", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => 2025 - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mileage (KM) *</label>
          <Input 
            type="number" 
            placeholder="e.g., 45000" 
            value={formData.vehicleMileage}
            onChange={(e) => handleInputChange("vehicleMileage", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition *</label>
          <Select value={formData.vehicleCondition} onValueChange={(value) => handleInputChange("vehicleCondition", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="very-good">Very Good</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="salvage">Salvage</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderElectronicsFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
        <Smartphone className="w-5 h-5" />
        <span>Electronics Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand *</label>
          <Select value={formData.electronicsBrand} onValueChange={(value) => handleInputChange("electronicsBrand", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
              <SelectItem value="samsung">Samsung</SelectItem>
              <SelectItem value="sony">Sony</SelectItem>
              <SelectItem value="lg">LG</SelectItem>
              <SelectItem value="dell">Dell</SelectItem>
              <SelectItem value="hp">HP</SelectItem>
              <SelectItem value="lenovo">Lenovo</SelectItem>
              <SelectItem value="asus">ASUS</SelectItem>
              <SelectItem value="acer">Acer</SelectItem>
              <SelectItem value="microsoft">Microsoft</SelectItem>
              <SelectItem value="google">Google</SelectItem>
              <SelectItem value="huawei">Huawei</SelectItem>
              <SelectItem value="xiaomi">Xiaomi</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model *</label>
          <Input 
            placeholder="e.g., iPhone 14, Galaxy S23, MacBook Pro" 
            value={formData.electronicsModel}
            onChange={(e) => handleInputChange("electronicsModel", e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <Select value={formData.electronicsYear} onValueChange={(value) => handleInputChange("electronicsYear", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => 2025 - i).map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition *</label>
          <Select value={formData.electronicsCondition} onValueChange={(value) => handleInputChange("electronicsCondition", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="brand-new">Brand New</SelectItem>
              <SelectItem value="like-new">Like New</SelectItem>
              <SelectItem value="excellent">Excellent</SelectItem>
              <SelectItem value="very-good">Very Good</SelectItem>
              <SelectItem value="good">Good</SelectItem>
              <SelectItem value="fair">Fair</SelectItem>
              <SelectItem value="poor">Poor</SelectItem>
              <SelectItem value="for-parts">For Parts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Post New Item</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Success Message */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
              {submitResult && (
                <div className="mt-2 text-sm">
                  <p><strong>Auction ID:</strong> {submitResult.auction_id}</p>
                  <p><strong>Status:</strong> {submitResult.status}</p>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Message */}
        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && !errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors:
              <ul className="list-disc list-inside mt-2">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Item Type Selection */}
          {renderItemTypeSelection()}

          {/* Only show form fields if item type is selected */}
          {formData.itemType && (
            <>
              {/* Common Fields */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Title *</label>
                    <Input 
                      placeholder={formData.itemType === "vehicle" ? "e.g., Toyota Axio 2016" : "e.g., iPhone 14 Pro Max 256GB"} 
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                    />
                    {errors.title && <p className="text-red-500 text-sm">{errors.title}</p>}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Starting Price (Ksh) *</label>
                    <Input 
                      type="number" 
                      placeholder="50000" 
                      value={formData.startingPrice}
                      onChange={(e) => handleInputChange("startingPrice", e.target.value)}
                      required
                    />
                    {errors.startingPrice && <p className="text-red-500 text-sm">{errors.startingPrice}</p>}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hasReservePrice"
                      checked={formData.hasReservePrice}
                      onCheckedChange={(checked) => handleInputChange("hasReservePrice", checked as boolean)}
                    />
                    <label htmlFor="hasReservePrice" className="text-sm font-medium">
                      Set Reserve Price (Optional)
                    </label>
                  </div>
                  {formData.hasReservePrice && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Reserve Price (Ksh)</label>
                      <Input 
                        type="number" 
                        placeholder="900000" 
                        value={formData.reservePrice}
                        onChange={(e) => handleInputChange("reservePrice", e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Reserve price is the minimum amount you're willing to accept. It's hidden from bidders.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description *</label>
                  <Textarea 
                    placeholder="Provide detailed description including condition, features, reason for sale, etc."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Auction Timing */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Auction Schedule</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Auction Start</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date *</label>
                        <Input 
                          type="date" 
                          value={formData.auctionStartDate}
                          onChange={(e) => handleInputChange("auctionStartDate", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time *</label>
                        <Input 
                          type="time" 
                          value={formData.auctionStartTime}
                          onChange={(e) => handleInputChange("auctionStartTime", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Auction End</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date *</label>
                        <Input 
                          type="date" 
                          value={formData.auctionEndDate}
                          onChange={(e) => handleInputChange("auctionEndDate", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time *</label>
                        <Input 
                          type="time" 
                          value={formData.auctionEndTime}
                          onChange={(e) => handleInputChange("auctionEndTime", e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specific Fields Based on Item Type */}
              {formData.itemType === "vehicle" && renderVehicleFields()}
              {formData.itemType === "electronic" && renderElectronicsFields()}

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Images</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Images *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB each (Max 8 images)</p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button variant="outline" className="mt-4" type="button" asChild>
                        <span>Choose Files</span>
                      </Button>
                    </label>
                  </div>
                  
                  {/* Display uploaded images */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image.file ? URL.createObjectURL(image.file) : image.url}
                            alt={image.alt_text || `Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t">
                <Button variant="outline" type="button" disabled={isSubmitting}>
                  Save as Draft
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                  {isSubmitting ? "Creating Auction..." : "Submit for Review"}
                </Button>
              </div>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default PostItemTab;
