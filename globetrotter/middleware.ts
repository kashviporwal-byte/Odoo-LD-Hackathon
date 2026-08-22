import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('gt_session')?.value;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = 
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/trips') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/activity-search') ||
    pathname.startsWith('/city-search');

  const isAuthRoute = pathname === '/login' || pathname === '/signup';

  // If trying to access protected route without valid session, redirect strictly to /login
  if (isProtectedRoute && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and visiting login, redirect to dashboard
  if (isAuthRoute && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/trips/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/activity-search/:path*',
    '/city-search/:path*',
    '/login',
  ],
};
