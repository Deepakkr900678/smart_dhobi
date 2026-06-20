import React, { useState, useEffect } from "react";

import {
  Clock,
  Package,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
} from "lucide-react";
const OrderCard = ({ order, onClick }) => {
  const totalItems = order.services.reduce(
    (sum, service) => sum + service.quantity,
    0
  );
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
  return (
    <div
      onClick={() => onClick(order)}
      className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            #{order.orderId}
          </h3>
          <p className="text-sm text-gray-600">{order.providerId.name}</p>
        </div>
        <div className="text-right">
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
              order.status
            )}`}
          >
            {getStatusIcon(order.status)}
            <span className="ml-1 capitalize">
              {order.status.replace("_", " ")}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Items</p>
          <p className="font-medium">{totalItems} items</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Amount</p>
          <p className="font-medium text-green-600">₹{order.amount}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm text-gray-500">
        <span>Ordered: {formatDate(order.createdAt)}</span>
        <div
          className={`px-2 py-1 rounded text-xs ${getPaymentStatusColor(
            order.paymentStatus
          )}`}
        >
          {order.paymentStatus}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
