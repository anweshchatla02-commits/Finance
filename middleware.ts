import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const authSession = req.cookies.get('auth_session');
  const { pathname } = req.nextUrl;

  // Allow login page, API routes, static assets
  if (
    pathname.startsWith('/login') ||
    pathname.startsWith('/api/login') ||
    pathname.startsWith('/api/logout') ||
    pathname.startsWith('/_next') ||
    pathname.includes('.')
  ) {
    // If logged in and accessing /login, redirect to dashboard
    if (authSession?.value && pathname === '/login') {
      return NextResponse.redirect(new URL('/', req.url));
    }
    return NextResponse.next();
  }

  // Protect all dashboard routes
  if (!authSession?.value) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/today/:path*',
    '/customers/:path*',
    '/finances/:path*',
    '/payments/:path*',
    '/reports/:path*',
    '/audit-logs/:path*',
    '/settings/:path*',
  ],
};
