import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  User, Trash2, Camera, Save,
  Heart, MapPin, Settings, Bell, Shield, Loader2,
} from 'lucide-react';
import api from '../services/api';

function Toggle({ on, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200 focus:outline-none ${
        on ? 'bg-primary-600' : 'bg-gray-200'
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow absolute top-0.5 transition-all duration-200 ${
          on ? 'right-0.5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

const ProfileSettings = () => {
  const { user, logout } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [savedCities, setSavedCities] = useState([]);
  const [tripsCount, setTripsCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Load local settings from localStorage or defaults
  const [settings, setSettings] = useState(() => {
    const savedSet = localStorage.getItem('profile-settings');
    return savedSet ? JSON.parse(savedSet) : {
      tripReminders: true,
      newFeatures: true,
      budgetAlerts: false,
      profilePublic: true,
      shareAnalytics: false,
    };
  });

  const updateSetting = (key, val) => {
    const newSettings = { ...settings, [key]: val };
    setSettings(newSettings);
    localStorage.setItem('profile-settings', JSON.stringify(newSettings));
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }

    const fetchData = async () => {
      try {
        const [citiesRes, tripsRes] = await Promise.all([
          api.get('/users/me/saved-destinations'),
          api.get('/trips')
        ]);
        setSavedCities(citiesRes.data.data || []);
        setTripsCount(tripsRes.data.data ? tripsRes.data.data.length : 0);
      } catch (err) {
        console.error('Failed to load profile resources:', err);
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchData();
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/me', { name, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      alert('Failed to update profile settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      alert('Account deleted successfully.');
      logout();
    } catch (err) {
      alert('Failed to delete account.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account and preferences</p>
      </div>

      {/* User Hero Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center gap-5 shadow-sm">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-primary-50 flex items-center justify-center border border-primary-100">
            {user.photo_url ? (
              <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary-700 font-bold text-3xl">{user.name ? user.name[0].toUpperCase() : 'U'}</span>
            )}
          </div>
          <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary-600 hover:bg-primary-700 flex items-center justify-center text-white shadow-sm transition-colors">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-grow">
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
          <div className="flex gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-primary-600" />
              {loadingInitial ? '...' : tripsCount} trips
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              {loadingInitial ? '...' : savedCities.length} saved
            </span>
          </div>
        </div>
        <div className="hidden sm:block">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
            {user.role ? user.role.toUpperCase() : 'USER'}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-grow flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id ? 'bg-primary-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm min-h-[220px]">
        {activeTab === 'profile' && (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Full Name</label>
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1.5">Email Address</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="block w-full border border-gray-300 rounded-lg shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm text-gray-900"
              />
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  '✓ Saved!'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> Saved Destinations
              </h3>
              {loadingInitial ? (
                <p className="text-gray-500 text-sm">Loading saved cities...</p>
              ) : savedCities.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved destinations yet. Visit City Search to discover and save cities!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {savedCities.map((city) => (
                    <div key={city.id} className="relative h-24 rounded-xl overflow-hidden group shadow-sm border border-gray-100">
                      <img src={city.image_url} alt={city.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2 text-white">
                        <p className="text-xs font-bold truncate">{city.name}</p>
                        <p className="text-[10px] text-gray-200 truncate">{city.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary-600" /> Notifications
              </h3>
              {[
                { key: 'tripReminders', label: 'Trip reminders', desc: 'Get notified before your trips begin' },
                { key: 'newFeatures', label: 'New features', desc: 'Updates on new app improvements' },
                { key: 'budgetAlerts', label: 'Budget alerts', desc: 'Alert when days are nearing budget limits' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle
                    label={item.label}
                    on={settings[item.key]}
                    onChange={(v) => updateSetting(item.key, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-500" /> Data & Privacy
              </h3>
              {[
                { key: 'profilePublic', label: 'Make profile public', desc: 'Allow others to discover your shared trips' },
                { key: 'shareAnalytics', label: 'Share analytics', desc: 'Help improve GlobeTrotter through anonymous usage data' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <Toggle
                    label={item.label}
                    on={settings[item.key]}
                    onChange={(v) => updateSetting(item.key, v)}
                  />
                </div>
              ))}
            </div>

            <div className="h-px bg-gray-100" />

            <div>
              <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Danger Zone
              </h3>
              {!deleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-semibold rounded-lg text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                  Delete Account
                </button>
              ) : (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700 mb-3 font-semibold">Are you absolutely sure? This will permanently delete your account and all itineraries.</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="inline-flex justify-center px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-lg flex-grow shadow-sm transition-colors"
                    >
                      Yes, Delete Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(false)}
                      className="inline-flex justify-center px-4 py-2 text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg flex-grow shadow-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSettings;
