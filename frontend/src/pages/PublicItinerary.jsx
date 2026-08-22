import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TripMap from '../components/TripMap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PublicItinerary = () => {
  const { token } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        const res = await api.get(`/sharing/public/${token}`);
        setTripData(res.data.data);
      } catch (err) {
        console.error('Failed to get public itinerary link details', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicData();
  }, [token]);

  const handleCopyTrip = async () => {
    if (!isAuthenticated) {
      alert('Please log in first to copy this trip to your account!');
      return navigate('/login');
    }

    try {
      await api.post(`/sharing/public/${token}/copy`);
      alert('Trip successfully cloned into your account! Redirecting to Dashboard...');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to clone trip.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading public travel path...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-semibold text-gray-400 block uppercase">Shared Itinerary View</span>
          <h1 className="text-2xl font-bold text-gray-900">Adventure path</h1>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleCopyTrip}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
          >
            Copy Trip to My Account
          </button>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-3 font-medium">Route Preview</h2>
        {tripData?.itinerary?.route ? (
          <TripMap route={tripData.itinerary.route} />
        ) : (
          <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center text-gray-400">Map Loading Coordinates...</div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Read-Only Day Schedule</h2>
        <p className="text-sm text-gray-500">Interactive maps and locations view.</p>
      </div>
    </div>
  );
};

export default PublicItinerary;
