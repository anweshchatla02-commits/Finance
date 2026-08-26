import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
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
