import React from 'react';
import { MapPin, Navigation } from 'lucide-react';
import useGetLocation from '../../auth/getLocation';

const TIME_SLOTS = [
  { label: 'Morning', sub: '7 – 9 AM',  value: '07:00' },
  { label: 'Noon',    sub: '12 – 2 PM', value: '12:00' },
  { label: 'Evening', sub: '5 – 7 PM',  value: '17:00' },
];

const TimeSlotPicker = ({ label, value, onChange }) => (
  <div className="mt-4">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">{label}</p>
    <div className="grid grid-cols-3 gap-2">
      {TIME_SLOTS.map((slot) => (
        <button
          key={slot.value}
          type="button"
          onClick={() => onChange(slot.value)}
          className={`py-2 px-1 rounded-lg border text-center transition-colors ${
            value === slot.value
              ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
              : 'border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50'
          }`}
        >
          <span className="block text-xs font-semibold">{slot.label}</span>
          <span className="block text-[11px] text-gray-400 mt-0.5">{slot.sub}</span>
        </button>
      ))}
    </div>
  </div>
);

const AddressForm = ({
  pickupAddress,  setPickupAddress,
  deliveryAddress, setDeliveryAddress,
  pickupTime,  setPickupTime,
  deliveryTime, setDeliveryTime,
  formData, setFormData,
  errors, setErrors
}) => {

  const handlePickupLocationData = (locationData) => {
    setFormData(prev => ({ ...prev, pickupLocation: locationData.location }));
    setPickupAddress(locationData.serviceAreas);
  };

  const handleDeliveryLocationData = (locationData) => {
    setFormData(prev => ({ ...prev, deliveryLocation: locationData.location }));
    setDeliveryAddress(locationData.serviceAreas);
  };

  const setPickupFormData   = (fn) => handlePickupLocationData(fn({}));
  const setDeliveryFormData = (fn) => handleDeliveryLocationData(fn({}));

  const { getGeolocation: getPickupLocation,   isLoadingLocation: loadingPickup,   locationStatus: pickupStatus }   = useGetLocation(setPickupFormData,   setErrors);
  const { getGeolocation: getDeliveryLocation, isLoadingLocation: loadingDelivery, locationStatus: deliveryStatus } = useGetLocation(setDeliveryFormData, setErrors);

  const statusColor = (msg) => {
    if (!msg) return '';
    if (msg.includes('successfully'))                             return 'text-green-600';
    if (msg.includes('Failed') || msg.includes('denied'))        return 'text-red-500';
    return 'text-blue-600';
  };

  const AddressBlock = ({
    title, addressValue, onAddressChange,
    onLocationClick, loading, status,
    errorKey, timeValue, onTimeChange,
  }) => (
    <div className="space-y-1">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">{title} <span className="text-red-400">*</span></label>
        <button
          type="button"
          onClick={onLocationClick}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Navigation size={12} />
          {loading ? 'Locating…' : 'Use current'}
        </button>
      </div>

      <textarea
        value={addressValue}
        onChange={onAddressChange}
        rows={3}
        placeholder={`Enter ${title.toLowerCase()}…`}
        className="w-full text-sm p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent placeholder-gray-300"
      />

      {status && <p className={`text-xs ${statusColor(status)}`}>{status}</p>}
      {errors?.[errorKey] && <p className="text-xs text-red-500">{errors[errorKey]}</p>}

      <TimeSlotPicker
        label={`Preferred ${title} time`}
        value={timeValue}
        onChange={onTimeChange}
      />
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-4">
      <div className="flex items-center gap-2 mb-5">
        <MapPin size={16} className="text-indigo-600" />
        <h2 className="text-base font-semibold text-gray-900">Pickup &amp; Delivery</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <AddressBlock
          title="Pickup address"
          addressValue={pickupAddress}
          onAddressChange={(e) => { setPickupAddress(e.target.value); setFormData(p => ({ ...p, pickupLocation: null })); }}
          onLocationClick={getPickupLocation}
          loading={loadingPickup}
          status={pickupStatus}
          errorKey="pickupAddress"
          timeValue={pickupTime}
          onTimeChange={setPickupTime}
        />

        <AddressBlock
          title="Delivery address"
          addressValue={deliveryAddress}
          onAddressChange={(e) => { setDeliveryAddress(e.target.value); setFormData(p => ({ ...p, deliveryLocation: null })); }}
          onLocationClick={getDeliveryLocation}
          loading={loadingDelivery}
          status={deliveryStatus}
          errorKey="deliveryAddress"
          timeValue={deliveryTime}
          onTimeChange={setDeliveryTime}
        />
      </div>
    </div>
  );
};

export default AddressForm;