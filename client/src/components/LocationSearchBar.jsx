import React ,{useState} from "react"
import { Search, Target } from 'lucide-react';
const LocationSearchBar = ({ onLocationSearch, onGetCurrentLocation, isLoadingLocation }) => {
  const [searchRadius, setSearchRadius] = useState(5);
  const [searchType, setSearchType] = useState('nearby');

  const handleSearch = () => {
    onLocationSearch({
      radius: searchRadius * 1000,
      searchType,
    });
  };

  const handleCurrentLocation = () => {
    onGetCurrentLocation({
      radius: searchRadius * 1000,
      searchType,
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex  justify-between w-full items-center">
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setSearchType('nearby')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'nearby'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Nearby Search
            </button>
            <button
              onClick={() => setSearchType('city')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                searchType === 'city'
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Whole City
            </button>
          </div>
          <div>

          {searchType === 'nearby' && (
            <div className="flex items-center gap-2 mb-3">
              <label className="text-sm text-gray-600">Search within:</label>
              <select
                value={searchRadius}
                onChange={(e) => setSearchRadius(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value={1}>1 km</option>
                <option value={2}>2 km</option>
                <option value={5}>5 km</option>
                <option value={10}>10 km</option>
                <option value={25}>25 km</option>
              </select>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          onClick={handleCurrentLocation}
          disabled={isLoadingLocation}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          <Target size={16} />
          {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
        </button>
        
        <button
          onClick={handleSearch}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors"
        >
          <Search size={16} />
          Find Dhobis
        </button>
      </div>
    </div>
  );
};



export default LocationSearchBar;
