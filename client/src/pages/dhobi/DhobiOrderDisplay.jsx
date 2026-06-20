import React, { useState, useEffect } from "react";
import { Package, RefreshCcw } from "lucide-react";
import OrdersTable from "./OrderTable";
import { getDhobiOrder } from "../../auth/ApiConnect";
import { useNavigate } from "react-router-dom";

function DhobiOrderDisplay() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // Mock data for demonstration
  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const orderss = await getDhobiOrder();
        setOrders(orderss || []);
      } catch (err) {
        setError(err.message || "Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    navigate(`/dhobi/orders/${order._id}`);
    setIsModalOpen(true);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded border border-gray-200">
          <p className="text-gray-600 mb-4">Error: {error}</p>
          <button
            onClick={handleRefresh}
            className="bg-gray-800 text-white px-6 py-2 rounded hover:bg-gray-900 transition-colors"
          >
            <RefreshCcw className="inline mr-2" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center ">
          <h1 className="text-3xl font-bold text-gray-800">Dhobi Orders</h1>
          <button
            onClick={handleRefresh}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 transition-colors"
          >
            <RefreshCcw />
          </button>
        </div>

        {/* Orders Count */}
        <div className="mb-6">
          <p className="text-gray-600">Total Orders: {orders.length}</p>
        </div>

        {/* Orders Table */}
        {orders.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No orders found</p>
          </div>
        ) : (
          <OrdersTable orders={orders} onViewDetails={handleViewDetails} />
        )}

        {/* Order Details Modal */}
        {/* <OrderDetailsModal
          order={selectedOrder}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onAccept={handleAcceptOrder}
          onDecline={handleDeclineOrder}
        /> */}
      </div>
    </div>
  );
}

export default DhobiOrderDisplay;
