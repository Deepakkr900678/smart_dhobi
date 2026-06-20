import React, { useEffect, useState } from "react";
import { Save, User, Store, MapPin, CreditCard, Briefcase } from "lucide-react";
import {
  fetchCurrentUserProfile,
  fetchDhobiById,
  getCurrentMainUserId,
  getCurrentRole,
  updateCurrentUserProfile,
  updateDhobiProfile,
} from "../../auth/ApiConnect";
import FormInput from "../../components/basicComponent/FormInput";
import FormTextarea from "../../components/basicComponent/FormTextArea";
import { useToast } from "../../components/toast/ToastProvider";
import { getApiErrorMessage } from "../../utils/apiError";

const emptyDhobiForm = {
  name: "",
  owner: "",
  email: "",
  mobile: "",
  address: "",
  serviceAreas: "",
  commissionRate: 0,
  services: [{ name: "", price: "" }],
  imagesText: "",
  bankDetails: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
    branchName: "",
    accountType: "savings",
  },
  location: {
    latitude: "",
    longitude: "",
  },
};

const emptyUserForm = {
  name: "",
  email: "",
  mobile: "",
  serviceAreas: "",
  profilePicture: "",
  location: {
    latitude: "",
    longitude: "",
  },
};

const SectionCard = ({ title, icon, children, subtitle }) => (
  <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {subtitle ? <p className="text-sm text-gray-500 mt-1">{subtitle}</p> : null}
      </div>
    </div>
    {children}
  </section>
);

