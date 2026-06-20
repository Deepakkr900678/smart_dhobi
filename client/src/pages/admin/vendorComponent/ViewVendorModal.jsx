import React, { useState, useEffect } from "react";
import {
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Loader,
} from "lucide-react";
import axios from "axios";
import { getAuthConfig } from "../../../auth/ApiConnect";

// Component for viewing vendor details
const ViewVendorModal = ({
  vendorId,
  onClose,
  onEdit,
  onSuspend,
  onActivate,
  onDelete,
}) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [commission, setCommission] = useState(0);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!vendorId) return;

      try {
        setLoading(true);

        const response = await axios.get(
          `${import.meta.env.VITE_APP_BASE_URL}/providers/profile/${vendorId}`,
          getAuthConfig()
        );
        setVendor(response.data.data);
        setCommission(response.data.data?.commissionRate ?? 0);
      } catch (err) {
        console.error("Error fetching vendor data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [vendorId]);

  if (!vendorId) return null;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-medium";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 px-2.5 py-0.5 rounded-full text-xs font-medium";
      case "Suspended":
        return "bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full text-xs font-medium";
      default:
        return "bg-gray-100 text-gray-800 px-2.5 py-0.5 rounded-full text-xs font-medium";
    }
  };

  // Helper function to determine vendor status
  const getVendorStatus = (vendor) => {
    if (!vendor) return "";

    if (vendor.isApproved === "pending") return "Pending";
    if (!vendor.isActive) return "Suspended";
    return "Active";
  };

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-20 pt-20">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="text-lg font-semibold text-gray-900">Dhobi Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <XCircle size={20} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 flex justify-center items-center h-64">
            <Loader size={24} className="animate-spin text-gray-500" />
            <span className="ml-2 text-gray-500">Loading Dhobi details...</span>
          </div>
        ) : error ? (
          <div className="p-6 flex justify-center items-center h-64">
            <AlertCircle size={24} className="text-red-500 mr-2" />
            <span className="text-red-500">Error: {error}</span>
          </div>
        ) : vendor ? (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {vendor.name}
                </h2>
                <p className="text-sm text-gray-500">
                  ID: {vendor._id.$oid || vendor._id}
                </p>
              </div>
              <span className={getStatusBadgeClass(getVendorStatus(vendor))}>
                {getVendorStatus(vendor)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Owner Information
                </h4>
                <p className="text-sm font-medium text-gray-900">
                  {vendor.owner}
                </p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Mail size={16} className="mr-1" />
                  {vendor.email}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Phone size={16} className="mr-1" />
                  {vendor.mobile}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Business Information
                </h4>
                <div className="flex items-start text-sm text-gray-500">
                  <MapPin size={16} className="mr-1 mt-0.5 flex-shrink-0" />
                  <span>{vendor.address}</span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  <span className="font-medium">Service Areas:</span>{" "}
                  {Array.isArray(vendor.serviceAreas)
                    ? vendor.serviceAreas.join(", ")
                    : vendor.serviceAreas}
                </div>
               
              </div>
               <div className="mt-1 text-sm text-gray-500 flex items-center justify-between gap-2">
                  <p className="font-medium">Commission Rate:</p>

                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      value={commission}
                      onChange={(e) => setCommission(e.target.value)}
                      className="border px-2 py-1 rounded w-20"
                      min="0"
                      max="100"
                    />
                    <span>%</span>

                    <button
                      onClick={async () => {
                        try {
                          setSaving(true);

                          await axios.patch(
                            `${
                              import.meta.env.VITE_APP_BASE_URL
                            }/providers/profile/${vendor._id}`,
                            { commissionRate: Number(commission) },
                            getAuthConfig()
                          );

                         setVendor((prev) => ({
                            ...prev,
                            commissionRate: Number(commission),
                          }));
                          alert("Commission rate updated successfully");
                        } catch (err) {
                          console.error(err);
                          alert("Update failed");
                        } finally {
                          setSaving(false);
                        }
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
            </div>

            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Service & Pricing
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Service
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">
                        Price
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {vendor.services.map((service, index) => (
                      <tr key={index}>
                        <td className="py-2 text-sm font-medium text-gray-900">
                          {service.name}
                        </td>
                        <td className="py-2 text-sm text-gray-500">
                          {service.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Join Date
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {vendor.joinDate}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">
                  Orders Completed
                </div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {vendor.ordersCompleted}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-sm font-medium text-gray-500">Rating</div>
                <div className="mt-1 text-xl font-semibold text-gray-900">
                  {vendor.rating > 0 ? `${vendor.rating}/5.0` : "N/A"}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-6 flex justify-between">
              {getVendorStatus(vendor) === "Pending" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onActivate(vendor._id.$oid || vendor._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Approve Vendor
                  </button>
                  <button
                    onClick={() => onDelete(vendor._id.$oid || vendor._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                  >
                    <XCircle size={16} className="mr-2" />
                    Reject
                  </button>
                </div>
              )}

              {getVendorStatus(vendor) === "Active" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onEdit(vendor._id?.$oid || vendor._id)}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit Details
                  </button>
                  <button
                    onClick={() => onSuspend(vendor._id.$oid || vendor._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                  >
                    <AlertCircle size={16} className="mr-2" />
                    Suspend Vendor
                  </button>
                </div>
              )}

              {getVendorStatus(vendor) === "Suspended" && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => onActivate(vendor._id.$oid || vendor._id)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle size={16} className="mr-2" />
                    Reactivate Vendor
                  </button>
                  <button
                    onClick={() => onDelete(vendor._id.$oid || vendor._id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center"
                  >
                    <Trash2 size={16} className="mr-2" />
                    Delete Permanently
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 flex justify-center items-center h-64">
            <AlertCircle size={24} className="text-yellow-500 mr-2" />
            <span className="text-gray-500">No Dhobi data found</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewVendorModal;
