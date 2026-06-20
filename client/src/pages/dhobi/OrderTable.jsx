
import React from 'react';
import OrderStatusBadge from '../../components/dhobiComponent/OrderStatusBadge';
import { Eye } from 'lucide-react';
import { getDealerServicePrice } from '../../utils/pricing';

function OrdersTable({ orders, onViewDetails }) {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDealerOrderAmount = (order) =>
    Number(
      (order?.services || [])
        .reduce(
          (sum, service) => sum + getDealerServicePrice(service) * (service.quantity || 0),
          0
        )
        .toFixed(2)
    );

  return (
    <div className="bg-white border border-gray-200 rounded">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Order ID</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Services</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">#{order.orderId}</td>
                <td className="py-3 px-4 text-gray-600">{formatDate(order.createdAt)}</td>
                <td className="py-3 px-4 text-gray-600">{order.customerName || 'Customer'}</td>
                <td className="py-3 px-4 text-gray-600">
                  {order.services.length} service{order.services.length > 1 ? 's' : ''}
                </td>
                <td className="py-3 px-4 font-medium text-gray-800">₹{getDealerOrderAmount(order)}</td>
                <td className="py-3 px-4">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => onViewDetails(order)}
                    className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


export default OrdersTable;
