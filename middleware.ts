import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const secret = process.env.NEXTAUTH_SECRET || 'a4f89d31b2e67c80512f4b3e8c9d1a0b5c6d7e8f90123456789abcdef0123456';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret });
  const { pathname } = req.nextUrl;

  // Allow login page, auth API routes, and static assets
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to /login
  if (!token) {
    const loginUrl = new URL('/login', req.url);
    return NextResponse.redirect(loginUrl);
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
