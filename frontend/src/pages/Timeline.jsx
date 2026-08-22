import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

const Timeline = () => {
  const { tripId } = useParams();
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const res = await api.get(`/trips/${tripId}/calendar`);
        setCalendarEvents(res.data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [tripId]);

  // Mock day shift change to simulate drag events
  const handleShiftDayMock = async (activityId) => {
    try {
      await api.patch(`/trips/${tripId}/activities/${activityId}`, {
        day_number: 2,
        time_slot: 'afternoon'
      });
      alert('Mock: Activity schedule updated on server.');
    } catch (err) {
      alert('Failed to modify activity schedule.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Calendar Timeline</h1>
        <Link to={`/trips/${tripId}`} className="text-sm font-semibold text-primary-600 hover:text-primary-500">
          &larr; Back to itinerary
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading timeline...</p>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Scheduled Events</h2>
          {calendarEvents.length === 0 ? (
            <p className="text-gray-500">No scheduled events found.</p>
          ) : (
            <div className="space-y-3">
              {calendarEvents.map((evt) => (
                <div key={evt.id} className="p-4 rounded border border-gray-100 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{evt.title}</h3>
                    <p className="text-xs text-gray-500">Starts: {evt.start}</p>
                    <span className="text-xs font-semibold text-primary-700">${evt.cost}</span>
                  </div>
                  <button
                    onClick={() => handleShiftDayMock(evt.id)}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Reschedule (Mock Drag Shift)
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Timeline;
