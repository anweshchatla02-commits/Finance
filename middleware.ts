import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'a4f89d31b2e67c80512f4b3e8c9d1a0b5c6d7e8f90123456789abcdef0123456',
});

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
