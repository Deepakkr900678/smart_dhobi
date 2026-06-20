import React, { useState } from "react";
import { Edit, Trash2, X, Check, Loader2, Plus } from "lucide-react";
import {
  addDhobiService,
  updateDhobiService,
  deleteDhobiService,
} from "../../auth/ApiConnect";

const ServicesSection = ({
  services,
  onEditService,
  onDeleteService,
  onServiceChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
  const [editingService, setEditingService] = useState(null);
  const [form, setForm] = useState({ name: "", price: "" });
  const [formError, setFormError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const dhobiId = localStorage.getItem("mainUserId");

  // ─── Open modal ─────────────────────────────────────────────────────────────
  const openAddModal = () => {
    setForm({ name: "", price: "" });
    setFormError("");
    setModalMode("add");
    setEditingService(null);
    setShowModal(true);
  };

  const openEditModal = (service) => {
    setForm({ name: service.name, price: service.price });
    setFormError("");
    setModalMode("edit");
    setEditingService(service);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ name: "", price: "" });
    setFormError("");
    setEditingService(null);
  };

  // ─── Submit (Add or Edit) ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const trimmedName = form.name.trim();
    const trimmedPrice = form.price.trim();

    if (!trimmedName || !trimmedPrice) {
      setFormError("Both name and price are required.");
      return;
    }

    setLoading(true);
    setFormError("");
    setError("");

    try {
      if (modalMode === "add") {
        await addDhobiService(dhobiId, {
          name: trimmedName,
          price: trimmedPrice,
        });
      } else {
        await updateDhobiService(dhobiId, editingService._id, {
          name: trimmedName,
          price: trimmedPrice,
        });
      }
      closeModal();
      await onServiceChange?.();
    } catch (err) {
      setFormError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (serviceId) => {
    if (!window.confirm("Are you sure you want to delete this service?"))
      return;

    setDeletingId(serviceId);
    setError("");

    try {
      await deleteDhobiService(dhobiId, serviceId);
      await onServiceChange?.();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete service. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">My Services</h3>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={16} />
              Add Service
            </button>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Services Grid */}
        <div className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p className="text-sm">No services added yet.</p>
              <button
                onClick={openAddModal}
                className="mt-3 text-purple-600 hover:text-purple-700 text-sm font-medium"
              >
                + Add your first service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service._id}
                  className="border border-gray-200 rounded-lg p-4 relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-900 pr-2">
                      {service.name}
                    </h4>
                    <div className="flex space-x-1 flex-shrink-0">
                      <button
                        onClick={() => openEditModal(service)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                        title="Edit service"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(service._id)}
                        disabled={deletingId === service._id}
                        className="text-red-600 hover:text-red-800 p-1 disabled:opacity-50"
                        title="Delete service"
                      >
                        {deletingId === service._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-lg font-semibold text-purple-600">
                    {service.price}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {modalMode === "add" ? "Add New Service" : "Edit Service"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Wash & Fold"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <input
                  type="text"
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: e.target.value }))
                  }
                  placeholder="e.g. ₹120"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {formError && <p className="text-red-600 text-sm">{formError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeModal}
                className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700 transition-colors disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    {modalMode === "add" ? "Add Service" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ServicesSection;
