import './globals.css';
import AuthSessionProvider from '@/components/session-provider';

export const metadata = {
  title: 'Private Finance Management System',
  description: 'Daily collection and money lending finance application for father',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 min-h-screen antialiased">
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
