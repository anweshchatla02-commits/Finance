'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Landmark, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlError === 'CredentialsSignin') {
      setError('Invalid email or password. Please check your credentials.');
    } else if (urlError) {
      setError('Authentication failed. Please try again.');
    }
  }, [urlError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Use NextAuth native redirect strategy
      await signIn('credentials', {
        redirect: true,
        callbackUrl: '/',
        email: email.trim().toLowerCase(),
        password,
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-8 space-y-6">
      {/* Branding Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex bg-sky-500/10 p-3 rounded-2xl text-sky-400 border border-sky-500/20 mb-1">
          <Landmark className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Private Finance Manager</h1>
        <p className="text-sm text-slate-400">Authorized Admin Secure Access</p>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-xl text-sm flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Email / Username
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dad@finance.com"
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-800 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold py-3 rounded-xl transition-colors shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Redirecting to Dashboard...</span>
            </>
          ) : (
            <span>Sign In to Dashboard</span>
          )}
        </button>
      </form>

      <div className="text-center pt-2">
        <p className="text-xs text-slate-500">
          Protected Application. Contact administrator for credentials.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <Suspense fallback={<div className="text-white text-sm">Loading login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
