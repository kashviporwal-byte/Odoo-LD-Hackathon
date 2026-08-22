import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CitySearch = () => {
  const [searchParams] = useSearchParams();
  const tripId = searchParams.get('tripId');
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCities = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/cities?search=${query}`);
      setCities(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleAddStop = async (cityId) => {
    if (!tripId) {
      return alert('No active Trip ID context found. Create a trip first.');
    }

    try {
      await api.post(`/trips/${tripId}/stops`, {
        city_id: cityId,
        order_index: 0 // Mock default order index
      });
      alert('City added to your trip stops!');
      navigate(`/trips/${tripId}`);
    } catch (err) {
      alert('Failed to add city stop to trip.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Search Destinations</h1>

      {/* Search Input bar */}
      <div className="flex gap-2 max-w-lg mb-8">
        <input
          type="text"
          placeholder="Search by city name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        <button
          onClick={fetchCities}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Searching destinations...</p>
      ) : cities.length === 0 ? (
        <p className="text-gray-500">No destinations found matching query.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cities.map((city) => (
            <div key={city.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-32 bg-gray-100 overflow-hidden relative">
                  <img src={city.image_url} alt={city.name} className="w-full h-full object-cover"/>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 text-lg">{city.name}</h3>
                  <p className="text-xs text-gray-500">{city.country} ({city.region})</p>
                  <div className="mt-3 flex gap-2">
                    <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      Cost: {'$'.repeat(city.cost_index)}
                    </span>
                    <span className="text-xs font-semibold bg-orange-50 text-orange-700 px-2 py-0.5 rounded">
                      ⭐ {city.popularity}/5
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={() => handleAddStop(city.id)}
                  className="w-full inline-flex justify-center items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add to Trip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CitySearch;
