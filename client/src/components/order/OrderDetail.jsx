import React, { useState } from "react";
import {
  ArrowLeft,
  Clock,
  Package,
  MapPin,
  User,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
  Calendar,
  Truck,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { createRazorpayOrder } from "../../auth/ApiConnect";
import { verifyPaymentSuccess } from "../../auth/ApiConnect";
import { getOrderCustomerServicePrice } from "../../utils/pricing";

const RAZORPAY_SCRIPT_URL =
  import.meta.env.VITE_APP_RAZORPAY_SCRIPT_URL ||
  "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpaySdk = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }

    const existingScript = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.Razorpay), {
        once: true,
      });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay checkout SDK.")),
        { once: true }
      );
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay checkout SDK."));
    document.body.appendChild(script);
  });

const OrderDetail = ({ order, onBack }) => {
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const displayAmount =
    order?.amount ??
    order?.services?.reduce(
      (sum, service) =>
        sum + getOrderCustomerServicePrice(service) * service.quantity,
      0
    ) ??
    0;

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-blue-100 text-blue-800 border-blue-200",
      in_progress: "bg-purple-100 text-purple-800 border-purple-200",
      ready: "bg-green-100 text-green-800 border-green-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      accepted: <CheckCircle className="w-4 h-4" />,
      in_progress: <Package className="w-4 h-4" />,
      ready: <CheckCircle className="w-4 h-4" />,
      delivered: <Truck className="w-4 h-4" />,
      cancelled: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || <AlertCircle className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePayment = async () => {
     console.log("order object:", order);
  console.log("orderId being sent:", order.orderId);
  console.log("token:", localStorage.getItem("token"));
  console.log("role:", localStorage.getItem("role"));
    setIsPaymentProcessing(true);
    try {
      await loadRazorpaySdk();

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK is unavailable.");
      }

      const { razorpayOrderId, key, amount, currency, order: paymentOrder } =
        await createRazorpayOrder(order);

      const options = {
        key,
        amount,
        currency: currency || "INR",
        name: "SmartDhobi",
        description: `Payment for Order #${order.orderId}`,
        order_id: razorpayOrderId,
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name:
            order.userId?.name || paymentOrder?.customerName || order.customerName || "",
          email:
            order.userId?.email ||
            paymentOrder?.customerEmail ||
            order.customerEmail ||
            "",
          contact:
            order.userId?.mobile ||
            paymentOrder?.customerContact ||
            order.customerContact ||
            "",
        },
        notes: {
          orderId: order.orderId,
        },
        theme: {
          color: "#3B82F6",
        },
        modal: {
          ondismiss: function () {
            setIsPaymentProcessing(false);
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment initialization failed:", error);
      setIsPaymentProcessing(false);
      alert(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to initialize payment. Please try again."
      );
    }
  };

  const handlePaymentSuccess = async (response) => {
    try {
      // Use the verifyPaymentSuccess function from ./apiconnect
      const result = await verifyPaymentSuccess(order, response);

      if (result.success) {
        alert("Payment successful!");
        // Optionally refresh the order data or redirect
        window.location.reload();
      } else {
        alert("Payment verification failed. Please contact support.");
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      alert("Payment verification failed. Please contact support.");
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Order Details
              </h1>
              <p className="text-sm text-gray-600">#{order.orderId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full mx-auto px-4 py-6 space-y-6">
        {/* Order Status */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Order Status
          </h2>
          <div className="flex items-center justify-between">
            <div
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              <span className="ml-2 capitalize">
                {order.status.replace("_", " ")}
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Updated</p>
              <p className="font-medium">{formatDate(order.updatedAt)}</p>
            </div>
          </div>
        </div>

        {/* Service Provider Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Service Provider
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-800">
                {order.providerId.name}
              </h3>
              <p className="text-gray-600">Owner: {order.providerId.owner}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>{order.providerId.mobile}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>{order.providerId.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Services
          </h2>
          <div className="space-y-3">
            {order.services.map((service, index) => {
              const customerPrice = getOrderCustomerServicePrice(service);

              return (
                <div
                  key={index}
                  className="flex justify-between items-center py-2 border-b last:border-b-0"
                >
                  <div>
                    <span className="font-medium capitalize">{service.name}</span>
                    <span className="text-gray-500 ml-2">
                      x {service.quantity}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ₹{customerPrice * service.quantity}
                    </div>
                    <div className="text-sm text-gray-500">
                      ₹{customerPrice} each
                    </div>
                  </div>
                </div>
              );
            })}
            <div className="flex justify-between items-center pt-3 border-t font-semibold text-lg">
              <span>Total Amount</span>
              <span className="text-green-600">₹{displayAmount}</span>
            </div>
          </div>
        </div>

        {/* Addresses */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Addresses
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Pickup Address</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {order.pickupAddress}
              </p>
              {order.pickupTime && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Preferred time: {order.pickupTime}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">
                Delivery Address
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {order.deliveryAddress}
              </p>
              {order.deliveryTime && (
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>Preferred time: {order.deliveryTime}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment & Order Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Payment Status
            </h2>
            <div
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(
                order.paymentStatus
              )}`}
            >
              <span className="capitalize">{order.paymentStatus}</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-4">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium">₹{order.amount}</span>
              </div>

              {/* Proceed to Payment Button */}
              {order.paymentStatus === "pending" && (
                <button
                  onClick={handlePayment}
                  disabled={isPaymentProcessing}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                    isPaymentProcessing
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isPaymentProcessing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Proceed to Payment"
                  )}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Order Timeline
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Placed</span>
                <span className="font-medium">
                  {formatDate(order.createdAt)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Updated</span>
                <span className="font-medium">
                  {formatDate(order.updatedAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
