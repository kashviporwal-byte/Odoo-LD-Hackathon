import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const MyTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrips = async () => {
    try {
      const res = await api.get('/trips');
      setTrips(res.data.data);
    } catch (err) {
      console.error('Failed to load trips list', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this trip and all its stops?')) return;
    try {
      await api.delete(`/trips/${id}`);
      setTrips(trips.filter(t => t.id !== id));
    } catch (err) {
      alert('Failed to delete trip.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
        <Link
          to="/trips/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          New Trip
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading trips...</p>
      ) : trips.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-500 text-lg mb-4">No trips added yet.</p>
          <Link
            to="/trips/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded text-white bg-primary-600 hover:bg-primary-700"
          >
            Plan Your First Trip
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="h-40 bg-gray-200 relative">
                  <img src={trip.cover_photo_url} alt={trip.name} className="w-full h-full object-cover"/>
                </div>
                <div className="p-4">
                  <h2 className="text-lg font-bold text-gray-900">{trip.name}</h2>
                  <p className="text-xs text-gray-400 mt-1">{trip.start_date} to {trip.end_date}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{trip.description || 'No description provided.'}</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-between items-center gap-2">
                <Link
                  to={`/trips/${trip.id}`}
                  className="text-xs font-bold text-primary-600 hover:text-primary-500"
                >
                  View Itinerary
                </Link>
                <div className="flex gap-2">
                  <Link
                    to={`/trips/${trip.id}/edit`}
                    className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(trip.id)}
                    className="text-xs font-semibold text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTrips;
