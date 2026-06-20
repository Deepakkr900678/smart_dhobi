import React, { useState } from "react";
import {
  MapPin,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Loader,
  Sparkles,
  Shield,
  Star,
} from "lucide-react";
import useGetLocation from "../../../auth/getLocation";
import ProgressIndicator from "../../../components/basicComponent/ProgressIndicator";
import ServiceManagement from "../../../components/basicComponent/ServiceManagement";
import FormInput from "../../../components/basicComponent/FormInput";
import FormTextarea from "../../../components/basicComponent/FormTextArea";
import logo from "../../../assets/logo.png"; // Assuming same logo path
import { registreDhobi } from "../../../auth/ApiConnect";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../components/Navbar";
import { useToast } from "../../../components/toast/ToastProvider";
import { getApiErrorMessage } from "../../../utils/apiError";

function DhobiRegistration() {
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    owner: "",
    email: "",
    mobile: "",
    address: "",
    serviceAreas: "",
    location: {
      type: "Point",
      coordinates: [],
    },
    password: "",

    // Business Information
    commissionRate: 15,
    services: [{ name: "", price: "" }],

    // Additional fields
    joinDate: new Date().toISOString().split("T")[0],
    images: [],
    bankDetails: {
      accountHolderName: "",
      accountNumber: "",
      confirmAccountNumber: "",
      ifscCode: "",
      bankName: "",
      branchName: "",
      accountType: "savings",
    },
  });

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { getGeolocation, isLoadingLocation, locationStatus } = useGetLocation(
    setFormData,
    setErrors
  );

  const stepLabels = [
    "Basic Info",
    "Location",
    "Services",
    "Bank Details",
    "Review",
  ];

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };
  const handleBankChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      bankDetails: { ...prev.bankDetails, [name]: value },
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (stepNumber) => {
    const newErrors = {};

    switch (stepNumber) {
      case 1:
        if (!formData.name.trim()) newErrors.name = "Business name is required";
        if (!formData.owner.trim()) newErrors.owner = "Owner name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.mobile) newErrors.mobile = "mobile number is required";
        if (!formData.address.trim()) newErrors.address = "Address is required";
        break;

      case 2:
        if (!formData.serviceAreas.trim())
          newErrors.serviceAreas = "Service area is required";
        if (!formData.location.coordinates.length)
          newErrors.location = "Location coordinates are required";
        break;

      case 3:
        if (
          !formData.services.length ||
          formData.services.some((s) => !s.name.trim() || !s.price.trim())
        ) {
          newErrors.services = "At least one complete service is required";
        }
        if (formData.commissionRate < 0 || formData.commissionRate > 100) {
          newErrors.commissionRate =
            "Commission rate must be between 0 and 100";
        }
        break;

      case 4:
        if (!formData.bankDetails.accountHolderName.trim())
          newErrors.accountHolderName = "Account holder name is required";
        if (!formData.bankDetails.accountNumber.trim())
          newErrors.accountNumber = "Account number is required";
        if (!formData.bankDetails.confirmAccountNumber.trim())
          newErrors.confirmAccountNumber = "Please confirm account number";
        if (
          formData.bankDetails.accountNumber !==
          formData.bankDetails.confirmAccountNumber
        )
          newErrors.confirmAccountNumber = "Account numbers do not match";
        if (!formData.bankDetails.ifscCode.trim())
          newErrors.ifscCode = "IFSC code is required";
        if (
          !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(
            formData.bankDetails.ifscCode.toUpperCase()
          )
        )
          newErrors.ifscCode = "Enter a valid IFSC code (e.g. SBIN0001234)";
        if (!formData.bankDetails.bankName.trim())
          newErrors.bankName = "Bank name is required";
        if (!formData.bankDetails.branchName.trim())
          newErrors.branchName = "Branch name is required";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(5)) {
      showToast({
        type: "error",
        title: "Review required",
        message:
          "Please complete the required registration details before submitting.",
      });
      return;
    }

    // Create pricing map from services
    const pricing = {};
    formData.services.forEach((service) => {
      const price = service.price.replace(/[^0-9.]/g, ""); // Extract numeric value
      pricing[service.name.toLowerCase()] = parseFloat(price) || 0;
    });

    const finalData = {
      ...formData,
      pricing,
      isApproved: "pending",
      isActive: true,
      rating: 0,
      ordersCompleted: 0,
      earnings: "0",
    };

    try {
      const response = await registreDhobi(finalData);
      console.log(response, "afssad");
      showToast({
        type: "success",
        title: "Registration submitted",
        message:
          response?.data?.message ||
          "Your dhobi registration has been submitted successfully.",
      });
      if (response.data) {
        setStep(6);
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Registration failed",
        message: getApiErrorMessage(
          error,
          "Unable to submit registration. Please try again."
        ),
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
        {/* Background Animation */}

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-32 h-32 bg-purple-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-24 h-24 bg-pink-200 rounded-full opacity-20 animate-bounce"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-yellow-200 rounded-full opacity-20 animate-ping"></div>
          <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Header Section with Logo */}
          <div className="bg-white/80  rounded-3xl shadow-2xl border border-purple-100 overflow-hidden">
            <div className="flex items-center justify-center ">
              <div className="relative flex flex-row items-center justify-center bg-white/90  border border-purple-100 px-6 w-full  mx-auto gap-4">
                {/* <div className="relative flex items-center justify-center">
              <img
                src={logo}
                alt="Smart Dhobi Logo"
                className="w-24 h-24  transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer drop-shadow-lg"
              />
             
            </div> */}
                <div className="flex items-center gap-2 p-4">
                  <Sparkles className="w-4 h-4 text-purple-500 animate-pulse" />
                  <h1 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 drop-shadow-lg">
                    Dhobi Registration
                  </h1>
                  <Sparkles className="w-4 h-4 text-pink-500 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="p-8">
              <ProgressIndicator
                currentStep={step}
                totalSteps={4}
                stepLabels={stepLabels}
              />

              {/* Step 1: Basic Information */}
              {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Basic Information
                    </h2>
                    <p className="text-gray-600">
                      Tell us about your laundry business
                    </p>
                  </div>

                  <div className="space-y-6">
                    <FormInput
                      label="Business Name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      error={errors.name}
                      placeholder="e.g., Clean & Fresh Laundry"
                    />

                    <FormInput
                      label="Owner Name"
                      name="owner"
                      value={formData.owner}
                      onChange={handleChange}
                      required
                      error={errors.owner}
                      placeholder="Full name of the business owner"
                    />

                    <FormInput
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      error={errors.email}
                      placeholder="your@email.com"
                    />

                    <FormInput
                      label="mobile Number"
                      name="mobile"
                      type="number"
                      value={formData.mobile}
                      onChange={handleChange}
                      required
                      error={errors.mobile}
                      placeholder="10-digit mobile number"
                    />
                    <FormInput
                      label="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      error={errors.password}
                      placeholder="*******"
                    />

                    <FormTextarea
                      label="Business Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      error={errors.address}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end mt-8">
                    <button
                      onClick={nextStep}
                      className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      Next Step
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Location */}
              {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Location & Service Area
                    </h2>
                    <p className="text-gray-600">
                      Define your service coverage area
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Service Areas <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="text"
                          name="serviceAreas"
                          value={formData.serviceAreas}
                          onChange={handleChange}
                          placeholder="Your service coverage area"
                          className={`flex-1 px-4 py-4 border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50 focus:bg-white ${
                            errors.serviceAreas
                              ? "border-red-500"
                              : "border-gray-200 hover:border-purple-300"
                          }`}
                          required
                        />
                        <button
                          type="button"
                          onClick={getGeolocation}
                          disabled={isLoadingLocation}
                          className="bg-gradient-to-r from-purple-100 to-pink-100 hover:from-purple-200 hover:to-pink-200 px-6 py-4 rounded-xl border border-purple-200 transition-all duration-300 disabled:opacity-50 group"
                        >
                          {isLoadingLocation ? (
                            <Loader className="w-5 h-5 animate-spin text-purple-600" />
                          ) : (
                            <MapPin className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                          )}
                        </button>
                      </div>
                      {locationStatus && (
                        <p
                          className={`mt-3 text-sm font-medium ${
                            locationStatus.includes("success")
                              ? "text-green-600"
                              : "text-blue-600"
                          }`}
                        >
                          {locationStatus}
                        </p>
                      )}
                      {errors.serviceAreas && (
                        <p className="mt-2 text-sm text-red-600 font-medium">
                          {errors.serviceAreas}
                        </p>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-blue-900 font-semibold mb-1">
                            Privacy & Security
                          </p>
                          <p className="text-sm text-blue-800">
                            We use your location to connect you with nearby
                            customers. Your exact location is kept private and
                            only used for service matching.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      Next Step
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Services */}
              {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Services & Pricing
                    </h2>
                    <p className="text-gray-600">
                      Set up your service offerings and rates
                    </p>
                  </div>

                  <div className="space-y-6">
                    <ServiceManagement
                      services={formData.services}
                      onChange={handleChange}
                      error={errors.services}
                    />

                    {/* <FormInput
                            label="Commission Rate (%)"
                            name="commissionRate"
                            type="number"
                            value={formData.commissionRate}
                            onChange={handleChange}
                            required
                            error={errors.commissionRate}
                            placeholder="Platform commission percentage (0-100)"
                            /> */}

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Star className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-yellow-900 font-semibold mb-1">
                            Commission Information
                          </p>
                          <p className="text-sm text-yellow-800">
                            There is no fixed standard commission. Rates vary
                            based on your location and the specific services you
                            offer. You may set a preferred rate and our team
                            will confirm or adjust it based on local market and
                            service mix.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      Next Step
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}
              {/* Step 4: Bank Details */}
              {step === 4 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Bank Details
                    </h2>
                    <p className="text-gray-600">
                      Enter your bank account details for payments
                    </p>
                  </div>

                  <div className="space-y-6">
                    {/* Account Holder Name */}
                    <FormInput
                      label="Account Holder Name"
                      name="accountHolderName"
                      value={formData.bankDetails.accountHolderName}
                      onChange={handleBankChange}
                      required
                      error={errors.accountHolderName}
                      placeholder="Name as on bank account"
                    />

                    {/* Bank Name */}
                    <FormInput
                      label="Bank Name"
                      name="bankName"
                      value={formData.bankDetails.bankName}
                      onChange={handleBankChange}
                      required
                      error={errors.bankName}
                      placeholder="e.g., State Bank of India"
                    />

                    {/* Account Number */}
                    <FormInput
                      label="Account Number"
                      name="accountNumber"
                      type="password"
                      value={formData.bankDetails.accountNumber}
                      onChange={handleBankChange}
                      required
                      error={errors.accountNumber}
                      placeholder="Enter account number"
                    />

                    {/* Confirm Account Number */}
                    <FormInput
                      label="Confirm Account Number"
                      name="confirmAccountNumber"
                      type="text"
                      value={formData.bankDetails.confirmAccountNumber}
                      onChange={handleBankChange}
                      required
                      error={errors.confirmAccountNumber}
                      placeholder="Re-enter account number"
                    />

                    {/* IFSC Code */}
                    <FormInput
                      label="IFSC Code"
                      name="ifscCode"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => {
                        e.target.value = e.target.value.toUpperCase();
                        handleBankChange(e);
                      }}
                      required
                      error={errors.ifscCode}
                      placeholder="e.g., SBIN0001234"
                    />

                    {/* Branch Name */}
                    <FormInput
                      label="Branch Name"
                      name="branchName"
                      value={formData.bankDetails.branchName}
                      onChange={handleBankChange}
                      required
                      error={errors.branchName}
                      placeholder="e.g., Indore Main Branch"
                    />

                    {/* Account Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Account Type <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-4">
                        {["savings", "current"].map((type) => (
                          <label
                            key={type}
                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 cursor-pointer transition-all duration-200 capitalize font-medium ${
                              formData.bankDetails.accountType === type
                                ? "border-purple-500 bg-purple-50 text-purple-700"
                                : "border-gray-200 bg-gray-50 text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="accountType"
                              value={type}
                              checked={
                                formData.bankDetails.accountType === type
                              }
                              onChange={handleBankChange}
                              className="hidden"
                            />
                            {type === "savings" ? "🏦 Savings" : "🏢 Current"}
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Security Note */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl border border-blue-200">
                      <div className="flex items-start gap-3">
                        <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                        <div>
                          <p className="text-blue-900 font-semibold mb-1">
                            Your Data is Safe
                          </p>
                          <p className="text-sm text-blue-800">
                            Bank details are encrypted and stored securely. They
                            are only used for processing your service payments
                            and are never shared with third parties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      Review Details
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              )}
              {/* Step 4: Review */}
              {step === 5 && (
                <div className="animate-in fade-in slide-in-from-right-5 duration-500">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      Review Your Information
                    </h2>
                    <p className="text-gray-600">
                      Please verify all details before submitting
                    </p>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div className="bg-gradient-to-r from-gray-50 to-purple-50 p-6 rounded-2xl border border-gray-200">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            1
                          </span>
                        </div>
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p>
                          <strong>Business:</strong> {formData.name}
                        </p>
                        <p>
                          <strong>Owner:</strong> {formData.owner}
                        </p>
                        <p>
                          <strong>Email:</strong> {formData.email}
                        </p>
                        <p>
                          <strong>mobile:</strong> {formData.mobile}
                        </p>
                        <p>
                          <strong>Password:</strong> {formData.password}
                        </p>

                        <p className="md:col-span-2">
                          <strong>Address:</strong> {formData.address}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-2xl border border-gray-200">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            2
                          </span>
                        </div>
                        Location Details
                      </h3>
                      <div className="text-sm space-y-2">
                        <p>
                          <strong>Service Areas:</strong>{" "}
                          {formData.serviceAreas}
                        </p>
                        <p>
                          <strong>Coordinates:</strong>{" "}
                          {formData.location.coordinates.join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-green-50 p-6 rounded-2xl border border-gray-200">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            3
                          </span>
                        </div>
                        Services & Pricing
                      </h3>
                      <div className="text-sm space-y-2">
                        {formData.services.map((service, index) => (
                          <p key={index}>
                            <strong>{service.name}:</strong> {service.price}
                          </p>
                        ))}
                        {/* <p className="pt-2 border-t border-gray-200">
                        <strong>Commission Rate:</strong>{" "}
                        {formData.commissionRate}%
                      </p> */}
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-yellow-50 p-6 rounded-2xl border border-gray-200">
                      <h3 className="font-bold text-lg mb-4 text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            4
                          </span>
                        </div>
                        Bank Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <p>
                          <strong>Account Holder:</strong>{" "}
                          {formData.bankDetails.accountHolderName}
                        </p>
                        <p>
                          <strong>Bank Name:</strong>{" "}
                          {formData.bankDetails.bankName}
                        </p>
                        <p>
                          <strong>Account Number:</strong>{" "}
                          {"•".repeat(
                            formData.bankDetails.accountNumber.length - 4
                          ) + formData.bankDetails.accountNumber.slice(-4)}
                        </p>
                        <p>
                          <strong>IFSC Code:</strong>{" "}
                          {formData.bankDetails.ifscCode}
                        </p>
                        <p>
                          <strong>Branch:</strong>{" "}
                          {formData.bankDetails.branchName}
                        </p>
                        <p>
                          <strong>Account Type:</strong>{" "}
                          <span className="capitalize">
                            {formData.bankDetails.accountType}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={prevStep}
                      className="group bg-gray-100 hover:bg-gray-200 text-gray-700 px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300"
                    >
                      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="group bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold flex items-center gap-3 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                      Submit Registration
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Success */}
              {step === 6 && (
                <div className="text-center py-12 animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                    <CheckCircle className="w-12 h-12 text-green-600 animate-bounce" />
                    <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
                  </div>

                  <div className="flex items-center justify-center gap-2 mb-4">
                    <Sparkles className="w-6 h-6 text-green-500 animate-pulse" />
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent">
                      Registration Successful!
                    </h3>
                    <Sparkles className="w-6 h-6 text-emerald-500 animate-pulse" />
                  </div>

                  <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
                    Your dhobi registration has been submitted successfully. Our
                    team will review your application and get back to you within
                    24-48 hours.
                  </p>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
                    <div className="flex items-start gap-3 text-left">
                      <Star className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-900 font-bold mb-2">
                          What's Next?
                        </p>
                        <ul className="text-yellow-800 text-sm space-y-1">
                          <li>• Your account is pending approval</li>
                          <li>
                            • You'll receive an email notification once approved
                          </li>
                          <li>
                            • Start receiving orders once your account is active
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/login")}
                    className="group bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center gap-3 mx-auto"
                  >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                    Go To Login
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200 shadow-lg">
              <Shield className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-sm text-gray-600 font-semibold">
                Secure Registration Process
              </span>
              <Sparkles className="w-4 h-4 text-purple-500 ml-3 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default DhobiRegistration;
