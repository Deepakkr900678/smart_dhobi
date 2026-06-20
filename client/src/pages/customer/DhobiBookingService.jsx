import React, { useState, useEffect } from "react";
import DhobiInfo from "../../components/customerComponent/DhobiInfo";
import ServiceSelector from "../../components/customerComponent/ServiceSelector";
import OrderSummary from "../../components/customerComponent/OrderSummary";
import {
  fetchDhobiById,
  saveOrder,
  createRazorpayOrder,
  verifyPaymentSuccess,
} from "../../auth/ApiConnect";
import AddressForm from "../../components/customerComponent/AddressForm";
import { useNavigate } from "react-router-dom";
import { getCustomerServicePrice, normalizePrice } from "../../utils/pricing";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

const loadRazorpaySdk = () =>
  new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve(window.Razorpay);
      return;
    }
    const existing = document.querySelector(
      `script[src="${RAZORPAY_SCRIPT_URL}"]`
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Razorpay), {
        once: true,
      });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay SDK")),
        { once: true }
      );
      return;
    }
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });

export default function DhobiBookingService() {
  const [dhobi, setDhobi] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedServices, setSelectedServices] = useState({});
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);
  const [formData, setFormData] = useState({
    pickupAddress: "",
    deliveryAddress: "",
    pickupLocation: null,
    deliveryLocation: null,
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const loadDhobiData = async () => {
      try {
        const pathParts = window.location.pathname.split("/");
        const dhobiId = pathParts[pathParts.length - 1] || "675e123456789";
        const dhobiData = await fetchDhobiById(dhobiId);
        setDhobi(dhobiData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadDhobiData();
  }, []);

  const handleServiceQuantityChange = (serviceId, quantity) => {
    setSelectedServices((prev) => {
      const updated = { ...prev };
      if (quantity <= 0) delete updated[serviceId];
      else updated[serviceId] = quantity;
      return updated;
    });
  };

  const resetForm = () => {
    setSelectedServices({});
    setPickupAddress("");
    setDeliveryAddress("");
    setPickupTime("");
    setDeliveryTime("");
    setFormData({
      pickupAddress: "",
      deliveryAddress: "",
      pickupLocation: null,
      deliveryLocation: null,
    });
    setErrors({});
  };

  // ── Called after Razorpay payment success ──────────────────────────────────
  const handlePaymentSuccess = async (razorpayResponse, savedOrderId) => {
    try {
      const verifyResult = await verifyPaymentSuccess(
        { orderId: savedOrderId },
        razorpayResponse
      );

      if (!verifyResult.success) {
        alert("Payment verification failed. Please contact support.");
        return;
      }

      alert(`🎉 Order placed successfully! Order ID: ${savedOrderId}`);
      resetForm();
      navigate("/customer/orders");
    } catch (err) {
      console.error("Payment verification failed:", err);
      alert(
        "Payment was received but verification failed. Please contact support with Order ID: " +
          savedOrderId
      );
    } finally {
      setIsBooking(false);
    }
  };
  // ── Main booking handler — opens Razorpay first ────────────────────────────
  const handleBookService = async (total) => {
    if (!pickupAddress.trim() || !deliveryAddress.trim()) {
      alert("Please fill in both pickup and delivery addresses");
      return;
    }
    if (Object.keys(selectedServices).length === 0) {
      alert("Please select at least one service");
      return;
    }

    const userData = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null;
    const userId = userData?._id;

    if (!userId) {
      alert("Please login to book a service");
      return;
    }

    setIsBooking(true);

    try {
      const servicesArray = Object.entries(selectedServices).map(
        ([serviceId, quantity]) => {
          const service = dhobi.services.find((s) => s._id === serviceId);
          const dealerPrice = normalizePrice(service?.price);
          const customerPrice = getCustomerServicePrice(service, dhobi);

          return {
            name: service.name,
            quantity,
            price: customerPrice,
            customerPrice,
            dealerPrice,
          };
        }
      );

      const orderPayload = {
        userId,
        providerId: dhobi._id,
        services: servicesArray,
        pickupAddress: pickupAddress.trim(),
        deliveryAddress: deliveryAddress.trim(),
        ...(pickupTime
          ? {
              pickupTime: new Date(
                `${new Date().toDateString()} ${pickupTime}`
              ).toISOString(),
            }
          : {}),
        ...(deliveryTime
          ? {
              deliveryTime: new Date(
                `${new Date().toDateString()} ${deliveryTime}`
              ).toISOString(),
            }
          : {}),
        amount: total,
        status: "pending",
        paymentStatus: "pending",
        ...(formData.pickupLocation && {
          pickupLocation: formData.pickupLocation,
        }),
        ...(formData.deliveryLocation && {
          deliveryLocation: formData.deliveryLocation,
        }),
      };

      // ── Step 1: Save order first so backend can find it ──────────────────
      const savedOrder = await saveOrder(orderPayload);
      const savedOrderId = savedOrder?.orderId;

      if (!savedOrderId)
        throw new Error("Order creation failed, no orderId returned");

      // ── Step 2: Load Razorpay SDK ─────────────────────────────────────────
      await loadRazorpaySdk();
      if (!window.Razorpay) throw new Error("Razorpay SDK unavailable");

      // ── Step 3: Create Razorpay order (backend finds order by orderId) ────
      const { razorpayOrderId, key, amount, currency } =
        await createRazorpayOrder({
          orderId: savedOrderId,
          amount: total,
        });

      // ── Step 4: Open Razorpay modal ───────────────────────────────────────
      const options = {
        key,
        amount,
        currency: currency || "INR",
        name: "SmartDhobi",
        description: `Payment for Order #${savedOrderId}`,
        order_id: razorpayOrderId,
        handler: function (razorpayResponse) {
          handlePaymentSuccess(razorpayResponse, savedOrderId);
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
          contact: userData?.mobile || "",
        },
        notes: { orderId: savedOrderId },
        theme: { color: "#4F46E5" },
        modal: {
          ondismiss: function () {
            // Order saved but unpaid — user can pay later from orders page
            setIsBooking(false);
            alert(
              "Payment cancelled. Your order is saved, you can pay later from My Orders."
            );
            navigate("/customer/orders");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("Booking failed:", err);
      setIsBooking(false);
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to initiate payment. Please try again."
      );
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading details…</p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 text-white text-sm px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );

  if (!dhobi)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-sm text-gray-500">Dhobi not found</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <DhobiInfo dhobi={dhobi} />

        <ServiceSelector
          services={dhobi.services}
          selectedServices={selectedServices}
          onServiceQuantityChange={handleServiceQuantityChange}
          provider={dhobi}
        />

        {Object.keys(selectedServices).length > 0 && (
          <AddressForm
            pickupAddress={pickupAddress}
            setPickupAddress={setPickupAddress}
            deliveryAddress={deliveryAddress}
            setDeliveryAddress={setDeliveryAddress}
            pickupTime={pickupTime}
            setPickupTime={setPickupTime}
            deliveryTime={deliveryTime}
            setDeliveryTime={setDeliveryTime}
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />
        )}

        <OrderSummary
          selectedServices={selectedServices}
          services={dhobi.services}
          pickupAddress={pickupAddress}
          deliveryAddress={deliveryAddress}
          onBookService={handleBookService}
          isBooking={isBooking}
          provider={dhobi}
        />
      </div>
    </div>
  );
}
