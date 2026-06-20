import React, { useState, useEffect } from "react";
import { Search, Filter, ChevronDown, Plus, RefreshCw } from "lucide-react";
import axios from "axios";
import { useToast } from "../../components/toast/ToastProvider";

import AddVendorModal from "./vendorComponent/AddVendorModal";
import EditVendorModal from "./vendorComponent/EditVendorModal";
import ViewVendorModal from "./vendorComponent/ViewVendorModal";

const API_BASE_URL =
  import.meta.env.VITE_APP_BASE_URL || "https://api.smartdhobi.in/api";

// Always reads the latest token from localStorage
const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  },
});

const VendorManagement = () => {
  const { showToast } = useToast();

  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    suspended: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // ── Fetch all providers ────────────────────────────────────────────────────
  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // No status filter — returns all dhobis regardless of approval/active state
      const response = await axios.get(
        `${API_BASE_URL}/admin/providers`,
        getAuthConfig()
      );

      const providerList = response.data?.data || [];

      const transformed = providerList.map((p) => ({
        id: p._id,
        dhobiId: p.dhobiId,
        name: p.name || "N/A",
        owner: p.owner || p.userId?.name || "N/A",
        email: p.email || p.userId?.email || "N/A",
        phone: p.mobile || p.userId?.mobile || "N/A",
        address: p.address || "N/A",
        serviceAreas: p.serviceAreas || "N/A",
        isApproved: p.isApproved,
        isActive: p.isActive,
        commissionRate: p.commissionRate ?? 15,
        joinDate: p.createdAt
          ? new Date(p.createdAt).toISOString().split("T")[0]
          : "N/A",
        ordersCompleted: p.ordersCompleted || 0,
        rating: p.rating || 0,
        services: p.services || [],
        status:
          p.isApproved === "pending"
            ? "Pending"
            : p.isApproved === "rejected"
            ? "Suspended"
            : p.isActive
            ? "Active"
            : "Suspended",
      }));

      setVendors(transformed);
      calculateStats(transformed);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      const msg =
        err.response?.data?.message ||
        "Failed to load vendors. Please try again.";
      setError(msg);
      showToast({ type: "error", title: "Fetch failed", message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateStats = (data) => {
    setStats({
      total: data.length,
      active: data.filter((v) => v.status === "Active").length,
      pending: data.filter((v) => v.status === "Pending").length,
      suspended: data.filter((v) => v.status === "Suspended").length,
    });
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filteredVendors = vendors.filter((v) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      v.name?.toLowerCase().includes(q) ||
      v.owner?.toLowerCase().includes(q) ||
      v.email?.toLowerCase().includes(q) ||
      String(v.dhobiId).includes(q);
    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleViewVendor = (vendorId) => {
    setSelectedVendor(vendorId);
    setIsViewModalOpen(true);
  };

  const handleEditVendor = (vendorId) => {
    const id =
      typeof vendorId === "object"
        ? vendorId?._id?.$oid || vendorId?._id || vendorId?.id
        : vendorId;
    setSelectedVendor(id);
    setIsViewModalOpen(false);
    setIsEditModalOpen(true);
  };

  const handleSaveVendor = async () => {
    setIsEditModalOpen(false);
    setSelectedVendor(null);
    await fetchVendors();
    showToast({
      type: "success",
      title: "Saved",
      message: "Vendor updated successfully.",
    });
  };

  const handleActivateVendor = async (vendorId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/providers/profile/${vendorId}`,
        { isApproved: "approved", isActive: true },
        getAuthConfig()
      );
      showToast({
        type: "success",
        title: "Activated",
        message: "Vendor has been approved and activated.",
      });
      setIsViewModalOpen(false);
      await fetchVendors();
    } catch (err) {
      console.error("Error activating vendor:", err);
      showToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message || "Failed to activate vendor.",
      });
    }
  };

  const handleSuspendVendor = async (vendorId) => {
    try {
      await axios.patch(
        `${API_BASE_URL}/providers/profile/${vendorId}`,
        { isActive: false, isApproved: "rejected" },
        getAuthConfig()
      );
      showToast({
        type: "warning",
        title: "Suspended",
        message: "Vendor has been suspended.",
      });
      setIsViewModalOpen(false);
      await fetchVendors();
    } catch (err) {
      console.error("Error suspending vendor:", err);
      showToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message || "Failed to suspend vendor.",
      });
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/providers/${vendorId}`,
        getAuthConfig()
      );
      showToast({
        type: "success",
        title: "Deleted",
        message: "Vendor removed successfully.",
      });
      setIsViewModalOpen(false);
      await fetchVendors();
    } catch (err) {
      console.error("Error deleting vendor:", err);
      showToast({
        type: "error",
        title: "Failed",
        message: err.response?.data?.message || "Failed to delete vendor.",
      });
    }
  };

  const handleAddVendor = async (newVendor) => {
    try {
      const pricing = {};
      (newVendor.services || []).forEach((s) => {
        pricing[s.name.toLowerCase()] =
          parseFloat(String(s.price).replace(/[^0-9.]/g, "")) || 0;
      });

      await axios.post(
        `${API_BASE_URL}/providers/create`,
        { ...newVendor, mobile: newVendor.phone, pricing },
        getAuthConfig()
      );

      showToast({
        type: "success",
        title: "Added",
        message: "New vendor created successfully.",
      });
      setIsAddModalOpen(false);
      await fetchVendors();
    } catch (err) {
      console.error("Error adding vendor:", err);
      showToast({
        type: "error",
        title: "Failed to add vendor",
        message:
          err.response?.data?.message || "Please check the form and try again.",
      });
    }
  };

  // ── Status badge ───────────────────────────────────────────────────────────
  const statusBadge = (status) => {
    const map = {
      Active: "bg-green-100 text-green-800",
      Pending: "bg-yellow-100 text-yellow-800",
      Suspended: "bg-red-100 text-red-800",
    };
    return (
      <span
        className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
          map[status] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status}
      </span>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full mx-auto">
      <div className="mb-6 pt-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dhobi Management</h1>
        <button
          onClick={fetchVendors}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, color: "border-l-indigo-500" },
          {
            label: "Active",
            value: stats.active,
            color: "border-l-emerald-500",
          },
          {
            label: "Pending",
            value: stats.pending,
            color: "border-l-yellow-500",
          },
          {
            label: "Suspended",
            value: stats.suspended,
            color: "border-l-red-500",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`stat-card border-l-4 ${s.color} bg-white p-4 rounded-lg shadow`}
          >
            <h3 className="text-gray-500 text-xs uppercase font-semibold">
              {s.label} Dhobis
            </h3>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg block w-full pl-10 p-2.5 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Search by name, ID, owner, or email..."
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex items-center">
              <Filter size={18} className="text-gray-500 mr-2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-gray-300 text-gray-900 text-sm rounded-lg pl-3 pr-8 py-2.5 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Pending">Pending</option>
                <option value="Suspended">Suspended</option>
              </select>
              <ChevronDown
                size={16}
                className="pointer-events-none absolute right-2 text-gray-600"
              />
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Dhobi
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" />
          </div>
        ) : error ? (
          <div className="px-4 py-6 text-center">
            <p className="text-red-500 mb-3">{error}</p>
            <button
              onClick={fetchVendors}
              className="text-sm text-indigo-600 underline hover:text-indigo-800"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Dhobi ID",
                    "Business",
                    "Contact",
                    "Service Areas",
                    "Status",
                    "Commission",
                    "Orders",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor) => (
                    <tr
                      key={vendor.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleViewVendor(vendor.id)}
                    >
                      <td className="px-4 py-4 text-sm font-mono text-gray-700">
                        #{vendor.dhobiId}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {vendor.name}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {vendor.owner}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="text-gray-900">{vendor.email}</div>
                        <div className="text-gray-500 text-xs">
                          {vendor.phone}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 max-w-[180px] truncate">
                        {vendor.serviceAreas || "N/A"}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {statusBadge(vendor.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {vendor.commissionRate}%
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {vendor.ordersCompleted}
                      </td>
                      <td
                        className="px-4 py-4 text-sm text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleViewVendor(vendor.id)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditVendor(vendor.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-4 py-8 text-center text-sm text-gray-500"
                    >
                      {searchQuery || statusFilter !== "All"
                        ? "No dhobis match your search criteria."
                        : "No dhobis registered yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Total count footer */}
      {!isLoading && !error && (
        <div className="mt-3 text-sm text-gray-500 text-right">
          Showing {filteredVendors.length} of {vendors.length} dhobis
        </div>
      )}

      {/* Modals */}
      {isViewModalOpen && selectedVendor && (
        <ViewVendorModal
          vendorId={selectedVendor}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedVendor(null);
          }}
          onEdit={handleEditVendor}
          onSuspend={handleSuspendVendor}
          onActivate={handleActivateVendor}
          onDelete={handleDeleteVendor}
        />
      )}

      {isEditModalOpen && selectedVendor && (
        <EditVendorModal
          vendorId={selectedVendor}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedVendor(null);
          }}
          onSave={handleSaveVendor}
        />
      )}

      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddVendor={handleAddVendor}
      />
    </div>
  );
};

export default VendorManagement;
