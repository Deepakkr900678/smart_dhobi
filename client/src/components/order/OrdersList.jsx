import React, { useState, useEffect } from "react";
import { Package } from "lucide-react";
import OrderCard from "./OrderCard";
const OrdersList = ({ orders, onOrderClick, loading }) => {
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            No Orders Found
          </h2>
          <p className="text-gray-600">You haven't placed any orders yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className=" mx-auto ">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-800">My Orders</h1>
          <p className="text-gray-600 mt-1">
            Track and manage your laundry orders
          </p>
        </div>

        <div className="grid gap-6">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} onClick={onOrderClick} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrdersList;
