import React, { useState, useEffect } from "react";
import OrdersList from "../../components/order/OrdersList";
import OrderDetail from "../../components/order/OrderDetail";
import { userOrders } from "../../auth/ApiConnect";

export default function OrdersDisplay() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await userOrders();
      setOrders(ordersData || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderClick = (order) => {
    setSelectedOrder(order);
  };

  const handleBackToList = () => {
    setSelectedOrder(null);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={loadOrders}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (selectedOrder) {
    return <OrderDetail order={selectedOrder} onBack={handleBackToList} />;
  }

  return (
    <OrdersList
      orders={orders}
      onOrderClick={handleOrderClick}
      loading={loading}
    />
  );
}
