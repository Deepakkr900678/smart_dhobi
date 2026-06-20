import React , {useState} from "react"
import useGetLocation from "../../auth/getLocation";
import useNearbyVendors from "../../auth/useNearbyVendors";
import { MapPin, Search, Target, Star, Phone, CheckCircle, Users, ShoppingBag } from 'lucide-react';
import StatsCard from "../../components/basicComponent/StatsCard";
import VendorCard from "../../components/customerComponent/VendorCard";
import LocationSearchBar from "../../components/LocationSearchBar";

function CustomerDasboard() {
  const [formData, setFormData] = useState({
    serviceAreas: '',
    location: null,
    city: '',
  });
  const [errors, setErrors] = useState({});
  
  const { getGeolocation, isLoadingLocation, locationStatus } = useGetLocation(setFormData, setErrors);
  const { vendors, loading, error, searchNearbyVendors, searchMeta } = useNearbyVendors();

  const handleLocationSearch = async ({ radius, searchType }) => {
    if (formData.location) {
      await searchNearbyVendors(formData.location, {
        radius,
        searchType,
        city: formData.city,
      });
    } else {
      alert('Please get your current location first');
    }
  };

  const handleGetCurrentLocation = async ({ radius, searchType }) => {
    try {
      const locationData = await getGeolocation();
      await searchNearbyVendors(locationData.location, {
        radius,
        searchType,
        city: locationData.city,
      });
    } catch (err) {
      console.error("Location search failed:", err);
    }
  };

  const stats = [
    { title: 'Available Dhobis', value: vendors.length.toString(), subtitle: 'In your area', icon: <Users size={24} />, color: 'blue' },
    { title: 'Average Rating', value: vendors.length > 0 ? (vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length).toFixed(1) : '0', subtitle: 'Based on reviews', icon: <Star size={24} />, color: 'orange' },
    { title: 'Nearest Dhobi', value: vendors.length > 0 ? `${vendors[0].distance}km` : 'N/A', subtitle: vendors.length > 0 ? vendors[0].name : 'Search first', icon: <MapPin size={24} />, color: 'purple' },
    { title: 'Total Orders', value: vendors.reduce((sum, v) => sum + v.ordersCompleted, 0).toString(), subtitle: 'All vendors', icon: <ShoppingBag size={24} />, color: 'green' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 ">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Find Nearby Dhobis</h1>
          <p className="text-gray-600 mt-1">Discover and book laundry services using precise location coordinates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Location Search */}
        <LocationSearchBar
          onLocationSearch={handleLocationSearch}
          onGetCurrentLocation={handleGetCurrentLocation}
          isLoadingLocation={isLoadingLocation}
        />

        {/* Location Status */}
        {locationStatus && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">{locationStatus}</p>
            {formData.location && (
              <p className="text-blue-600 text-xs mt-1">
                Location: {formData.serviceAreas}
              </p>
            )}
          </div>
        )}

        {!loading && searchMeta.mode === "city-fallback" && vendors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm">
              No dhobis found nearby, so showing all available dhobis in {searchMeta.city || "your city"}.
            </p>
          </div>
        )}

        {!loading && searchMeta.mode === "city" && formData.city && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              Showing available dhobis across {formData.city}.
            </p>
          </div>
        )}

        {/* Error Display */}
        {(error || errors.location) && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error || errors.location}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 mt-2">Finding nearby dhobis using coordinates...</p>
          </div>
        )}

        {/* Vendors Grid */}
        {vendors.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Available Dhobis ({vendors.length}) - Sorted by Distance
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendors.map((vendor) => (
                <VendorCard key={vendor._id} vendor={vendor} />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && vendors.length === 0 && formData.location && (
          <div className="text-center py-12">
            <MapPin size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No dhobis found</h3>
            <p className="text-gray-600">Try expanding your search radius or use the whole city search.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomerDasboard;
