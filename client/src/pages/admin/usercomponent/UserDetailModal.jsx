// User Detail Modal Component
import React from "react";
import { X, AlertCircle, Check, Clock, MapPin } from "lucide-react";
import UserAvatar from "../../../components/basicComponent/UserAvatar";

const UserDetailModal = ({ user, isOpen, onClose, onStatusChange }) => {
  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-14 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-lg font-medium text-gray-900">User Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6">
          {/* User Basic Info */}
          {user.role === "dhobi" ? (
            <div className="flex items-center mb-6">
              <UserAvatar name={user.name} size="lg" />
              <div className="ml-4">
                <h2 className="text-xl font-bold text-gray-800">{user.name}</h2>
                <p className="text-gray-500 flex items-center">
                  <span
                    className={`w-2 h-2 rounded-full mr-2 ${
                      user.status === "active" ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  {user.isVerified === true
                    ? "Active Account"
                    : "Suspended Account"}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  Role: {user.role}
                </p>
              </div>
            </div>
          ) : (
            <>
              {" "}
              <p className="text-sm text-gray-600 capitalize">
                Role: {user.role}
              </p>
            </>
          )}

          {/* Contact Information */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Contact Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{user.mobile}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Joined Date</p>
                <p className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="font-medium">{user.orders}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Service Areas</p>
                <p className="font-medium">{user.serviceAreas}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Verification Status</p>
                <p
                  className={`font-medium ${
                    user.isVerified ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {user.isVerified ? "Verified" : "Not Verified"}
                </p>
              </div>
            </div>
          </div>

          {/* Location Information */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Location Information
            </h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Coordinates</p>
                  <p className="font-medium">
                    {user.location.coordinates[1]},{" "}
                    {user.location.coordinates[0]}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {user.serviceAreas}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Addresses */}
          {user.addresses && user.addresses.length > 0 && (
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4">
                Saved Addresses
              </h4>
              <div className="space-y-4">
                {user.addresses.map((address, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-start">
                      <MapPin className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-gray-900">
                          {address.label}
                        </h5>
                        <p className="text-gray-500">{address.address}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {address.coordinates.lat}, {address.coordinates.lng}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Administrative Actions */}
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">
              Administrative Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              {user.status === "active" ? (
                <button
                  onClick={() => onStatusChange(user._id, "suspended")}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Suspend Account
                </button>
              ) : (
                <button
                  onClick={() => onStatusChange(user._id, "active")}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Activate Account
                </button>
              )}
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                <Clock className="h-4 w-4 mr-2" />
                Reset Password
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
