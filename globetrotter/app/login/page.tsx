'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Globe, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import type { Metadata } from 'next';

type Tab = 'login' | 'signup';

const popularDestinations = [
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
];

export default function LoginPage() {
  const router = useRouter();
  const { login, signup } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bgIndex, setBgIndex] = useState(0);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (tab === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await signup(name, email, password);
      }
      router.push('/dashboard');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — Hero Image Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.img
            key={bgIndex}
            src={popularDestinations[bgIndex]}
            alt="Destination"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#ffffff]/80 via-[#ffffff]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#ffffff]/70 via-transparent to-transparent" />

        {/* Dot nav */}
        <div className="absolute bottom-8 left-8 flex gap-2">
          {popularDestinations.map((_, i) => (
            <button
              key={i}
              onClick={() => setBgIndex(i)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i === bgIndex ? 'w-6 bg-amber-400' : 'bg-white/40'}`}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EDBF9B] flex items-center justify-center shadow-md">
              <Globe className="w-5 h-5 text-slate-900" strokeWidth={2.5} />
            </div>
            <span className="font-display text-2xl font-bold text-slate-900">GlobeTrotter</span>
          </div>
          <div>
            <h2 className="font-display text-4xl font-bold text-slate-900 leading-tight mb-4">
              The World<br />Awaits You
            </h2>
            <p className="text-slate-600 text-lg max-w-sm">
              Plan multi-city itineraries, track budgets, and share your adventures — all in one place.
            </p>
            <div className="flex gap-6 mt-8">
              {['12K+ Travelers', '38K+ Trips', '180+ Cities'].map((s) => (
                <div key={s}>
                  <p className="text-amber-600 font-bold text-lg">{s.split('+')[0]}+</p>
                  <p className="text-slate-500 text-xs">{s.split(' ').slice(1).join(' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Logo (mobile) */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#EDBF9B] flex items-center justify-center shadow-md">
              <Globe className="w-4 h-4 text-slate-900" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">GlobeTrotter</span>
          </div>

          <h1 className="font-display text-3xl font-bold mb-2">
            {tab === 'login' ? 'Welcome back' : 'Start your journey'}
          </h1>
          <p className="text-slate-500 mb-8">
            {tab === 'login'
              ? 'Sign in to continue planning your adventures'
              : 'Create your free account today'}
          </p>

          {/* Tab Toggle */}
          <div className="flex gap-1 p-1 glass-light rounded-xl mb-8">
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-[#EDBF9B] text-slate-900 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-gt-text'
                }`}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, x: tab === 'login' ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    className="gt-input"
                    placeholder="Alex Wanderer"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Email</label>
                <input
                  type="email"
                  className="gt-input"
                  placeholder="alex@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-500 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="gt-input pr-12"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-gt-text transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-500 mb-1.5">Confirm Password</label>
                  <input
                    type="password"
                    className="gt-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              {tab === 'login' && (
                <div className="flex justify-end">
                  <button type="button" className="text-sm text-amber-600 hover:text-amber-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base mt-2" disabled={loading}>
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    {tab === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-slate-500 text-sm mt-6">
            {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
              className="text-amber-600 hover:text-amber-300 font-semibold transition-colors"
            >
              {tab === 'login' ? 'Sign up free' : 'Login'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
