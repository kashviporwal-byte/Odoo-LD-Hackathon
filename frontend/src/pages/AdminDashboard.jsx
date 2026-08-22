import React, { useState, useEffect } from 'react';
import api from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalTrips: 0, totalUsers: 0, tripsTrend: [] });
  const [users, setUsers] = useState([]);
  const [topCities, setTopCities] = useState([]);
  const [topActivities, setTopActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminMetrics = async () => {
    try {
      const [statsRes, usersRes, citiesRes, activitiesRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users'),
        api.get('/admin/top-cities'),
        api.get('/admin/top-activities')
      ]);
      setStats(statsRes.data.data);
      setUsers(usersRes.data.data);
      setTopCities(citiesRes.data.data);
      setTopActivities(activitiesRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminMetrics();
  }, []);

  const handleToggleUserStatus = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}`);
      await fetchAdminMetrics();
      alert('User authorization role toggled successfully.');
    } catch (err) {
      alert('Failed to update user status.');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin operations panel...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Analytics Dashboard</h1>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Total Trips</span>
          <span className="text-3xl font-extrabold text-gray-900">{stats.totalTrips}</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Total Users</span>
          <span className="text-3xl font-extrabold text-gray-900">{stats.totalUsers}</span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Top City Check-ins</span>
          <span className="text-md font-bold text-gray-900 truncate">
            {topCities[0]?.city || 'None'} ({topCities[0]?.count || 0})
          </span>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-400 block uppercase">Top booked Event</span>
          <span className="text-md font-bold text-gray-900 truncate">
            {topActivities[0]?.name || 'None'} ({topActivities[0]?.count || 0})
          </span>
        </div>
      </div>

      {/* Analytics Visual Section (Wireframe Charts Mockups using clean SVGs) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Trend line graph */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4">Trip Creation Velocity</h3>
          <div className="h-64 flex items-end justify-between border-b border-l p-4 relative">
            {/* Draw a line using simple inline SVG */}
            <svg className="absolute inset-0 w-full h-full p-4" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path 
                d="M 5,90 Q 25,60 50,40 T 95,10" 
                fill="none" 
                stroke="#0ea5e9" 
                strokeWidth="2"
              />
              <circle cx="5" cy="90" r="2" fill="#0284c7" />
              <circle cx="50" cy="40" r="2" fill="#0284c7" />
              <circle cx="95" cy="10" r="2" fill="#0284c7" />
            </svg>
            <span className="text-xs text-gray-400 absolute bottom-1 left-2">Start</span>
            <span className="text-xs text-gray-400 absolute bottom-1 right-2">Latest</span>
          </div>
        </div>

        {/* Top items breakdown progress bar list */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Top Cities</h3>
            <div className="space-y-2">
              {topCities.map((city, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium">{city.city}</span>
                  <span className="text-xs font-bold text-gray-400">{city.count} hits</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-3">Top Activities</h3>
            <div className="space-y-2">
              {topActivities.map((act, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="text-gray-700 font-medium truncate max-w-[150px]">{act.name}</span>
                  <span className="text-xs font-bold text-gray-400">{act.count} times</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users table list */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">User Engagement Metrics</h2>
        </div>
        {users.length === 0 ? (
          <p className="p-6 text-sm text-gray-500 text-center">No registered users in the database.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trips Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-semibold">{u.name}</div>
                        <div className="text-xs text-gray-400">{u.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-red-50 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.tripsCount || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleToggleUserStatus(u.id)}
                        className="text-xs font-bold text-primary-600 hover:text-primary-800"
                      >
                        Toggle Admin Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
