'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Calendar, FileText, Image as ImageIcon,
  ArrowLeft, ArrowRight, Check, Loader2, Globe,
} from 'lucide-react';
import { useItineraryStore } from '@/store/useItineraryStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useGlobeStore } from '@/store/useGlobeStore';
import { generateItineraryForNewTrip } from '@/lib/itineraryGenerator';

const coverOptions = [
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&q=80',
  'https://images.unsplash.com/photo-1488085061387-422e29b40080?w=800&q=80',
  'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=800&q=80',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80',
  'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80',
];

const steps = [
  { id: 0, label: 'Trip Details', icon: FileText },
  { id: 1, label: 'Dates & Budget', icon: Calendar },
  { id: 2, label: 'Cover Photo', icon: ImageIcon },
  { id: 3, label: 'Confirm', icon: Check },
];

const DestinationGlobe = dynamic(() => import('@/components/trips/DestinationGlobe'), {
  ssr: false,
  loading: () => (
    <div className="w-[350px] h-[350px] sm:w-[500px] sm:h-[500px] rounded-full bg-black/[0.02] border border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)] flex items-center justify-center animate-pulse">
      <Globe className="w-12 h-12 text-amber-600/40 animate-[spin_4s_linear_infinite]" />
    </div>
  ),
});

export default function NewTripPage() {
  const router = useRouter();
  const { addTrip } = useItineraryStore();
  const { user } = useAuthStore();
  const openGlobe = useGlobeStore((s) => s.openGlobe);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showGlobe, setShowGlobe] = useState(false);
  const [globeCoords, setGlobeCoords] = useState({ lat: 48.8566, lng: 2.3522 });

  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: 2000,
    coverPhoto: coverOptions[0],
    isPublic: true,
  });

  const update = (k: string, v: string | number | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.startDate && form.endDate && form.budget > 0;
    return true;
  };

  const handleCreate = async () => {
    setLoading(true);

    let lat = 48.8566;
    let lng = 2.3522;
    const search = form.name.toLowerCase();

    if (search.includes('tokyo') || search.includes('japan')) {
      lat = 35.6762; lng = 139.6503;
    } else if (search.includes('york')) {
      lat = 40.7128; lng = -74.0060;
    } else if (search.includes('london')) {
      lat = 51.5074; lng = -0.1278;
    } else if (search.includes('sydney')) {
      lat = -33.8688; lng = 151.2093;
    } else if (search.includes('rome') || search.includes('italy')) {
      lat = 41.9028; lng = 12.4964;
    } else if (search.includes('bali')) {
      lat = -8.4095; lng = 115.1889;
    }

    setGlobeCoords({ lat, lng });
    setShowGlobe(true);

    // Automatically generate full structured itinerary with stops and activities
    const newTrip = generateItineraryForNewTrip({
      name: form.name,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      budget: form.budget,
      coverPhoto: form.coverPhoto,
      userId: user?.id,
      isPublic: form.isPublic,
    });

    addTrip(newTrip);
    openGlobe(lat, lng, form.name);

    setTimeout(() => {
      router.push(`/trips/${newTrip.id}`);
    }, 4000);
  };

  return (
    <div className="page-wrapper min-h-full flex items-start justify-center p-4 lg:p-10">
      <AnimatePresence mode="wait">
        {showGlobe ? (
          <motion.div
            key="globe-view"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-10 w-full max-w-3xl"
          >
            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-3xl font-bold text-slate-900 mb-10 text-center"
            >
              Preparing your journey to <br />
              <span className="text-amber-600">{form.name}</span>...
            </motion.h2>
            <DestinationGlobe destination={globeCoords} />
          </motion.div>
        ) : (
          <motion.div
            key="form-view"
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-2xl"
          >
        <div className="flex items-center gap-3 mb-8">
          <Link href="/trips" className="btn-ghost px-3 py-2 text-sm">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display text-2xl font-bold">Create New Trip</h1>
            <p className="text-slate-500 text-sm">Plan your perfect adventure</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 ${i <= step ? 'opacity-100' : 'opacity-40'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${i < step ? 'bg-amber-500 text-[#ffffff]' : i === step ? 'bg-amber-500/10 border-2 border-amber-500 text-amber-600' : 'bg-black/[0.04] text-slate-500'}`}>
                  {i < step ? <Check className="w-4 h-4" /> : <s.icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${i === step ? 'text-amber-600' : 'text-slate-500'}`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px ${i < step ? 'bg-amber-500/40' : 'bg-black/[0.04]'}`} />}
            </div>
          ))}
        </div>

        <div className="glass rounded-2xl p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1.5">Trip Name *</label>
                    <input className="gt-input" placeholder="e.g. Japan Highlights 2025" value={form.name} onChange={(e) => update('name', e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1.5">Description</label>
                    <textarea
                      className="gt-input min-h-[100px] resize-none"
                      placeholder="Describe your trip..."
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 glass-light rounded-xl">
                    <div>
                      <p className="text-sm font-medium">Make trip public</p>
                      <p className="text-xs text-slate-500">Others can find and copy this trip</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => update('isPublic', !form.isPublic)}
                      className={`w-12 h-6 rounded-full transition-all duration-200 ${form.isPublic ? 'bg-amber-500' : 'bg-black/5'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white shadow transition-all duration-200 ${form.isPublic ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}

              {step === 1 && (() => {
                const todayStr = new Date().toISOString().split('T')[0];
                return (
                <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-1.5">Start Date *</label>
                          <input
                            type="date"
                            className="gt-input"
                            value={form.startDate}
                            min={todayStr}
                            onChange={(e) => {
                              update('startDate', e.target.value);
                              // Reset end date if it becomes invalid
                              if (form.endDate && form.endDate < e.target.value) {
                                update('endDate', '');
                              }
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-500 mb-1.5">End Date *</label>
                          <input
                            type="date"
                            className="gt-input"
                            value={form.endDate}
                            min={form.startDate || todayStr}
                            onChange={(e) => update('endDate', e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-500 mb-1.5">Total Budget (USD) *</label>
                        <input
                          type="number"
                          className="gt-input"
                          placeholder="2000"
                          value={form.budget}
                          onChange={(e) => update('budget', Number(e.target.value))}
                          min={0}
                        />
                        <p className="text-xs text-slate-500 mt-1.5">Enter your estimated total trip budget</p>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[500, 1500, 3000, 5000, 8000, 15000].map((b) => (
                          <button
                            key={b}
                            onClick={() => update('budget', b)}
                            className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${form.budget === b ? 'bg-amber-500 text-[#ffffff]' : 'glass-light text-slate-500 hover:text-gt-text'}`}
                          >
                            ${b.toLocaleString()}
                          </button>
                        ))}
                      </div>
                    </div>
                    );
                  })()}

                  {step === 2 && (
                    <div className="space-y-5">
                      <p className="text-sm text-slate-500">Choose a cover photo for your trip</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {coverOptions.map((url) => (
                          <button
                            key={url}
                            onClick={() => update('coverPhoto', url)}
                            className={`relative h-28 rounded-xl overflow-hidden transition-all ${form.coverPhoto === url ? 'ring-2 ring-amber-500' : 'opacity-70 hover:opacity-100'}`}
                          >
                            <img src={url} alt="Cover" className="w-full h-full object-cover" />
                            {form.coverPhoto === url && (
                              <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                                <Check className="w-6 h-6 text-amber-600" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="space-y-5">
                      <div className="relative h-48 rounded-xl overflow-hidden">
                        <img src={form.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                        <div className="img-overlay" />
                        <div className="absolute bottom-4 left-4">
                          <h2 className="font-display text-2xl font-bold text-slate-900">{form.name}</h2>
                          {form.description && <p className="text-slate-600 text-sm mt-0.5 line-clamp-2">{form.description}</p>}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Start Date', value: form.startDate || 'Not set' },
                          { label: 'End Date', value: form.endDate || 'Not set' },
                          { label: 'Budget', value: `$${form.budget.toLocaleString()}` },
                          { label: 'Visibility', value: form.isPublic ? 'Public' : 'Private' },
                        ].map(({ label, value }) => (
                          <div key={label} className="glass-light p-3 rounded-xl">
                            <p className="text-xs text-slate-500">{label}</p>
                            <p className="font-semibold mt-0.5">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn-ghost"
                disabled={step === 0}
                style={{ opacity: step === 0 ? 0.4 : 1 }}
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep((s) => s + 1)}
                  className="btn-primary"
                  disabled={!canNext()}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleCreate} className="btn-primary" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm Trip</>}
                </button>
>>>>>>> 14234b1 (feat: complete Google OAuth integration, day-wise timeline itinerary, server actions auth, and expanded multi-day activities)
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1.5">Start Date *</label>
                      <input type="date" className="gt-input" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-500 mb-1.5">End Date *</label>
                      <input type="date" className="gt-input" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1.5">Total Budget (USD) *</label>
                    <input
                      type="number"
                      className="gt-input"
                      placeholder="2000"
                      value={form.budget}
                      onChange={(e) => update('budget', Number(e.target.value))}
                      min={0}
                    />
                    <p className="text-xs text-slate-500 mt-1.5">Enter your estimated total trip budget</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[500, 1500, 3000, 5000, 8000, 15000].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => update('budget', b)}
                        className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${form.budget === b ? 'bg-amber-500 text-[#ffffff]' : 'glass-light text-slate-500 hover:text-gt-text'}`}
                      >
                        ${b.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <p className="text-sm text-slate-500">Choose a cover photo for your trip</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {coverOptions.map((url) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => update('coverPhoto', url)}
                        className={`relative h-28 rounded-xl overflow-hidden transition-all ${form.coverPhoto === url ? 'ring-2 ring-amber-500' : 'opacity-70 hover:opacity-100'}`}
                      >
                        <img src={url} alt="Cover" className="w-full h-full object-cover" />
                        {form.coverPhoto === url && (
                          <div className="absolute inset-0 bg-amber-500/10 flex items-center justify-center">
                            <Check className="w-6 h-6 text-amber-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-5">
                  <div className="relative h-48 rounded-xl overflow-hidden">
                    <img src={form.coverPhoto} alt="Cover" className="w-full h-full object-cover" />
                    <div className="img-overlay" />
                    <div className="absolute bottom-4 left-4">
                      <h2 className="font-display text-2xl font-bold text-slate-900">{form.name}</h2>
                      {form.description && <p className="text-slate-600 text-sm mt-0.5 line-clamp-2">{form.description}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Start Date', value: form.startDate || 'Not set' },
                      { label: 'End Date', value: form.endDate || 'Not set' },
                      { label: 'Budget', value: `$${form.budget.toLocaleString()}` },
                      { label: 'Visibility', value: form.isPublic ? 'Public' : 'Private' },
                    ].map(({ label, value }) => (
                      <div key={label} className="glass-light p-3 rounded-xl">
                        <p className="text-xs text-slate-500">{label}</p>
                        <p className="font-semibold mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="btn-ghost"
            disabled={step === 0}
            style={{ opacity: step === 0 ? 0.4 : 1 }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="btn-primary"
              disabled={!canNext()}
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button type="button" onClick={handleCreate} className="btn-primary" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> Confirm Trip</>}
            </button>
          )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
