'use server';

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AuthActionResult {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: string;
    language?: string;
  };
  token?: string;
}

export async function loginAction(formData: { email: string; password: string }): Promise<AuthActionResult> {
  const { password } = formData;

  // ── Sanitize: lowercase + strip whitespace before any DB query ──
  const email = formData.email.toLowerCase().trim();

  // Debug: confirm the exact string being sent to the backend
  console.log('[loginAction] Sanitized email being queried:', email);

  if (!email || !password) {
    return { success: false, error: 'Please provide both email and password.' };
  }

  try {
    console.log('[loginAction] POSTing to backend:', `${BACKEND_URL}/auth/login`);
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    console.log('[loginAction] Backend response status:', res.status, '| success:', data?.success);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || 'Invalid email or password.',
      };
    }

    const token = data.data?.token;
    const user = data.data?.user;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('gt_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return {
      success: true,
      user: {
        id: String(user?.id || ''),
        name: user?.name || email.split('@')[0],
        email: user?.email || email,
        role: user?.role || 'traveler',
        language: user?.language || 'English',
      },
      token,
    };
  } catch (err: any) {
    console.error('[loginAction] Network/fetch error:', err?.message);
    return {
      success: false,
      error: 'Unable to connect to the database server. Please ensure the backend is running.',
    };
  }
}

export async function signupAction(formData: { name: string; email: string; password: string }): Promise<AuthActionResult> {
  const { name, password } = formData;

  // ── Sanitize: lowercase + strip whitespace before insert ──
  const email = formData.email.toLowerCase().trim();

  // Debug: confirm the exact string being sent to the backend
  console.log('[signupAction] Sanitized email being registered:', email);

  if (!name || !email || !password) {
    return { success: false, error: 'Please provide your name, email, and password.' };
  }

  if (password.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    console.log('[signupAction] POSTing to backend:', `${BACKEND_URL}/auth/signup`);
    const res = await fetch(`${BACKEND_URL}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.trim(), email, password }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    console.log('[signupAction] Backend response status:', res.status, '| success:', data?.success, '| error:', data?.error);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || 'Signup failed. User may already exist.',
      };
    }

    const token = data.data?.token;
    const user = data.data?.user;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('gt_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    return {
      success: true,
      user: {
        id: String(user?.id || ''),
        name: user?.name || name,
        email: user?.email || email,
        role: user?.role || 'traveler',
        language: user?.language || 'English',
      },
      token,
    };
  } catch (err: any) {
    console.error('[signupAction] Network/fetch error:', err?.message);
    return {
      success: false,
      error: 'Unable to connect to the database server. Please ensure the backend is running.',
    };
  }
}

export async function resetPasswordAction(formData: { email: string; newPassword: string }): Promise<{ success: boolean; message?: string; error?: string }> {
  const { newPassword } = formData;
  const email = formData.email.toLowerCase().trim();

  if (!email || !newPassword) {
    return { success: false, error: 'Please provide email and new password.' };
  }

  if (newPassword.length < 6) {
    return { success: false, error: 'Password must be at least 6 characters long.' };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, newPassword }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || 'Password reset failed.',
      };
    }

    return {
      success: true,
      message: data?.message || 'Password has been reset successfully. You can now login.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Unable to connect to the database server. Please ensure the backend is running.',
    };
  }
}

export async function googleLoginAction(credentialData: { email: string; name?: string; picture?: string } | string): Promise<AuthActionResult> {
  try {
    const payload = typeof credentialData === 'string' ? credentialData : JSON.stringify(credentialData);

    const res = await fetch(`${BACKEND_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ credential: payload }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success) {
      return {
        success: false,
        error: data?.error || data?.message || 'Google authentication failed.',
      };
    }

    const token = data.data?.token;
    const user = data.data?.user;

    if (token) {
      const cookieStore = await cookies();
      cookieStore.set('gt_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/',
      });
    }

    const derivedName = user?.name || (typeof credentialData === 'object' && credentialData.name ? credentialData.name : null) || (user?.email ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Traveler');

    return {
      success: true,
      user: {
        id: String(user?.id || ''),
        name: derivedName,
        email: user?.email || (typeof credentialData === 'object' ? credentialData.email : 'user@gmail.com'),
        role: user?.role || 'traveler',
        language: user?.language || 'English',
      },
      token,
    };
  } catch (err: any) {
    return {
      success: false,
      error: 'Google login server error. Please try again.',
    };
  }
}

export async function logoutAction(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('gt_session');
    return { success: true };
  } catch {
    return { success: true };
  }
}

export async function getSessionAction(): Promise<{ isAuthenticated: boolean; token?: string }> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('gt_session');
    return {
      isAuthenticated: Boolean(sessionCookie?.value),
      token: sessionCookie?.value,
    };
  } catch {
    return { isAuthenticated: false };
  }
}


