import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { getCustomerServicePrice, normalizePrice } from '../../utils/pricing';

const formatPrice = (value) =>
  Number.isInteger(value) ? value : value.toFixed(2);

const OrderSummary = ({
  selectedServices,
  services,
  pickupAddress,
  deliveryAddress,
  onBookService,
  isBooking,
  provider,
}) => {
  const hasSelected = Object.keys(selectedServices).length > 0;
  if (!hasSelected) return null;

  let total = 0;
  const rows = Object.entries(selectedServices).map(([id, qty]) => {
    const svc = services.find(s => s._id === id);
    const price = getCustomerServicePrice(svc, provider);
    const subtotal = price * qty;
    total += subtotal;
    return {
      name: svc.name,
      price,
      qty,
      subtotal,
      basePrice: normalizePrice(svc.price),
    };
  });

  const isReady = pickupAddress?.trim() && deliveryAddress?.trim();
  total = Number(total.toFixed(2));

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <div className="flex items-center gap-2 mb-5">
        <ShoppingBag size={16} className="text-indigo-600" />
        <h2 className="text-base font-semibold text-gray-900">Order Summary</h2>
      </div>

      {/* Line items */}
      <div className="divide-y divide-gray-100">
        {rows.map((r, i) => (
          <div key={i} className="flex justify-between items-center py-3 first:pt-0">
            <div>
              <p className="text-sm font-medium text-gray-800 capitalize">{r.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">₹{formatPrice(r.price)} × {r.qty}</p>
              {r.basePrice !== r.price && (
                <p className="text-xs text-gray-400 mt-0.5">Base: ₹{formatPrice(r.basePrice)}</p>
              )}
            </div>
            <p className="text-sm font-semibold text-gray-800">₹{formatPrice(r.subtotal)}</p>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-700">Total</span>
        <span className="text-lg font-bold text-indigo-600">₹{formatPrice(total)}</span>
      </div>

      {/* CTA */}
      <button
        onClick={() => onBookService(total)}
        disabled={!isReady || isBooking}
        className={`mt-5 w-full py-3 rounded-xl text-sm font-semibold transition-colors ${
          isReady && !isBooking
            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
        }`}
      >
        {isBooking
          ? 'Placing order…'
          : isReady
            ? `Confirm Booking — ₹${formatPrice(total)}`
            : 'Add pickup & delivery address to continue'}
      </button>

      {!isReady && (
        <p className="mt-2 text-center text-xs text-gray-400">
          Fill in both addresses above to place the order.
        </p>
      )}
    </div>
  );
};

export default OrderSummary;
