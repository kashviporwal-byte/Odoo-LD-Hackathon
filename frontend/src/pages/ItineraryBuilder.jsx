import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const ItineraryBuilder = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const [tripRes, itineraryRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/itinerary`)
        ]);
        setTrip(tripRes.data.data.trip);
        // Mapping stops from itinerary routes payload
        setStops(itineraryRes.data.data.route || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTripData();
  }, [tripId]);

  const handleRemoveStop = async (stopId) => {
    if (!window.confirm('Remove this stop from your itinerary?')) return;
    try {
      await api.delete(`/trips/${tripId}/stops/${stopId}`);
      // Refresh list
      setStops(stops.filter(s => s.id !== stopId));
    } catch (err) {
      alert('Failed to remove stop.');
    }
  };

  // Mock ordering simulation trigger
  const handleReorderMock = async () => {
    try {
      await api.patch(`/trips/${tripId}/stops/reorder`, {
        stops: stops.map((s, idx) => ({ id: s.id || idx, order_index: idx }))
      });
      alert('Mock stop order index updated successfully.');
    } catch (err) {
      alert('Failed to reorder stops.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading trip itinerary...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4 mb-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Itinerary Builder</span>
          <h1 className="text-2xl font-bold text-gray-900">{trip?.name}</h1>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/trips/${tripId}/view`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Preview Itinerary
          </Link>
          <Link
            to={`/cities?tripId=${tripId}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            + Add Stop
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stops List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Your Route Stops</h2>
            {stops.length > 1 && (
              <button
                onClick={handleReorderMock}
                className="text-xs font-bold text-primary-600 hover:text-primary-500"
              >
                Save Order (Mock Trigger)
              </button>
            )}
          </div>

          {stops.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-dashed text-center">
              <p className="text-gray-500 mb-4">No stops added to this trip yet.</p>
              <Link
                to={`/cities?tripId=${tripId}`}
                className="text-sm font-bold text-primary-600 hover:text-primary-500"
              >
                Search cities to add &rarr;
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stops.map((stop, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900">{stop.cityName}</h3>
                      <p className="text-xs text-gray-500">Coordinates: {stop.lat}, {stop.lng}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      to={`/activities?cityId=${stop.city_id || 1}&stopId=${stop.id || 1}&tripId=${tripId}`}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-primary-700 bg-primary-50 hover:bg-primary-100"
                    >
                      Add Activities
                    </Link>
                    <button
                      onClick={() => handleRemoveStop(stop.id || 1)}
                      className="text-xs font-bold text-red-600 hover:text-red-500 px-2"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar settings shortcut links */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Quick Navigation</h3>
            <ul className="space-y-2 text-sm text-primary-600 font-medium">
              <li><Link to={`/trips/${tripId}/budget`}>💰 View Trip Budgets</Link></li>
              <li><Link to={`/trips/${tripId}/timeline`}>📅 Calendar Timeline</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryBuilder;
