import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [lang, setLang] = useState('en');
  const [savedCities, setSavedCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setLang(user.language_pref || 'en');
    }

    const fetchSavedDestinations = async () => {
      try {
        const res = await api.get('/users/me/saved-destinations');
        setSavedCities(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSavedDestinations();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/users/me', { name, email, language_pref: lang });
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Deleting your account will remove all your trips permanently. This action cannot be undone! Continue?')) return;
    try {
      await api.delete('/users/me');
      alert('Account deleted successfully.');
      logout();
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Profile Form */}
      <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Profile Settings</h1>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
            </select>
          </div>
          <div className="flex justify-between items-center border-t pt-4">
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="text-sm font-semibold text-red-600 hover:text-red-500"
            >
              Delete Account
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Saved Cities */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">Saved Destinations</h2>
        {savedCities.length === 0 ? (
          <p className="text-sm text-gray-500">No saved cities yet.</p>
        ) : (
          <div className="space-y-3">
            {savedCities.map((city) => (
              <div key={city.id} className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                <div className="w-8 h-8 rounded bg-gray-100 overflow-hidden">
                  <img src={city.image_url} alt={city.name} className="w-full h-full object-cover"/>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{city.name}</h4>
                  <p className="text-xs text-gray-500">{city.country}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
