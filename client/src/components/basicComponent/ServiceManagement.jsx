import React, {useState} from "react"
import {  Plus, Trash2,} from 'lucide-react';

const ServiceManagement = ({ services, onChange, error }) => {
  const addService = () => {
    const newServices = [...services, { name: '', price: '' }];
    onChange({ target: { name: 'services', value: newServices } });
  };

  const removeService = (index) => {
    const newServices = services.filter((_, i) => i !== index);
    onChange({ target: { name: 'services', value: newServices } });
  };

  const updateService = (index, field, value) => {
    const newServices = [...services];
    newServices[index][field] = value;
    onChange({ target: { name: 'services', value: newServices } });
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Services Offered <span className="text-red-500">*</span>
      </label>
      {services.map((service, index) => (
        <div key={index} className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="Service name (e.g., Wash & Fold)"
            value={service.name}
            onChange={(e) => updateService(index, 'name', e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Price (e.g., ₹80/kg)"
            value={service.price}
            onChange={(e) => updateService(index, 'price', e.target.value)}
            className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="button"
            onClick={() => removeService(index)}
            className="px-3 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            disabled={services.length === 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addService}
        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
      >
        <Plus size={16} /> Add Service
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};


export default ServiceManagement;