import React from "react";
import { Clock, CheckCircle, AlertCircle, Package, Truck, XCircle } from "lucide-react";

const OrderStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      color: "bg-yellow-100 text-yellow-800",
      icon: <Clock size={14} />,
    },
    accepted: {
      color: "bg-blue-100 text-blue-800",
      icon: <CheckCircle size={14} />,
    },
    in_progress: {
      color: "bg-indigo-100 text-indigo-800",
      icon: <Package size={14} />,
    },
    ready: {
      color: "bg-green-100 text-green-800",
      icon: <CheckCircle size={14} />,
    },
    delivered: {
      color: "bg-emerald-100 text-emerald-800",
      icon: <Truck size={14} />,
    },
    cancelled: {
      color: "bg-red-100 text-red-800",
      icon: <XCircle size={14} />,
    },
  };

  const config = statusConfig[status] || statusConfig["pending"];

  // Format status text for display
  const formatStatusText = (status) => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
      {config.icon}
      {formatStatusText(status)}
    </span>
  );
};

export default OrderStatusBadge;