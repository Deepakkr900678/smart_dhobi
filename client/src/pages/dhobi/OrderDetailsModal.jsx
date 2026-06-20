import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X,
  Package,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  Play,
  Package2,
  Truck,
  AlertCircle,
} from "lucide-react";
import { getOrderById, updateOrderByOrderId } from "../../auth/ApiConnect";
import { getDealerServicePrice } from "../../utils/pricing";

function OrderDetailsModal() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-green-100 text-green-800",
      failed: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      in_progress: "bg-purple-100 text-purple-800",
      ready: "bg-orange-100 text-orange-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAvailableActions = (currentStatus) => {
    const statusActions = {
      pending: [
        {
          status: "accepted",
          label: "Accept Order",
          icon: CheckCircle,
          color: "bg-green-600 hover:bg-green-700",
        },
        {
          status: "cancelled",
          label: "Cancel Order",
          icon: XCircle,
          color: "bg-red-600 hover:bg-red-700",
        },
      ],
      accepted: [
        {
          status: "in_progress",
          label: "Start Processing",
          icon: Play,
          color: "bg-purple-600 hover:bg-purple-700",
        },
        {
          status: "cancelled",
          label: "Cancel Order",
          icon: XCircle,
          color: "bg-red-600 hover:bg-red-700",
        },
      ],
      in_progress: [
        {
          status: "ready",
          label: "Mark as Ready",
          icon: Package2,
          color: "bg-orange-600 hover:bg-orange-700",
        },
      ],
      ready: [
        {
          status: "delivered",
          label: "Mark as Delivered",
          icon: Truck,
          color: "bg-green-600 hover:bg-green-700",
        },
      ],
      delivered: [],
      cancelled: [],
    };

    return statusActions[currentStatus] || [];
  };

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true);
    try {
      await updateOrderByOrderId(order._id, newStatus);
      setOrder((prev) => ({
        ...prev,
        status: newStatus,
        updatedAt: new Date().toISOString(),
      }));

      const statusMessages = {
        accepted: "Order accepted successfully!",
        cancelled: "Order cancelled successfully!",
        in_progress: "Order marked as in progress!",
        ready: "Order marked as ready!",
        delivered: "Order marked as delivered!",
      };

      alert(statusMessages[newStatus] || "Order status updated successfully!");
    } catch (error) {
      console.error("Error updating order status:", error);
      alert(error.response?.data?.message || "Failed to update order status");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Order not found.</p>
      </div>
    );
  }

  const availableActions = getAvailableActions(order.status);
  const dealerOrderAmount = Number(
    (order.services || [])
      .reduce(
        (sum, service) =>
          sum + getDealerServicePrice(service) * (service.quantity || 0),
        0
      )
      .toFixed(2)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto bg-white rounded-lg shadow-md p-6">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">
            Order Details - #{order.orderId}
          </h2>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <span className="text-sm text-gray-600">Order ID:</span>
            <p className="font-medium">{order.orderId}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Amount:</span>
            <p className="font-medium">₹{dealerOrderAmount}</p>
          </div>
          <div>
            <span className="text-sm text-gray-600">Status:</span>
            <div
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-1 ${getOrderStatusColor(
                order.status
              )}`}
            >
              <span className="capitalize">
                {order.status.replace("_", " ")}
              </span>
            </div>
          </div>
          <div>
            <span className="text-sm text-gray-600">Created:</span>
            <p className="font-medium">{formatDate(order.createdAt)}</p>
          </div>
        </div>

        {/* Status Update Actions */}
        {availableActions.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Available Actions
            </h3>
            <div className="flex flex-wrap gap-3">
              {availableActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={action.status}
                    onClick={() => handleStatusUpdate(action.status)}
                    disabled={updating}
                    className={`flex items-center px-4 py-2 text-white rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
                  >
                    <IconComponent className="w-4 h-4 mr-2" />
                    {updating ? "Updating..." : action.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Information */}
        {(order.status === "delivered" || order.status === "cancelled") && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />
              <p className="text-blue-800 font-medium">
                {order.status === "delivered"
                  ? "This order has been completed and delivered."
                  : "This order has been cancelled and cannot be modified."}
              </p>
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Services
          </h3>
          <div className="space-y-2">
            {order.services.map((service, index) => {
              const dealerPrice = getDealerServicePrice(service);

              return (
                <div
                  key={index}
                  className="flex justify-between items-center bg-gray-50 p-3 rounded"
                >
                  <div>
                    <span className="font-medium capitalize">{service.name}</span>
                    <span className="text-gray-500 text-sm block">
                      Qty: {service.quantity} • ₹{dealerPrice} each
                    </span>
                  </div>
                  <span className="font-semibold">
                    ₹{dealerPrice * service.quantity}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Addresses */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Addresses
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Pickup Address
              </p>
              <p className="text-gray-800">{order.pickupAddress}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm font-medium text-gray-600 mb-2">
                Delivery Address
              </p>
              <p className="text-gray-800">{order.deliveryAddress}</p>
            </div>
          </div>
        </div>

        {/* Timing */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Timing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <span className="text-sm text-gray-600">Pickup Time:</span>
              <p className="font-medium">{order.pickupTime || "Not set"}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <span className="text-sm text-gray-600">Delivery Time:</span>
              <p className="font-medium">{order.deliveryTime || "Not set"}</p>
            </div>
          </div>
        </div>

        {/* Payment and Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 border">
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
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Order Amount</span>
                <span className="font-medium">₹{dealerOrderAmount}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border">
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
}

export default OrderDetailsModal;
