import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { getCustomerServicePrice, getCommissionRate, normalizePrice } from '../../utils/pricing';

const formatPrice = (value) =>
  Number.isInteger(value) ? value : value.toFixed(2);

const ServiceSelector = ({ services, selectedServices, onServiceQuantityChange, provider }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
    <h2 className="text-base font-semibold text-gray-900 mb-4">Select Services</h2>
    {getCommissionRate(provider) > 0 && (
      <p className="text-xs text-gray-500 mb-4">
        Customer prices include {getCommissionRate(provider)}% commission.
      </p>
    )}

    <div className="divide-y divide-gray-100">
      {services.map((service) => {
        const qty = selectedServices[service._id] || 0;
        const basePrice = normalizePrice(service.price);
        const customerPrice = getCustomerServicePrice(service, provider);

        return (
          <div
            key={service._id}
            className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
          >
            {/* Left: name + price */}
            <div className="flex-1 min-w-0 pr-4">
              <p className="text-sm font-medium text-gray-800 capitalize">{service.name}</p>
              <p className="text-sm text-indigo-600 font-semibold mt-0.5">₹{formatPrice(customerPrice)}</p>
              {customerPrice !== basePrice && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Base price: ₹{formatPrice(basePrice)}
                </p>
              )}
              {qty > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Subtotal: ₹{formatPrice(customerPrice * qty)}
                </p>
              )}
            </div>

            {/* Right: qty controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onServiceQuantityChange(service._id, Math.max(0, qty - 1))}
                disabled={qty === 0}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <Minus size={14} />
              </button>

              <span className="w-6 text-center text-sm font-semibold text-gray-800">
                {qty}
              </span>

              <button
                onClick={() => onServiceQuantityChange(service._id, qty + 1)}
                className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default ServiceSelector;
