import React, { useState } from "react";
import {
  MapPin,
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import useGetLocation from "../../../auth/getLocation";
import {
  registerUser,
  resendUserOtp,
  verifyUserOtp,
} from "../../../auth/ApiConnect";
import { useToast } from "../../../components/toast/ToastProvider";
import { getApiErrorMessage } from "../../../utils/apiError";

const MOBILE_REGEX = /^\+?[1-9]\d{9,14}$/;

function CustomerRegistration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    address: "",
    location: "Current location",
    serviceAreas: "",
    role: "user",
  });

  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();
  const { getGeolocation, isLoadingLocation, locationStatus } = useGetLocation(
    setFormData,
    setErrors
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (isOtpStep) {
      setIsOtpStep(false);
      setOtp("");
      setOtpSentTo("");
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);

    if (errors.otp) {
      setErrors({ ...errors, otp: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const normalizedMobile = formData.mobile.trim().replace(/\s+/g, "");

    if (!formData.name.trim()) newErrors.name = "Full name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required";
    if (formData.mobile.trim() && !MOBILE_REGEX.test(normalizedMobile)) {
      newErrors.mobile = "Enter a valid mobile number";
    }
    if (!formData.password) newErrors.password = "Password is required";
    if (formData.password && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    // if (!formData.address.trim()) newErrors.address = "Address is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      showToast({
        type: "error",
        title: "Please check the form",
        message: "Fill in all required fields before submitting.",
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        email: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim().replace(/\s+/g, ""),
      };

      const response = await registerUser(payload);
      showToast({
        type: "success",
        title: "OTP sent",
        message:
          response?.message ||
          "Registration started successfully. Please enter the OTP sent to your email.",
      });
      setOtp("");
      setOtpSentTo(formData.email.trim());
      setIsOtpStep(true);
    } catch (error) {
      console.error("Registration failed:", error);
      showToast({
        type: "error",
        title: "Registration failed",
        message: getApiErrorMessage(
          error,
          "Registration failed. Please try again."
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setErrors((prev) => ({ ...prev, otp: "OTP is required" }));
      showToast({
        type: "error",
        title: "OTP required",
        message: "Please enter the OTP sent to your email.",
      });
      return;
    }

    if (otp.trim().length !== 6) {
      setErrors((prev) => ({ ...prev, otp: "Enter the 6-digit OTP" }));
      showToast({
        type: "error",
        title: "Invalid OTP",
        message: "Please enter the complete 6-digit OTP.",
      });
      return;
    }

    setOtpLoading(true);

    try {
      const response = await verifyUserOtp({
        email: formData.email,
        otp,
      });

      showToast({
        type: "success",
        title: "Account verified",
        message:
          response?.message || "Your account has been created successfully.",
      });
      navigate("/login");
    } catch (error) {
      console.error("OTP verification failed:", error);
      showToast({
        type: "error",
        title: "OTP verification failed",
        message: getApiErrorMessage(
          error,
          "Unable to verify OTP. Please try again."
        ),
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);

    try {
      const response = await resendUserOtp({ email: formData.email });
      showToast({
        type: "success",
        title: "OTP resent",
        message: response?.message || "A new OTP has been sent to your email.",
      });
    } catch (error) {
      console.error("Resend OTP failed:", error);
      showToast({
        type: "error",
        title: "Unable to resend OTP",
        message: getApiErrorMessage(
          error,
          "Failed to resend OTP. Please try again."
        ),
      });
    } finally {
      setResendingOtp(false);
    }
  };

  const handleEditDetails = () => {
    setIsOtpStep(false);
    setOtp("");
    setOtpSentTo("");
    setErrors((prev) => ({ ...prev, otp: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isOtpStep) {
      await handleVerifyOtp();
      return;
    }

    await handleRegister();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Full Name
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isOtpStep}
              className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
              placeholder="Enter your full name"
            />
          </div>
          {errors.name && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.name}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={isOtpStep}
              className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
              placeholder="your.email@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.email}
            </p>
          )}
        </div>

        {/* Mobile */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Mobile Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Phone className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
            </div>
            <input
              type="tel"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              inputMode="numeric"
              autoComplete="tel"
              disabled={isOtpStep}
              className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
              placeholder="9876543210"
            />
          </div>
          {errors.mobile && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.mobile}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isOtpStep}
              className="block w-full pl-12 pr-12 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isOtpStep}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200"
            >
              {showPassword ? (
                <EyeOff className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
              ) : (
                <Eye className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.password}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Confirm Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isOtpStep}
              className="block w-full pl-12 pr-12 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              disabled={isOtpStep}
              className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors duration-200"
            >
              {showConfirmPassword ? (
                <EyeOff className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
              ) : (
                <Eye className="text-gray-400 hover:text-purple-500 w-5 h-5 transition-colors duration-200" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.confirmPassword}
            </p>
          )}
        </div>

        <div className="group">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Address / Service Area
          </label>
          <div className="flex  items-center ">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MapPin className="text-gray-400 group-focus-within:text-purple-500 w-5 h-5 transition-colors duration-200" />
              </div>
              <input
                type="text"
                name="serviceAreas"
                value={formData.serviceAreas}
                onChange={handleChange}
                disabled={isOtpStep}
                className="block w-full pl-12 pr-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-gray-50/50 focus:bg-white group-hover:border-purple-300"
                placeholder="Enter your address"
              />
            </div>
            {errors.serviceAreas && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.serviceAreas}
              </p>
            )}
            <button
              type="button"
              onClick={getGeolocation}
              disabled={isLoadingLocation || isOtpStep}
              className="ml-2 p-2 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 flex items-center justify-center"
            >
              {isLoadingLocation ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <MapPin size={20} />
              )}
            </button>
          </div>
          {locationStatus && (
            <p className="mt-2 text-sm text-gray-600 flex items-center">
              {locationStatus.includes("success") ? (
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 mr-1 text-yellow-600" />
              )}
              {locationStatus}
            </p>
          )}
        </div>
      </div>

      {isOtpStep && (
        <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-900">
                Verify your email to complete registration
              </p>
              <p className="text-sm text-purple-700">
                We sent a 6-digit OTP to {otpSentTo || formData.email}.
              </p>
            </div>
          </div>

          <div className="group">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Enter OTP
            </label>
            <input
              type="text"
              name="otp"
              value={otp}
              onChange={handleOtpChange}
              maxLength={6}
              className="block w-full px-4 py-4 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all duration-200 bg-white tracking-[0.4em] text-center text-lg font-semibold"
              placeholder="000000"
            />
            {errors.otp && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.otp}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleEditDetails}
              disabled={otpLoading}
              className="text-sm font-semibold text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit details
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendingOtp || otpLoading}
              className="text-sm font-semibold text-purple-700 hover:text-purple-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendingOtp ? "Resending OTP..." : "Resend OTP"}
            </button>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || otpLoading}
          className="group relative w-full flex justify-center items-center py-4 px-6 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
        >
          {loading || otpLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-3"></div>
              {isOtpStep ? "Verifying OTP..." : "Sending OTP..."}
            </>
          ) : (
            <>
              <UserPlus className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
              {isOtpStep ? "Verify OTP & Create Account" : "Register & Send OTP"}
              <CheckCircle className="w-5 h-5 ml-3 group-hover:scale-110 transition-transform duration-300" />
            </>
          )}
        </button>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <p className="text-gray-600">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="font-semibold text-purple-600 hover:text-purple-500 transition-colors duration-200"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}
export default CustomerRegistration;
