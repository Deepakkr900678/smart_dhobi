
import React , {useState} from "react"
import { getAllDhobis } from "./ApiConnect";
const useNearbyVendors = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMeta, setSearchMeta] = useState({
    mode: null,
    nearbyCount: 0,
    cityCount: 0,
    city: "",
  });

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  };

  const searchNearbyVendors = async (userLocation, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const { radius = 5000, searchType = "nearby", city = "" } = options;
      const mockDhobis = await getAllDhobis();

      const userLat = userLocation.coordinates[1];
      const userLng = userLocation.coordinates[0];
      const radiusInKm = radius / 1000;
      const normalizedCity = city.trim().toLowerCase();
      const activeDhobis = mockDhobis
        .filter(dhobi => dhobi.isActive && dhobi.isApproved === 'approved')
        .map(dhobi => {
          const distance = calculateDistance(
            userLat, userLng,
            dhobi.location.coordinates[1], dhobi.location.coordinates[0]
          );
          return { ...dhobi, distance: parseFloat(distance.toFixed(1)) };
        })
        .sort((a, b) => a.distance - b.distance);

      const nearbyVendors = activeDhobis.filter(dhobi => dhobi.distance <= radiusInKm);
      const cityVendors = normalizedCity
        ? activeDhobis.filter((dhobi) =>
            dhobi.serviceAreas?.toLowerCase().includes(normalizedCity)
          )
        : activeDhobis;

      if (searchType === "city") {
        setVendors(cityVendors);
        setSearchMeta({
          mode: "city",
          nearbyCount: nearbyVendors.length,
          cityCount: cityVendors.length,
          city,
        });
      } else if (nearbyVendors.length > 0) {
        setVendors(nearbyVendors);
        setSearchMeta({
          mode: "nearby",
          nearbyCount: nearbyVendors.length,
          cityCount: cityVendors.length,
          city,
        });
      } else {
        setVendors(cityVendors);
        setSearchMeta({
          mode: "city-fallback",
          nearbyCount: 0,
          cityCount: cityVendors.length,
          city,
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { vendors, loading, error, searchNearbyVendors, searchMeta };
};

export default useNearbyVendors;
