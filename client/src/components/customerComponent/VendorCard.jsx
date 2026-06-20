import React, { useState } from "react";
import { MapPin, Star, Phone, CheckCircle } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
const VendorCard = ({ vendor }) => {
  const navigate = useNavigate();

  console.log("Vendor Card:", vendor._id);
  return (
    <div className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{vendor.name}</h3>
          <p className="text-sm text-gray-600">Owner: {vendor.owner}</p>
        </div>
        <div className="flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
          <CheckCircle size={12} className="text-green-600" />
          <span className="text-xs text-green-700 font-medium">Active</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin size={14} />
          <span>{vendor.serviceAreas}</span>
          <span className="text-purple-600 font-medium">
            ({vendor.distance} km away)
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Phone size={14} />
          <span>{vendor.mobile}</span>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <Star size={14} className="text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{vendor.rating}</span>
        </div>
        <div className="text-sm text-gray-600">
          {vendor.ordersCompleted} orders completed
        </div>
      </div>

      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
        <div className="flex flex-wrap gap-2">
          {vendor.services.map((service, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-200"
            >
              {service.name} - {service.price}
            </span>
          ))}
        </div>
      </div>

      {/* <div className="text-xs text-gray-500 mb-3">
        <p>Coordinates: {vendor.location.coordinates[1].toFixed(4)}, {vendor.location.coordinates[0].toFixed(4)}</p>
      </div> */}

      <button
        onClick={() => {
          navigate(`book-service/${vendor._id}`);
        }}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-medium"
      >
        Book Service
      </button>
    </div>
  );
};

export default VendorCard;
