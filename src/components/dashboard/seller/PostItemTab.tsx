import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  Upload,
  Car,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";

const PostItemTab: React.FC = () => {
  const [formData, setFormData] = useState({
    // Item type selection
    itemType: "", // "vehicle" or "electronic"

    // Common fields
    title: "",
    description: "",
    location: "",
    startingPrice: "",
    reservePrice: "",
    hasReservePrice: false,
    auctionStartDate: "",
    auctionStartTime: "",
    auctionEndDate: "",
    auctionEndTime: "",

    // Vehicle specific fields
    vehicleType: "",
    vehicleCategory: "",
    vehicleMake: "",
    vehicleModel: "",
    vehicleYear: "",
    vehicleMileage: "",
    vehicleCondition: "",
    vehicleRegistrationNumber: "",
    vehicleRegistrationDocument: null as File | null,
    vehicleInsuranceDocument: null as File | null,
    vehicleRegistrationDocumentUrl: "",
    vehicleInsuranceDocumentUrl: "",

    // Additional car-specific fields
    vehicleFuelType: "",
    vehicleTransmission: "",
    vehicleColor: "",
    vehicleSeats: "",
    vehicleDoors: "",
    vehicleVin: "",
    vehicleEngineNumber: "",
    vehicleChassisNumber: "",

    // Electronics specific fields
    electronicsBrand: "",
    electronicsModel: "",
    electronicsYear: "",
    electronicsCondition: "",
    electronicsSerialNumber: "",
    electronicsHasWarranty: false,
    electronicsWarrantyPeriod: "",
    electronicsWarrantyProvider: "",
    electronicsWarrantyDocument: null as File | null,
    electronicsWarrantyDocumentUrl: "",
    electronicsIncludesAccessories: "",
    electronicsReceiptAvailable: false,
    electronicsManualAvailable: false,
    electronicsReceiptDocument: null as File | null,
    electronicsReceiptUrl: "",

    // Images
    images: [] as Array<{ url: string; alt_text?: string; file?: File }>,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [submitResult, setSubmitResult] = useState<any>(null);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    for (const file of files) {
      if (formData.images.length >= 8) {
        alert("Maximum 8 images allowed");
        break;
      }

      try {
        const response = await apiService.uploadFile(file, "auction");
        if (response.success && response.data) {
          setFormData((prev) => ({
            ...prev,
            images: [
              ...prev.images,
              {
                url: response.data.url,
                alt_text: file.name,
                file: file,
              },
            ],
          }));
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        alert(`Failed to upload ${file.name}`);
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: "registration" | "insurance"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (allow PDF, JPG, PNG)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, JPG, or PNG file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      const response = await apiService.uploadFile(file, "document");
      if (response.success && response.data) {
        if (documentType === "registration") {
          setFormData((prev) => ({
            ...prev,
            vehicleRegistrationDocument: file,
            vehicleRegistrationDocumentUrl: response.data.url,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            vehicleInsuranceDocument: file,
            vehicleInsuranceDocumentUrl: response.data.url,
          }));
        }
      }
    } catch (error) {
      console.error(`Error uploading ${documentType} document:`, error);
      alert(`Failed to upload ${documentType} document`);
    }
  };

  const removeDocument = (documentType: "registration" | "insurance") => {
    if (documentType === "registration") {
      setFormData((prev) => ({
        ...prev,
        vehicleRegistrationDocument: null,
        vehicleRegistrationDocumentUrl: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        vehicleInsuranceDocument: null,
        vehicleInsuranceDocumentUrl: "",
      }));
    }
  };

  const handleElectronicsDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    documentType: "warranty" | "receipt"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (allow PDF, JPG, PNG)
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a PDF, JPG, or PNG file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    try {
      const response = await apiService.uploadFile(file, "document");
      if (response.success && response.data) {
        if (documentType === "warranty") {
          setFormData((prev) => ({
            ...prev,
            electronicsWarrantyDocument: file,
            electronicsWarrantyDocumentUrl: response.data.url,
          }));
        } else {
          setFormData((prev) => ({
            ...prev,
            electronicsReceiptDocument: file,
            electronicsReceiptUrl: response.data.url,
          }));
        }
      }
    } catch (error) {
      console.error(`Error uploading ${documentType} document:`, error);
      alert(`Failed to upload ${documentType} document`);
    }
  };

  const removeElectronicsDocument = (documentType: "warranty" | "receipt") => {
    if (documentType === "warranty") {
      setFormData((prev) => ({
        ...prev,
        electronicsWarrantyDocument: null,
        electronicsWarrantyDocumentUrl: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        electronicsReceiptDocument: null,
        electronicsReceiptUrl: "",
      }));
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    submitStatus: "draft" | "pending" = "pending"
  ) => {
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

    if (!formData.location.trim()) {
      validationErrors.location = "Location is required";
    }

    if (!formData.startingPrice || parseFloat(formData.startingPrice) <= 0) {
      validationErrors.startingPrice = "Valid starting price is required";
    }

    if (
      formData.hasReservePrice &&
      (!formData.reservePrice || parseFloat(formData.reservePrice) <= 0)
    ) {
      validationErrors.reservePrice =
        "Valid reserve price is required when enabled";
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
      if (!formData.vehicleCategory)
        validationErrors.vehicleCategory =
          "Please select vehicle category (Car or Motorbike)";
      if (!formData.vehicleType)
        validationErrors.vehicleType = "Vehicle type is required";
      if (!formData.vehicleMake)
        validationErrors.vehicleMake = "Vehicle make is required";
      if (!formData.vehicleModel)
        validationErrors.vehicleModel = "Vehicle model is required";
      if (!formData.vehicleYear)
        validationErrors.vehicleYear = "Vehicle year is required";
      if (!formData.vehicleMileage)
        validationErrors.vehicleMileage = "Vehicle mileage is required";
      if (!formData.vehicleCondition)
        validationErrors.vehicleCondition = "Vehicle condition is required";
      if (!formData.vehicleRegistrationNumber.trim())
        validationErrors.vehicleRegistrationNumber =
          "Vehicle registration number is required";
      if (!formData.vehicleRegistrationDocument)
        validationErrors.vehicleRegistrationDocument =
          "Registration document is required";
      if (!formData.vehicleInsuranceDocument)
        validationErrors.vehicleInsuranceDocument =
          "Insurance document is required";

      // Additional validation for car-specific fields
      if (formData.vehicleCategory === "car") {
        if (!formData.vehicleFuelType)
          validationErrors.vehicleFuelType = "Fuel type is required for cars";
        if (!formData.vehicleTransmission)
          validationErrors.vehicleTransmission =
            "Transmission type is required for cars";
        if (!formData.vehicleColor.trim())
          validationErrors.vehicleColor = "Vehicle color is required for cars";
        if (!formData.vehicleSeats)
          validationErrors.vehicleSeats =
            "Number of seats is required for cars";
        if (!formData.vehicleDoors)
          validationErrors.vehicleDoors =
            "Number of doors is required for cars";
        if (!formData.vehicleVin.trim())
          validationErrors.vehicleVin = "VIN is required for cars";
        if (!formData.vehicleEngineNumber.trim())
          validationErrors.vehicleEngineNumber =
            "Engine number is required for cars";
        if (!formData.vehicleChassisNumber.trim())
          validationErrors.vehicleChassisNumber =
            "Chassis number is required for cars";
      }
    } else if (formData.itemType === "electronic") {
      if (!formData.electronicsBrand)
        validationErrors.electronicsBrand = "Electronics brand is required";
      if (!formData.electronicsModel)
        validationErrors.electronicsModel = "Electronics model is required";
      if (!formData.electronicsYear)
        validationErrors.electronicsYear = "Electronics year is required";
      if (!formData.electronicsCondition)
        validationErrors.electronicsCondition =
          "Electronics condition is required";
      if (!formData.electronicsSerialNumber.trim())
        validationErrors.electronicsSerialNumber = "Serial number is required";

      // Warranty-specific validation
      if (formData.electronicsHasWarranty) {
        if (!formData.electronicsWarrantyPeriod.trim())
          validationErrors.electronicsWarrantyPeriod =
            "Warranty period is required when warranty is selected";
        if (!formData.electronicsWarrantyProvider.trim())
          validationErrors.electronicsWarrantyProvider =
            "Warranty provider is required when warranty is selected";
        if (!formData.electronicsWarrantyDocument)
          validationErrors.electronicsWarrantyDocument =
            "Warranty document is required when warranty is selected";
      }

      if (!formData.electronicsIncludesAccessories.trim())
        validationErrors.electronicsIncludesAccessories =
          "Please specify included accessories";

      // Receipt validation
      if (
        formData.electronicsReceiptAvailable &&
        !formData.electronicsReceiptDocument
      )
        validationErrors.electronicsReceiptDocument =
          "Receipt document is required when receipt available is selected";
    }

    // Check date/time logic
    const startDateTime = new Date(
      `${formData.auctionStartDate}T${formData.auctionStartTime}`
    );
    const endDateTime = new Date(
      `${formData.auctionEndDate}T${formData.auctionEndTime}`
    );
    const now = new Date();

    if (startDateTime <= now) {
      validationErrors.auctionStartDate =
        "Auction start time must be in the future";
    }

    if (endDateTime <= startDateTime) {
      validationErrors.auctionEndDate =
        "Auction end time must be after start time";
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
        itemType: formData.itemType as "vehicle" | "electronic",
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        startingPrice: parseFloat(formData.startingPrice),
        reservePrice: formData.hasReservePrice
          ? parseFloat(formData.reservePrice)
          : undefined,
        hasReservePrice: formData.hasReservePrice,
        auctionStartDate: formData.auctionStartDate,
        auctionStartTime: formData.auctionStartTime,
        auctionEndDate: formData.auctionEndDate,
        auctionEndTime: formData.auctionEndTime,
        // Vehicle specific
        ...(formData.itemType === "vehicle" && {
          vehicleCategory: formData.vehicleCategory,
          vehicleType: formData.vehicleType,
          vehicleMake: formData.vehicleMake,
          vehicleModel: formData.vehicleModel,
          vehicleYear: formData.vehicleYear,
          vehicleMileage: formData.vehicleMileage,
          vehicleCondition: formData.vehicleCondition,
          vehicleRegistrationNumber: formData.vehicleRegistrationNumber,
          vehicleRegistrationDocumentUrl:
            formData.vehicleRegistrationDocumentUrl,
          vehicleInsuranceDocumentUrl: formData.vehicleInsuranceDocumentUrl,
          // Additional car-specific fields
          ...(formData.vehicleCategory === "car" && {
            vehicleFuelType: formData.vehicleFuelType,
            vehicleTransmission: formData.vehicleTransmission,
            vehicleColor: formData.vehicleColor,
            vehicleSeats: formData.vehicleSeats,
            vehicleDoors: formData.vehicleDoors,
            vehicleVin: formData.vehicleVin,
            vehicleEngineNumber: formData.vehicleEngineNumber,
            vehicleChassisNumber: formData.vehicleChassisNumber,
          }),
        }),
        // Electronics specific
        ...(formData.itemType === "electronic" && {
          electronicsBrand: formData.electronicsBrand,
          electronicsModel: formData.electronicsModel,
          electronicsYear: formData.electronicsYear,
          electronicsCondition: formData.electronicsCondition,
          electronicsSerialNumber: formData.electronicsSerialNumber,
          electronicsHasWarranty: formData.electronicsHasWarranty,
          electronicsWarrantyPeriod: formData.electronicsWarrantyPeriod,
          electronicsWarrantyProvider: formData.electronicsWarrantyProvider,
          electronicsWarrantyDocumentUrl:
            formData.electronicsWarrantyDocumentUrl,
          electronicsIncludesAccessories:
            formData.electronicsIncludesAccessories,
          electronicsReceiptAvailable: formData.electronicsReceiptAvailable,
          electronicsManualAvailable: formData.electronicsManualAvailable,
          electronicsReceiptUrl: formData.electronicsReceiptUrl,
        }),
        // Images (uploaded URLs)
        images: formData.images,
      };

      // Attach status (draft or pending_review)
      // normalize 'pending' to 'pending_review' which admin API expects
      const normalizedStatus =
        submitStatus === "pending" ? "pending_review" : submitStatus;
      (auctionData as any).status = normalizedStatus;

      const result = await apiService.createAuction(auctionData);

      if (result.success) {
        setSubmitResult(result.data);
        setSuccessMessage(
          "Auction created successfully! Your item has been submitted for review."
        );

        // Reset form
        setFormData({
          itemType: "",
          title: "",
          description: "",
          location: "",
          startingPrice: "",
          reservePrice: "",
          hasReservePrice: false,
          auctionStartDate: "",
          auctionStartTime: "",
          auctionEndDate: "",
          auctionEndTime: "",
          vehicleType: "",
          vehicleCategory: "",
          vehicleMake: "",
          vehicleModel: "",
          vehicleYear: "",
          vehicleMileage: "",
          vehicleCondition: "",
          vehicleRegistrationNumber: "",
          vehicleRegistrationDocument: null,
          vehicleInsuranceDocument: null,
          vehicleRegistrationDocumentUrl: "",
          vehicleInsuranceDocumentUrl: "",
          vehicleFuelType: "",
          vehicleTransmission: "",
          vehicleColor: "",
          vehicleSeats: "",
          vehicleDoors: "",
          vehicleVin: "",
          vehicleEngineNumber: "",
          vehicleChassisNumber: "",
          electronicsBrand: "",
          electronicsModel: "",
          electronicsYear: "",
          electronicsCondition: "",
          electronicsSerialNumber: "",
          electronicsHasWarranty: false,
          electronicsWarrantyPeriod: "",
          electronicsWarrantyProvider: "",
          electronicsWarrantyDocument: null,
          electronicsWarrantyDocumentUrl: "",
          electronicsIncludesAccessories: "",
          electronicsReceiptAvailable: false,
          electronicsManualAvailable: false,
          electronicsReceiptDocument: null,
          electronicsReceiptUrl: "",
          images: [],
        });
        // If saved as draft, navigate to listings tab with draft filter
        if (normalizedStatus === "draft") {
          navigate("/dashboard/listings?status=draft");
        }
      } else {
        setErrors({
          submit: result.error || "Failed to create auction. Please try again.",
        });
      }
    } catch (error: any) {
      setErrors({
        submit: error.message || "Failed to create auction. Please try again.",
      });
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
              : "border-gray-200 hover:border-gray-300 text-muted-foreground"
          }`}
        >
          <Car className="w-8 h-8 mx-auto mb-2" />
          <div className="font-medium">Vehicle</div>
          <div className="text-sm opacity-75">
            Cars, Motorbikes, Trucks, SUVs, etc.
          </div>
        </button>
        <button
          type="button"
          onClick={() => handleInputChange("itemType", "electronic")}
          className={`p-6 border-2 rounded-lg text-center transition-all ${
            formData.itemType === "electronic"
              ? "border-primary bg-primary/5 text-primary"
              : "border-gray-200 hover:border-gray-300 text-muted-foreground"
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
      <h3 className="text-lg font-medium text-foreground flex items-center space-x-2">
        <Car className="w-5 h-5" />
        <span>Vehicle Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle Category *</label>
          <Select
            value={formData.vehicleCategory}
            onValueChange={(value) =>
              handleInputChange("vehicleCategory", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="motorbike">Motorbike</SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicleCategory && (
            <p className="text-red-500 text-sm">{errors.vehicleCategory}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Vehicle Type *</label>
          <Select
            value={formData.vehicleType}
            onValueChange={(value) => handleInputChange("vehicleType", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select vehicle type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              <SelectItem value="motorbike">Motorbike</SelectItem>
              <SelectItem value="truck">Truck</SelectItem>
              <SelectItem value="van">Van</SelectItem>
              <SelectItem value="suv">SUV</SelectItem>
              <SelectItem value="pickup">Pickup Truck</SelectItem>
              <SelectItem value="bus">Bus</SelectItem>
              <SelectItem value="trailer">Trailer</SelectItem>
            </SelectContent>
          </Select>
          {errors.vehicleType && (
            <p className="text-red-500 text-sm">{errors.vehicleType}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Make *</label>
          <Select
            value={formData.vehicleMake}
            onValueChange={(value) => handleInputChange("vehicleMake", value)}
          >
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
          {errors.vehicleMake && (
            <p className="text-red-500 text-sm">{errors.vehicleMake}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Model *</label>
          <Input
            placeholder="e.g., Axio, Vitz, Fielder"
            value={formData.vehicleModel}
            onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
            required
          />
          {errors.vehicleModel && (
            <p className="text-red-500 text-sm">{errors.vehicleModel}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <Select
            value={formData.vehicleYear}
            onValueChange={(value) => handleInputChange("vehicleYear", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 25 }, (_, i) => 2025 - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.vehicleYear && (
            <p className="text-red-500 text-sm">{errors.vehicleYear}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Mileage (KM) *</label>
          <Input
            type="number"
            placeholder="e.g., 45000"
            value={formData.vehicleMileage}
            onChange={(e) =>
              handleInputChange("vehicleMileage", e.target.value)
            }
            required
          />
          {errors.vehicleMileage && (
            <p className="text-red-500 text-sm">{errors.vehicleMileage}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition *</label>
          <Select
            value={formData.vehicleCondition}
            onValueChange={(value) =>
              handleInputChange("vehicleCondition", value)
            }
          >
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
          {errors.vehicleCondition && (
            <p className="text-red-500 text-sm">{errors.vehicleCondition}</p>
          )}
        </div>
      </div>

      {/* Registration Details */}
      <div className="space-y-4 border-t pt-6">
        <h4 className="text-md font-medium text-foreground">
          Registration & Documentation
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Registration Number *</label>
            <Input
              placeholder="e.g., KCB 123A"
              value={formData.vehicleRegistrationNumber}
              onChange={(e) =>
                handleInputChange("vehicleRegistrationNumber", e.target.value)
              }
              required
            />
            {errors.vehicleRegistrationNumber && (
              <p className="text-red-500 text-sm">
                {errors.vehicleRegistrationNumber}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Registration Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {formData.vehicleRegistrationDocument ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                      📄
                    </div>
                    <span className="text-sm text-gray-700">
                      {formData.vehicleRegistrationDocument.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("registration")}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentUpload(e, "registration")}
                    className="hidden"
                    id="registration-upload"
                  />
                  <label
                    htmlFor="registration-upload"
                    className="cursor-pointer"
                  >
                    <div className="text-gray-400 mb-1">📄</div>
                    <p className="text-xs text-gray-600">Click to upload</p>
                    <p className="text-xs text-gray-400">
                      PDF, JPG, PNG (max 5MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
            {errors.vehicleRegistrationDocument && (
              <p className="text-red-500 text-sm">
                {errors.vehicleRegistrationDocument}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Insurance Document *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {formData.vehicleInsuranceDocument ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                      🛡️
                    </div>
                    <span className="text-sm text-gray-700">
                      {formData.vehicleInsuranceDocument.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDocument("insurance")}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleDocumentUpload(e, "insurance")}
                    className="hidden"
                    id="insurance-upload"
                  />
                  <label htmlFor="insurance-upload" className="cursor-pointer">
                    <div className="text-gray-400 mb-1">🛡️</div>
                    <p className="text-xs text-gray-600">Click to upload</p>
                    <p className="text-xs text-gray-400">
                      PDF, JPG, PNG (max 5MB)
                    </p>
                  </label>
                </div>
              )}
            </div>
            {errors.vehicleInsuranceDocument && (
              <p className="text-red-500 text-sm">
                {errors.vehicleInsuranceDocument}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Car-specific Additional Details */}
      {formData.vehicleCategory === "car" && (
        <div className="space-y-4 border-t pt-6">
          <h4 className="text-md font-medium text-foreground">
            Car-Specific Details
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Fuel Type *</label>
              <Select
                value={formData.vehicleFuelType}
                onValueChange={(value) =>
                  handleInputChange("vehicleFuelType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petrol">Petrol</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electric">Electric</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicleFuelType && (
                <p className="text-red-500 text-sm">{errors.vehicleFuelType}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Transmission *</label>
              <Select
                value={formData.vehicleTransmission}
                onValueChange={(value) =>
                  handleInputChange("vehicleTransmission", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="automatic">Automatic</SelectItem>
                  <SelectItem value="cvt">CVT</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicleTransmission && (
                <p className="text-red-500 text-sm">
                  {errors.vehicleTransmission}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Color *</label>
              <Input
                placeholder="e.g., White, Black, Silver"
                value={formData.vehicleColor}
                onChange={(e) =>
                  handleInputChange("vehicleColor", e.target.value)
                }
                required
              />
              {errors.vehicleColor && (
                <p className="text-red-500 text-sm">{errors.vehicleColor}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Seats *</label>
              <Select
                value={formData.vehicleSeats}
                onValueChange={(value) =>
                  handleInputChange("vehicleSeats", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select seats" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Seats</SelectItem>
                  <SelectItem value="4">4 Seats</SelectItem>
                  <SelectItem value="5">5 Seats</SelectItem>
                  <SelectItem value="7">7 Seats</SelectItem>
                  <SelectItem value="8">8 Seats</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicleSeats && (
                <p className="text-red-500 text-sm">{errors.vehicleSeats}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Number of Doors *</label>
              <Select
                value={formData.vehicleDoors}
                onValueChange={(value) =>
                  handleInputChange("vehicleDoors", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select doors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Doors</SelectItem>
                  <SelectItem value="3">3 Doors</SelectItem>
                  <SelectItem value="4">4 Doors</SelectItem>
                  <SelectItem value="5">5 Doors</SelectItem>
                </SelectContent>
              </Select>
              {errors.vehicleDoors && (
                <p className="text-red-500 text-sm">{errors.vehicleDoors}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                VIN (Vehicle Identification Number) *
              </label>
              <Input
                placeholder="e.g., 1HGBH41JXMN109186"
                value={formData.vehicleVin}
                onChange={(e) =>
                  handleInputChange("vehicleVin", e.target.value)
                }
                required
              />
              {errors.vehicleVin && (
                <p className="text-red-500 text-sm">{errors.vehicleVin}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Engine Number *</label>
              <Input
                placeholder="e.g., 4A91234567"
                value={formData.vehicleEngineNumber}
                onChange={(e) =>
                  handleInputChange("vehicleEngineNumber", e.target.value)
                }
                required
              />
              {errors.vehicleEngineNumber && (
                <p className="text-red-500 text-sm">
                  {errors.vehicleEngineNumber}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Chassis Number *</label>
              <Input
                placeholder="e.g., JH4KA7561PC123456"
                value={formData.vehicleChassisNumber}
                onChange={(e) =>
                  handleInputChange("vehicleChassisNumber", e.target.value)
                }
                required
              />
              {errors.vehicleChassisNumber && (
                <p className="text-red-500 text-sm">
                  {errors.vehicleChassisNumber}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderElectronicsFields = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-foreground flex items-center space-x-2">
        <Smartphone className="w-5 h-5" />
        <span>Electronics Details</span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Brand *</label>
          <Select
            value={formData.electronicsBrand}
            onValueChange={(value) =>
              handleInputChange("electronicsBrand", value)
            }
          >
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
            onChange={(e) =>
              handleInputChange("electronicsModel", e.target.value)
            }
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Year *</label>
          <Select
            value={formData.electronicsYear}
            onValueChange={(value) =>
              handleInputChange("electronicsYear", value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => 2025 - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Condition *</label>
          <Select
            value={formData.electronicsCondition}
            onValueChange={(value) =>
              handleInputChange("electronicsCondition", value)
            }
          >
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

        {/* Serial Number */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Serial Number</label>
          <Input
            placeholder="e.g., SN123456789"
            value={formData.electronicsSerialNumber}
            onChange={(e) =>
              handleInputChange("electronicsSerialNumber", e.target.value)
            }
          />
        </div>
      </div>

      {/* Warranty Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-md font-medium text-foreground">
          Warranty Information
        </h4>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              type="radio"
              id="warranty-yes"
              name="warranty"
              checked={formData.electronicsHasWarranty === true}
              onChange={() => handleInputChange("electronicsHasWarranty", true)}
              className="h-4 w-4 text-blue-600"
            />
            <label htmlFor="warranty-yes" className="text-sm font-medium">
              Has Warranty
            </label>
            <input
              type="radio"
              id="warranty-no"
              name="warranty"
              checked={formData.electronicsHasWarranty === false}
              onChange={() =>
                handleInputChange("electronicsHasWarranty", false)
              }
              className="ml-4 h-4 w-4 text-blue-600"
            />
            <label htmlFor="warranty-no" className="text-sm font-medium">
              No Warranty
            </label>
          </div>

          {/* Conditional Warranty Fields */}
          {formData.electronicsHasWarranty && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-blue-200">
              <div className="space-y-2">
                <label className="text-sm font-medium">Warranty Period *</label>
                <Input
                  placeholder="e.g., 12 months, 2 years"
                  value={formData.electronicsWarrantyPeriod}
                  onChange={(e) =>
                    handleInputChange(
                      "electronicsWarrantyPeriod",
                      e.target.value
                    )
                  }
                  required
                />
                {errors.electronicsWarrantyPeriod && (
                  <p className="text-red-500 text-sm">
                    {errors.electronicsWarrantyPeriod}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Warranty Provider *
                </label>
                <Input
                  placeholder="e.g., Apple, Samsung, Local Shop"
                  value={formData.electronicsWarrantyProvider}
                  onChange={(e) =>
                    handleInputChange(
                      "electronicsWarrantyProvider",
                      e.target.value
                    )
                  }
                  required
                />
                {errors.electronicsWarrantyProvider && (
                  <p className="text-red-500 text-sm">
                    {errors.electronicsWarrantyProvider}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Warranty Document</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  {formData.electronicsWarrantyDocument ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          📄
                        </div>
                        <span className="text-sm text-gray-700">
                          {formData.electronicsWarrantyDocument.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeElectronicsDocument("warranty")}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleElectronicsDocumentUpload(e, "warranty")
                        }
                        className="hidden"
                        id="warranty-upload"
                      />
                      <label
                        htmlFor="warranty-upload"
                        className="cursor-pointer"
                      >
                        <div className="text-gray-400 mb-1">📄</div>
                        <p className="text-xs text-gray-600">
                          Click to upload warranty document
                        </p>
                        <p className="text-xs text-gray-400">
                          PDF, JPG, PNG (max 5MB)
                        </p>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional Information */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-md font-medium text-foreground">
          Additional Information
        </h4>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Includes Accessories</label>
            <textarea
              placeholder="e.g., Charger, Original Box, Headphones, Manual..."
              value={formData.electronicsIncludesAccessories}
              onChange={(e) =>
                handleInputChange(
                  "electronicsIncludesAccessories",
                  e.target.value
                )
              }
              className="w-full p-2 border border-gray-300 rounded-md min-h-[80px] resize-vertical"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="receipt-available"
                  checked={formData.electronicsReceiptAvailable}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "electronicsReceiptAvailable",
                      checked as boolean
                    )
                  }
                />
                <label
                  htmlFor="receipt-available"
                  className="text-sm font-medium"
                >
                  Receipt Available
                </label>
              </div>
              {formData.electronicsReceiptAvailable && (
                <div className="space-y-2 pl-6">
                  <label className="text-sm font-medium">Upload Receipt</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {formData.electronicsReceiptDocument ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                            🧾
                          </div>
                          <span className="text-sm text-gray-700">
                            {formData.electronicsReceiptDocument.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeElectronicsDocument("receipt")}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) =>
                            handleElectronicsDocumentUpload(e, "receipt")
                          }
                          className="hidden"
                          id="receipt-upload"
                        />
                        <label
                          htmlFor="receipt-upload"
                          className="cursor-pointer"
                        >
                          <div className="text-gray-400 mb-1">🧾</div>
                          <p className="text-xs text-gray-600">
                            Click to upload receipt
                          </p>
                          <p className="text-xs text-gray-400">
                            PDF, JPG, PNG (max 5MB)
                          </p>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manual-available"
                  checked={formData.electronicsManualAvailable}
                  onCheckedChange={(checked) =>
                    handleInputChange(
                      "electronicsManualAvailable",
                      checked as boolean
                    )
                  }
                />
                <label
                  htmlFor="manual-available"
                  className="text-sm font-medium"
                >
                  Manual Available
                </label>
              </div>
            </div>
          </div>
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
          <Alert className="border-green-500/20 bg-green-500/10 text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
              {submitResult && (
                <div className="mt-2 text-sm">
                  <p>
                    <strong>Auction ID:</strong> {submitResult.auction_id}
                  </p>
                  <p>
                    <strong>Status:</strong> {submitResult.status}
                  </p>
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
                <h3 className="text-lg font-medium text-gray-900">
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Item Title *</label>
                    <Input
                      placeholder={
                        formData.itemType === "vehicle"
                          ? "e.g., Toyota Axio 2016"
                          : "e.g., iPhone 14 Pro Max 256GB"
                      }
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange("title", e.target.value)
                      }
                      required
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm">{errors.title}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location *</label>
                    <Input
                      placeholder="e.g., Nairobi, Mombasa, Kisumu"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      required
                    />
                    {errors.location && (
                      <p className="text-red-500 text-sm">{errors.location}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Starting Price (Ksh) *
                    </label>
                    <Input
                      type="number"
                      placeholder="50000"
                      value={formData.startingPrice}
                      onChange={(e) =>
                        handleInputChange("startingPrice", e.target.value)
                      }
                      required
                    />
                    {errors.startingPrice && (
                      <p className="text-red-500 text-sm">
                        {errors.startingPrice}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasReservePrice"
                      checked={formData.hasReservePrice}
                      onCheckedChange={(checked) =>
                        handleInputChange("hasReservePrice", checked as boolean)
                      }
                    />
                    <label
                      htmlFor="hasReservePrice"
                      className="text-sm font-medium"
                    >
                      Set Reserve Price (Optional)
                    </label>
                  </div>
                  {formData.hasReservePrice && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Reserve Price (Ksh)
                      </label>
                      <Input
                        type="number"
                        placeholder="900000"
                        value={formData.reservePrice}
                        onChange={(e) =>
                          handleInputChange("reservePrice", e.target.value)
                        }
                      />
                      <p className="text-xs text-gray-500">
                        Reserve price is the minimum amount you're willing to
                        accept. It's hidden from bidders.
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
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
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
                    <h4 className="font-medium text-foreground">
                      Auction Start
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date *</label>
                        <Input
                          type="date"
                          value={formData.auctionStartDate}
                          onChange={(e) =>
                            handleInputChange(
                              "auctionStartDate",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time *</label>
                        <Input
                          type="time"
                          value={formData.auctionStartTime}
                          onChange={(e) =>
                            handleInputChange(
                              "auctionStartTime",
                              e.target.value
                            )
                          }
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Auction End</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Date *</label>
                        <Input
                          type="date"
                          value={formData.auctionEndDate}
                          onChange={(e) =>
                            handleInputChange("auctionEndDate", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time *</label>
                        <Input
                          type="time"
                          value={formData.auctionEndTime}
                          onChange={(e) =>
                            handleInputChange("auctionEndTime", e.target.value)
                          }
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
                <h3 className="text-lg font-medium text-foreground">Images</h3>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Upload Images *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG up to 5MB each (Max 8 images)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload">
                      <Button
                        variant="outline"
                        className="mt-4"
                        type="button"
                        asChild
                      >
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
                            src={
                              image.file
                                ? URL.createObjectURL(image.file)
                                : image.url
                            }
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
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSubmitting}
                  onClick={async (e) => {
                    setIsSubmitting(true);
                    await handleSubmit(e as any, "draft");
                  }}
                >
                  Save as Draft
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                  onClick={(e) => handleSubmit(e as any, "pending")}
                >
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
