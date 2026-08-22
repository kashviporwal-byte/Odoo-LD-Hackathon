'use client';

import { useState, Suspense, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Globe, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { loginAction, signupAction, resetPasswordAction, googleLoginAction } from '@/lib/auth-actions';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

type Tab = 'login' | 'signup' | 'reset';

const popularDestinations = [
  'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80',
  'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=600&q=80',
  'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80',
];

// Extend Window type for Google GIS SDK
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: any) => void;
            error_callback?: (error: any) => void;
            prompt?: string;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const { setAuth } = useAuthStore();

  const [tab, setTab] = useState<Tab>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [bgIndex, setBgIndex] = useState(0);
  const [gisReady, setGisReady] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ── Load Google Identity Services script ──────────────────────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    const scriptId = 'google-gis-script';
    if (document.getElementById(scriptId)) {
      if (window.google?.accounts?.oauth2) {
        setGisReady(true);
      }
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGisReady(true);
    };
    script.onerror = () => {
      console.warn('[GIS] Failed to load Google Identity Services script');
    };
    document.head.appendChild(script);
  }, []);

  // ── Trigger Google OAuth popup with Account Selector ──────────────────────
  const handleGoogleLogin = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Client ID is not configured.');
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      setError('Google Sign-In is initializing. Please click again in a moment.');
      return;
    }

    setError('');
    setGoogleLoading(true);

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            setError(tokenResponse.error_description || 'Google sign-in was cancelled.');
            setGoogleLoading(false);
            return;
          }

          try {
            // Fetch live Google profile directly using the OAuth access token
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });

            if (!userInfoRes.ok) {
              throw new Error('Failed to retrieve user profile from Google.');
            }

            const userInfo = await userInfoRes.json();

            const realName =
              userInfo.name ||
              (userInfo.given_name ? `${userInfo.given_name} ${userInfo.family_name || ''}`.trim() : '') ||
              userInfo.email?.split('@')[0]?.replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) ||
              'Traveler';

            // Send real profile to backend server
            const res = await googleLoginAction({
              email: userInfo.email,
              name: realName,
              picture: userInfo.picture,
            });

            if (!res.success) {
              setError(res.error || 'Failed to authenticate user.');
              setGoogleLoading(false);
              return;
            }

            if (res.user) {
              setAuth(
                {
                  id: res.user.id,
                  name: res.user.name || realName,
                  email: res.user.email || userInfo.email,
                  avatarUrl: userInfo.picture,
                  language: res.user.language || 'English',
                  savedDestinations: [],
                  tripsCount: 0,
                  joinedAt: new Date().toISOString(),
                },
                res.token
              );
            }

            router.push(callbackUrl);
          } catch (err: any) {
            console.error('[Google Profile Fetch Error]', err);
            setError('Failed to fetch Google profile details. Please try again.');
          } finally {
            setGoogleLoading(false);
          }
        },
        error_callback: (err: any) => {
          console.error('[Google OAuth Error]', err);
          setError(err?.message || 'Google OAuth encountered an error.');
          setGoogleLoading(false);
        },
      });

      // Forces Google to display the account picker popup (choose account)
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (e: any) {
      console.error('[Google Client Init Error]', e);
      setError('Unable to open Google account selector. Please try again.');
      setGoogleLoading(false);
    }
  };

  // ── Email/Password Submit ─────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

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
        const res = await loginAction({ email, password });
        if (!res.success) { setError(res.error || 'Invalid email or password.'); return; }
        if (res.user) {
          setAuth({
            id: res.user.id, name: res.user.name, email: res.user.email,
            language: res.user.language || 'English', savedDestinations: [],
            tripsCount: 0, joinedAt: new Date().toISOString(),
          }, res.token);
        }
        router.push(callbackUrl);

      } else if (tab === 'signup') {
        const res = await signupAction({ name, email, password });
        if (!res.success) { setError(res.error || 'Email may already be registered.'); return; }
        if (res.user) {
          setAuth({
            id: res.user.id, name: res.user.name, email: res.user.email,
            language: res.user.language || 'English', savedDestinations: [],
            tripsCount: 0, joinedAt: new Date().toISOString(),
          }, res.token);
        }
        router.push(callbackUrl);

      } else if (tab === 'reset') {
        const res = await resetPasswordAction({ email, newPassword: password });
        if (!res.success) { setError(res.error || 'Password reset failed.'); return; }
        setSuccessMsg('Password updated successfully! You can now log in.');
        setTab('login');
      }
    } catch {
      setError('An unexpected error occurred. Please check the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Hero Panel ────────────────────────────────────────────── */}
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
        <div className="absolute inset-0 bg-gradient-to-r from-white/80 via-white/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/70 via-transparent to-transparent" />

        <div className="absolute bottom-8 left-8 flex gap-2">
          {popularDestinations.map((_, i) => (
            <button key={i} onClick={() => setBgIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === bgIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/40'}`}
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
              {[['12K+', 'Travelers'], ['38K+', 'Trips'], ['180+', 'Cities']].map(([n, l]) => (
                <div key={l}>
                  <p className="text-amber-600 font-bold text-lg">{n}</p>
                  <p className="text-slate-500 text-xs">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ───────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-[#FAF9F6]">
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

          <h1 className="font-display text-3xl font-bold mb-1 text-slate-900">
            {tab === 'login' ? 'Welcome back' : tab === 'signup' ? 'Start your journey' : 'Reset Password'}
          </h1>
          <p className="text-slate-500 mb-6 text-sm">
            {tab === 'login' ? 'Sign in to continue planning your adventures'
              : tab === 'signup' ? 'Create your free account today'
              : 'Enter your email and new password'}
          </p>

          {/* ── Google Button ───────────────────────────────────────────── */}
          {tab !== 'reset' && (
            <button
              type="button"
              id="google-signin-btn"
              onClick={handleGoogleLogin}
              disabled={googleLoading || (!!GOOGLE_CLIENT_ID && !gisReady)}
              className="w-full py-3 px-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-sm mb-5 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <>
                  <GoogleIcon />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          )}

          {/* ── Divider ─────────────────────────────────────────────────── */}
          {tab !== 'reset' && (
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#FAF9F6] px-3 text-slate-400 font-medium tracking-wider">
                  or continue with email
                </span>
              </div>
            </div>
          )}

          {/* ── Tab Toggle ──────────────────────────────────────────────── */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-5">
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t ? 'bg-[#EDBF9B] text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t === 'login' ? 'Login' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* ── Success Banner ──────────────────────────────────────────── */}
          {successMsg && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm flex items-start gap-2.5 font-medium mb-4"
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* ── Form ────────────────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              onSubmit={handleSubmit}
              className="space-y-4"
              initial={{ opacity: 0, x: tab === 'login' ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Full Name</label>
                  <input type="text" className="gt-input" placeholder="Your full name"
                    value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
                <input type="email" className="gt-input" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">
                  {tab === 'reset' ? 'New Password' : 'Password'}
                </label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} className="gt-input pr-12"
                    placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {tab === 'signup' && (
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Confirm Password</label>
                  <input type="password" className="gt-input" placeholder="••••••••"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              )}

              {tab === 'login' && (
                <div className="flex justify-end">
                  <button type="button"
                    onClick={() => { setTab('reset'); setError(''); setSuccessMsg(''); }}
                    className="text-sm text-amber-600 hover:text-amber-500 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {tab === 'reset' && (
                <div className="flex justify-end">
                  <button type="button"
                    onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
                    className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    ← Back to Login
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {error && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button type="submit" className="btn-primary w-full justify-center py-3 text-base mt-2" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    {tab === 'login' ? 'Sign In' : tab === 'signup' ? 'Create Account' : 'Update Password'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </motion.form>
          </AnimatePresence>

          <p className="text-center text-slate-500 text-sm mt-6">
            {tab === 'login' ? "Don't have an account? " : tab === 'signup' ? 'Already have an account? ' : 'Remember your password? '}
            <button
              onClick={() => { setTab(tab === 'login' ? 'signup' : 'login'); setError(''); setSuccessMsg(''); }}
              className="text-amber-600 hover:text-amber-500 font-semibold transition-colors"
            >
              {tab === 'login' ? 'Sign up free' : 'Login'}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
