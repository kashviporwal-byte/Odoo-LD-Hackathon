'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  User, Trash2, Camera, Save,
  Heart, MapPin, Settings, Bell, Shield, Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { usersApi } from '@/lib/api';
import { mockCities } from '@/lib/mockData';

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200 ${
        on ? 'bg-amber-500' : 'bg-black/10'
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

export default function ProfilePage() {
  const router = useRouter();
  const { user, settings, updateUser, updateSettings, logout } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'privacy'>('profile');

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email });
    }
  }, [user?.id, user?.name, user?.email]);

  const savedCities = mockCities.filter((c) => user?.savedDestinations.includes(c.id));

  const handleSave = async () => {
    setSaving(true);
    const payload = { name: form.name, email: form.email };

    const res = await usersApi.updateProfile(payload);
    if (res.success && res.data?.user) {
      updateUser({
        name: res.data.user.name ?? form.name,
        email: res.data.user.email ?? form.email,
      });
    } else {
      updateUser({ name: form.name, email: form.email });
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'preferences' as const, label: 'Preferences', icon: Settings },
    { id: 'privacy' as const, label: 'Privacy', icon: Shield },
  ];

  if (!user) return null;

  return (
    <div className="page-wrapper p-4 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-bold">Profile & Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* User Hero Card */}
      <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-amber-500/10 flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-amber-600 font-bold text-3xl">{user.name[0]}</span>
            )}
          </div>
          <button type="button" className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-[#ffffff]">
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1">
          <h2 className="font-display text-xl font-bold">{user.name}</h2>
          <p className="text-slate-500 text-sm">{user.email}</p>
          <div className="flex gap-3 mt-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-amber-600" />{user.tripsCount} trips</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" />{user.savedDestinations.length} saved</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="badge badge-amber text-xs">Member since {new Date(user.joinedAt).getFullYear()}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass-light rounded-xl mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === id ? 'bg-amber-500 text-[#ffffff]' : 'text-slate-500 hover:text-gt-text'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:block">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="glass rounded-2xl p-6 space-y-5"
      >
        {activeTab === 'profile' && (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1.5">Full Name</label>
              <input
                className="gt-input"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1.5">Email Address</label>
              <input
                type="email"
                className="gt-input"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <button type="button" onClick={handleSave} className="btn-primary" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? '✓ Saved!' : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </>
        )}

        {activeTab === 'preferences' && (
          <>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Heart className="w-4 h-4 text-red-400" /> Saved Destinations</h3>
              {savedCities.length === 0 ? (
                <p className="text-slate-500 text-sm">No saved destinations yet. Visit City Search to save cities!</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {savedCities.map((city) => (
                    <div key={city.id} className="relative h-24 rounded-xl overflow-hidden">
                      <img src={city.coverPhoto} alt={city.name} className="w-full h-full object-cover" />
                      <div className="img-overlay" />
                      <div className="absolute bottom-2 left-2">
                        <p className="text-slate-900 text-xs font-bold">{city.name}</p>
                        <p className="text-slate-500 text-xs">{city.country}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="h-px bg-black/[0.04]" />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-600" /> Notifications</h3>
              {[
                { key: 'tripReminders' as const, label: 'Trip reminders', desc: 'Get notified before your trips' },
                { key: 'newFeatures' as const, label: 'New features', desc: 'Updates on new app features' },
                { key: 'budgetAlerts' as const, label: 'Budget alerts', desc: 'Alert when nearing budget limit' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-3 border-b border-black/[0.04] last:border-0">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-slate-500">{item.desc}</p>
                  </div>
                  <Toggle
                    label={item.label}
                    on={settings[item.key]}
                    onChange={(v) => updateSettings({ [item.key]: v })}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'privacy' && (
          <>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-blue-400" /> Data & Privacy</h3>
              <div className="space-y-3">
                {[
                  { key: 'profilePublic' as const, label: 'Make profile public', desc: 'Others can discover your public trips' },
                  { key: 'shareAnalytics' as const, label: 'Share analytics', desc: 'Help improve GlobeTrotter anonymously' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3 glass-light rounded-xl">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.desc}</p>
                    </div>
                    <Toggle
                      label={item.label}
                      on={settings[item.key]}
                      onChange={(v) => updateSettings({ [item.key]: v })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="h-px bg-black/[0.04]" />
            <div>
              <h3 className="font-semibold mb-3 text-red-400 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Danger Zone</h3>
              {!deleteConfirm ? (
                <button type="button" onClick={() => setDeleteConfirm(true)} className="btn-danger">
                  <Trash2 className="w-4 h-4" /> Delete Account
                </button>
              ) : (
                <div className="glass-light p-4 rounded-xl border border-red-500/20">
                  <p className="text-sm text-red-400 mb-3 font-medium">Are you sure? This cannot be undone.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={async () => { await logout(); router.push('/login'); }} className="btn-danger flex-1 justify-center">Yes, Delete</button>
                    <button type="button" onClick={() => setDeleteConfirm(false)} className="btn-ghost flex-1 justify-center">Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
