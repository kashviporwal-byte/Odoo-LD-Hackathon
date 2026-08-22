import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get('/trips');
        setTrips(response.data.data);
      } catch (err) {
        console.error('Failed to fetch dashboard trips info', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Widget */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8 flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}!</h1>
          <p className="text-gray-500">Ready to plan your next wanderlust adventure?</p>
        </div>
        <Link
          to="/trips/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
        >
          Plan New Trip
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trips Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center border-b pb-3">
            <h2 className="text-lg font-bold text-gray-900">Recent Trips</h2>
            <Link to="/trips" className="text-sm font-semibold text-primary-600 hover:text-primary-500">
              View All
            </Link>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading trips...</p>
          ) : trips.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-dashed border-gray-300 text-center">
              <p className="text-gray-500 mb-4">No trips planned yet.</p>
              <Link to="/trips/create" className="text-sm font-bold text-primary-600 hover:text-primary-500">
                Create your first trip now &rarr;
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <div key={trip.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
                  <div className="h-32 bg-gray-200 relative">
                    <img 
                      src={trip.cover_photo_url} 
                      alt={trip.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900">{trip.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {trip.start_date} to {trip.end_date}
                    </p>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-xs font-semibold bg-sky-50 text-sky-700 px-2 py-0.5 rounded">
                        {trip.destination_count || 0} stops
                      </span>
                      <Link to={`/trips/${trip.id}`} className="text-xs font-bold text-primary-600 hover:text-primary-500">
                        View Itinerary &rarr;
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info widgets Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Popular Destinations</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=80" alt="Paris" className="w-full h-full object-cover"/>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Paris, France</h4>
                  <p className="text-xs text-gray-500">Popularity: ⭐⭐⭐⭐⭐</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=80" alt="Tokyo" className="w-full h-full object-cover"/>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Tokyo, Japan</h4>
                  <p className="text-xs text-gray-500">Popularity: ⭐⭐⭐⭐⭐</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-2">Budget Highlight</h3>
            <p className="text-sm text-gray-500">Keep track of expenditures across all transportation, meals, stays, and tour events.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
