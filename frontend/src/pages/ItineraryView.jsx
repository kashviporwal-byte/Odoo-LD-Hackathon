import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import TripMap from '../components/TripMap';
import api from '../services/api';

const ItineraryView = () => {
  const { tripId } = useParams();
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState({ days: [], route: [] });
  const [loading, setLoading] = useState(true);
  const [shareToken, setShareToken] = useState('');

  useEffect(() => {
    const fetchItineraryData = async () => {
      try {
        const [tripRes, itineraryRes] = await Promise.all([
          api.get(`/trips/${tripId}`),
          api.get(`/trips/${tripId}/itinerary`)
        ]);
        setTrip(tripRes.data.data.trip);
        setItinerary(itineraryRes.data.data);
        setShareToken(tripRes.data.data.trip.share_token || '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItineraryData();
  }, [tripId]);

  const handleGenerateShareLink = async () => {
    try {
      const res = await api.post(`/sharing/${tripId}/share`);
      const token = res.data.data.share_token;
      setShareToken(token);
      alert(`Public Share Token Generated: ${token}`);
    } catch (err) {
      alert('Failed to generate share link.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading itinerary view...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4 border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{trip?.name}</h1>
          <p className="text-sm text-gray-500">{trip?.start_date} to {trip?.end_date}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/trips/${tripId}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
          >
            Edit Stops
          </Link>
          <button
            onClick={handleGenerateShareLink}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            {shareToken ? 'Regenerate Share link' : 'Share Trip'}
          </button>
        </div>
      </div>

      {/* Map display */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Route Map</h2>
        <TripMap route={itinerary.route} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Day-Wise Details */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Day-Wise Schedule</h2>
          {itinerary.days.length === 0 ? (
            <p className="text-gray-500">No activities added to your stops yet.</p>
          ) : (
            <div className="space-y-6">
              {itinerary.days.map((day, dIdx) => (
                <div key={dIdx} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h3 className="font-bold text-gray-800">
                      Day {dIdx + 1}: {day.city} ({day.date})
                    </h3>
                  </div>
                  <div className="p-4 divide-y divide-gray-100">
                    {day.activities.map((act) => (
                      <div key={act.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                        <div>
                          <span className="text-xs font-semibold text-gray-400 block">{act.time}</span>
                          <span className="font-semibold text-gray-800">{act.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${act.cost}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {shareToken && (
            <div className="bg-sky-50 border border-sky-100 p-6 rounded-lg">
              <h3 className="font-bold text-sky-950 mb-2">Trip Shareable!</h3>
              <p className="text-xs text-sky-800 mb-4">Anyone with this link can view your itinerary and clone it.</p>
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/public/${shareToken}`}
                className="w-full text-xs p-2 border border-sky-200 rounded bg-white text-gray-700 outline-none"
              />
            </div>
          )}

          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-3">Itinerary Summary</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>📍 Total Cities: {itinerary.route.length}</li>
              <li>📅 Duration: {itinerary.days.length} days</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItineraryView;
