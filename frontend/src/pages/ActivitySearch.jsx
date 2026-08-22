import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

const ActivitySearch = () => {
  const [searchParams] = useSearchParams();
  const cityId = searchParams.get('cityId');
  const stopId = searchParams.get('stopId');
  const tripId = searchParams.get('tripId');
  const navigate = useNavigate();

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const fetchActivities = async () => {
      if (!cityId) return;
      try {
        const res = await api.get(`/activities/cities/${cityId}?type=${filterType}`);
        setActivities(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [cityId, filterType]);

  const handleAddActivity = async (activityId, cost) => {
    if (!stopId) return alert('Invalid Stop context.');

    try {
      await api.post(`/activities/stops/${stopId}`, {
        activity_id: activityId,
        day_number: 1, // Mock default day assignment
        time_slot: 'morning',
        cost: cost
      });
      alert('Activity linked to stop!');
      navigate(`/trips/${tripId}`);
    } catch (err) {
      alert('Failed to link activity.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore Activities</h1>
        <button
          onClick={() => navigate(`/trips/${tripId}`)}
          className="text-sm font-semibold text-gray-500 hover:text-gray-700"
        >
          &larr; Back to itinerary
        </button>
      </div>

      {/* Filter Select Options */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">Category Filter</label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="block w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          <option value="sightseeing">Sightseeing</option>
          <option value="food">Food & Dinings</option>
          <option value="adventure">Adventures</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-gray-500">No activities found matching filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <div key={act.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <div className="h-40 bg-gray-100 overflow-hidden relative">
                  <img src={act.image_url} alt={act.name} className="w-full h-full object-cover"/>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-gray-900 text-lg">{act.name}</h3>
                    <span className="text-sm font-bold text-gray-900">${act.cost}</span>
                  </div>
                  <span className="inline-block mt-2 text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded uppercase">
                    {act.type}
                  </span>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-3">{act.description}</p>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-between items-center gap-4">
                <span className="text-xs text-gray-400">⏱️ {act.duration} mins</span>
                <button
                  onClick={() => handleAddActivity(act.id, act.cost)}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-semibold rounded text-white bg-primary-600 hover:bg-primary-700"
                >
                  Add to stop
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivitySearch;
