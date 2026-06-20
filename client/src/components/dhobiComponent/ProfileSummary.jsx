import React, { useState } from "react";

import { Star, Phone, MapPin } from "lucide-react";

const ProfileSummary = ({ profile }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Profile Summary</h3>
        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
          Edit Profile
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-purple-600 font-semibold text-lg">
              {profile.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{profile.name}</h4>
            <p className="text-sm text-gray-500">Owner: {profile.owner}</p>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{profile.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin size={14} />
            <span>{profile.address}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Star size={14} className="text-yellow-400 fill-current" />
            <span>
              {profile.rating} Rating ({profile.totalReviews} reviews)
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Status:</span>
            <span
              className={`font-medium ${
                profile.isActive ? "text-green-600" : "text-red-600"
              }`}
            >
              {profile.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-500">Commission Rate:</span>
            <span className="font-medium text-gray-900">
              {profile.commissionRate}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