function ProfilePage() {
  const role = getCurrentRole();
  const isDhobi = role === "dhobi";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [dhobiForm, setDhobiForm] = useState(emptyDhobiForm);
  const [providerMeta, setProviderMeta] = useState({
    isApproved: "",
    isActive: false,
    rating: 0,
    earnings: 0,
    ordersCompleted: 0,
  });
  const { showToast } = useToast();

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (isDhobi) {
          const providerId = getCurrentMainUserId();
          const profile = await fetchDhobiById(providerId);
          const [lng, lat] = profile?.location?.coordinates || [];

          setDhobiForm({
            name: profile?.name || "",
            owner: profile?.owner || "",
            email: profile?.email || "",
            mobile: profile?.mobile || "",
            address: profile?.address || "",
            serviceAreas: profile?.serviceAreas || "",
            commissionRate: Number(profile?.commissionRate || 0),
            services:
              profile?.services?.length > 0
                ? profile.services.map((service) => ({
                    name: service.name || "",
                    price: String(service.price ?? ""),
                  }))
                : [{ name: "", price: "" }],
            imagesText: Array.isArray(profile?.images) ? profile.images.join(", ") : "",
            bankDetails: {
              accountHolderName: profile?.bankDetails?.accountHolderName || "",
              accountNumber: profile?.bankDetails?.accountNumber || "",
              ifscCode: profile?.bankDetails?.ifscCode || "",
              bankName: profile?.bankDetails?.bankName || "",
              branchName: profile?.bankDetails?.branchName || "",
              accountType: profile?.bankDetails?.accountType || "savings",
            },
            location: {
              latitude: lat ?? "",
              longitude: lng ?? "",
            },
          });

          setProviderMeta({
            isApproved: profile?.isApproved || "pending",
            isActive: Boolean(profile?.isActive),
            rating: Number(profile?.rating || 0),
            earnings: Number(profile?.earnings || 0),
            ordersCompleted: Number(profile?.ordersCompleted || 0),
          });
        } else {
          const profile = await fetchCurrentUserProfile();
          const [lng, lat] = profile?.location?.coordinates || [];

          setUserForm({
            name: profile?.name || "",
            email: profile?.email || "",
            mobile: profile?.mobile || "",
            serviceAreas: profile?.serviceAreas || "",
            profilePicture: profile?.profilePicture || "",
            location: {
              latitude: lat ?? "",
              longitude: lng ?? "",
            },
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Profile load failed",
          message: getApiErrorMessage(error, "Unable to load your profile."),
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const syncStoredUser = async () => {
    try {
      const currentUser = await fetchCurrentUserProfile();
      localStorage.setItem("user", JSON.stringify(currentUser));
    } catch (error) {
      console.error("Failed to refresh stored user profile:", error);
    }
  };

  const handleUserFieldChange = (event) => {
    const { name, value } = event.target;
    setUserForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDhobiFieldChange = (event) => {
    const { name, value } = event.target;
    setDhobiForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (scope, field, value) => {
    if (scope === "dhobi") {
      setDhobiForm((prev) => ({
        ...prev,
        location: { ...prev.location, [field]: value },
      }));
      return;
    }

    setUserForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  };

  const handleBankFieldChange = (event) => {
    const { name, value } = event.target;
    setDhobiForm((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [name]: value,
      },
    }));
  };

  const handleServiceChange = (index, field, value) => {
    setDhobiForm((prev) => ({
      ...prev,
      services: prev.services.map((service, serviceIndex) =>
        serviceIndex === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const addServiceRow = () => {
    setDhobiForm((prev) => ({
      ...prev,
      services: [...prev.services, { name: "", price: "" }],
    }));
  };

  const removeServiceRow = (index) => {
    setDhobiForm((prev) => ({
      ...prev,
      services:
        prev.services.length === 1
          ? [{ name: "", price: "" }]
          : prev.services.filter((_, serviceIndex) => serviceIndex !== index),
    }));
  };

  const handleUserSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: userForm.name.trim(),
        email: userForm.email.trim().toLowerCase(),
        mobile: userForm.mobile.trim(),
        serviceAreas: userForm.serviceAreas.trim(),
      };

      if (userForm.profilePicture.trim()) {
        payload.profilePicture = userForm.profilePicture.trim();
      }

      if (userForm.location.latitude !== "" && userForm.location.longitude !== "") {
        payload.location = {
          type: "Point",
          coordinates: [
            Number(userForm.location.longitude),
            Number(userForm.location.latitude),
          ],
        };
      }

      await updateCurrentUserProfile(payload);
      await syncStoredUser();

      showToast({
        type: "success",
        title: "Profile updated",
        message: "Your profile details were saved successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Update failed",
        message: getApiErrorMessage(error, "Unable to save your profile."),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDhobiSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const providerId = getCurrentMainUserId();
      const payload = {
        name: dhobiForm.name.trim(),
        owner: dhobiForm.owner.trim(),
        email: dhobiForm.email.trim().toLowerCase(),
        mobile: dhobiForm.mobile.trim(),
        address: dhobiForm.address.trim(),
        serviceAreas: dhobiForm.serviceAreas.trim(),
        services: dhobiForm.services
          .filter((service) => service.name.trim() && service.price !== "")
          .map((service) => ({
            name: service.name.trim(),
            price: Number(service.price),
          })),
        bankDetails: {
          accountHolderName: dhobiForm.bankDetails.accountHolderName.trim(),
          accountNumber: dhobiForm.bankDetails.accountNumber.trim(),
          ifscCode: dhobiForm.bankDetails.ifscCode.trim().toUpperCase(),
          bankName: dhobiForm.bankDetails.bankName.trim(),
          branchName: dhobiForm.bankDetails.branchName.trim(),
          accountType: dhobiForm.bankDetails.accountType,
        },
        images: dhobiForm.imagesText
          .split(",")
          .map((url) => url.trim())
          .filter(Boolean),
        location: {
          type: "Point",
          coordinates: [
            Number(dhobiForm.location.longitude),
            Number(dhobiForm.location.latitude),
          ],
        },
      };

      await updateDhobiProfile(providerId, payload);
      await syncStoredUser();

      showToast({
        type: "success",
        title: "Profile updated",
        message: "Your dhobi profile was updated successfully.",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: "Update failed",
        message: getApiErrorMessage(error, "Unable to save your dhobi profile."),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6">
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-900 rounded-3xl p-8 text-white">
        <p className="text-sm uppercase tracking-[0.25em] text-indigo-200 mb-2">
          Profile
        </p>
        <h1 className="text-3xl font-semibold">
          {isDhobi ? "Manage Your Dhobi Profile" : "Manage Your Account"}
        </h1>
        <p className="text-sm text-slate-200 mt-3 max-w-2xl">
          View and edit your profile details here. Passwords are never shown on this page.
        </p>
      </div>

      {isDhobi ? (
        <form onSubmit={handleDhobiSubmit} className="space-y-6">
          <SectionCard
            title="Business Details"
            icon={<Store size={18} />}
            subtitle="These are the main details customers and admins use to identify your dhobi."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput label="Business Name" name="name" value={dhobiForm.name} onChange={handleDhobiFieldChange} required />
              <FormInput label="Owner Name" name="owner" value={dhobiForm.owner} onChange={handleDhobiFieldChange} required />
              <FormInput label="Email" name="email" type="email" value={dhobiForm.email} onChange={handleDhobiFieldChange} required />
              <FormInput label="Mobile" name="mobile" value={dhobiForm.mobile} onChange={handleDhobiFieldChange} required />
            </div>
            <FormTextarea label="Address" name="address" value={dhobiForm.address} onChange={handleDhobiFieldChange} required rows={3} />
            <FormTextarea label="Service Areas" name="serviceAreas" value={dhobiForm.serviceAreas} onChange={handleDhobiFieldChange} required rows={3} />
          </SectionCard>

          <SectionCard
            title="Business Status"
            icon={<Briefcase size={18} />}
            subtitle="These values are visible for reference. Commission is controlled by the platform."
          >
            <div className="grid md:grid-cols-4 gap-4">
              <FormInput label="Approval Status" name="isApproved" value={providerMeta.isApproved} disabled />
              <FormInput label="Active" name="isActive" value={providerMeta.isActive ? "Yes" : "No"} disabled />
              <FormInput label="Commission Rate" name="commissionRate" value={`${dhobiForm.commissionRate}%`} disabled />
              <FormInput label="Orders Completed" name="ordersCompleted" value={String(providerMeta.ordersCompleted)} disabled />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput label="Rating" name="rating" value={String(providerMeta.rating)} disabled />
              <FormInput label="Earnings" name="earnings" value={`₹${providerMeta.earnings}`} disabled />
            </div>
          </SectionCard>

          {/* <SectionCard
            title="Location"
            icon={<MapPin size={18} />}
            subtitle="Update your stored map coordinates if your business location changes."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                label="Latitude"
                name="latitude"
                type="number"
                value={dhobiForm.location.latitude}
                onChange={(event) => handleLocationChange("dhobi", "latitude", event.target.value)}
                required
              />
              <FormInput
                label="Longitude"
                name="longitude"
                type="number"
                value={dhobiForm.location.longitude}
                onChange={(event) => handleLocationChange("dhobi", "longitude", event.target.value)}
                required
              />
            </div>
          </SectionCard> */}

          <SectionCard
            title="Services"
            icon={<Store size={18} />}
            subtitle="Edit the services and prices customers can book."
          >
            <div className="space-y-3">
              {dhobiForm.services.map((service, index) => (
                <div key={index} className="grid md:grid-cols-[1fr_180px_80px] gap-3 items-end">
                  <FormInput
                    label={`Service ${index + 1}`}
                    name={`service-name-${index}`}
                    value={service.name}
                    onChange={(event) => handleServiceChange(index, "name", event.target.value)}
                  />
                  <FormInput
                    label="Price"
                    name={`service-price-${index}`}
                    type="number"
                    value={service.price}
                    onChange={(event) => handleServiceChange(index, "price", event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => removeServiceRow(index)}
                    className="h-12 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addServiceRow}
              className="mt-3 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Add Service
            </button>
          </SectionCard>

          <SectionCard
            title="Bank Details"
            icon={<CreditCard size={18} />}
            subtitle="Registration bank details are shown here so you can review and update them."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput label="Account Holder Name" name="accountHolderName" value={dhobiForm.bankDetails.accountHolderName} onChange={handleBankFieldChange} required />
              <FormInput label="Bank Name" name="bankName" value={dhobiForm.bankDetails.bankName} onChange={handleBankFieldChange} required />
              <FormInput label="Account Number" name="accountNumber" value={dhobiForm.bankDetails.accountNumber} onChange={handleBankFieldChange} required />
              <FormInput label="IFSC Code" name="ifscCode" value={dhobiForm.bankDetails.ifscCode} onChange={handleBankFieldChange} required />
              <FormInput label="Branch Name" name="branchName" value={dhobiForm.bankDetails.branchName} onChange={handleBankFieldChange} required />
              <div className="mb-4">
                <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-2">
                  Account Type
                </label>
                <select
                  id="accountType"
                  name="accountType"
                  value={dhobiForm.bankDetails.accountType}
                  onChange={handleBankFieldChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </SectionCard>

        

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleUserSubmit} className="space-y-6">
          <SectionCard
            title="Profile Information"
            icon={<User size={18} />}
            subtitle="Customer and admin profiles can be updated here. Password remains hidden."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput label="Name" name="name" value={userForm.name} onChange={handleUserFieldChange} required />
              <FormInput label="Email" name="email" type="email" value={userForm.email} onChange={handleUserFieldChange} required />
              <FormInput label="Mobile" name="mobile" value={userForm.mobile} onChange={handleUserFieldChange} required />
              <FormInput label="Profile Picture URL" name="profilePicture" value={userForm.profilePicture} onChange={handleUserFieldChange} />
            </div>
            <FormTextarea label="Service Areas / Address Notes" name="serviceAreas" value={userForm.serviceAreas} onChange={handleUserFieldChange} rows={3} />
          </SectionCard>

          {/* <SectionCard
            title="Location"
            icon={<MapPin size={18} />}
            subtitle="Optional coordinates for your profile."
          >
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                label="Latitude"
                name="latitude"
                type="number"
                value={userForm.location.latitude}
                onChange={(event) => handleLocationChange("user", "latitude", event.target.value)}
              />
              <FormInput
                label="Longitude"
                name="longitude"
                type="number"
                value={userForm.location.longitude}
                onChange={(event) => handleLocationChange("user", "longitude", event.target.value)}
              />
            </div>
          </SectionCard> */}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
            >
              <Save size={18} />
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ProfilePage;
