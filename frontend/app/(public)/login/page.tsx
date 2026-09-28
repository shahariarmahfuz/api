'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Layers, ArrowRight, Loader2, AlertCircle, Shield, Key } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      if (user.role?.toUpperCase() === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [authLoading, isAuthenticated, user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const loggedUser = await login({ email: email.trim(), password });
      // Role-based redirection:
      // Administrators -> Admin Panel (/admin)
      // Normal users -> User Dashboard (/dashboard)
      if (loggedUser.role?.toUpperCase() === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@orvia.dev');
    setPassword('OrviaAdmin2026!');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/orvia-logo.png"
              alt="Orvia"
              className="h-10 w-auto aspect-[1198/408] object-contain mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            Welcome Back
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Log in to manage your APIs, keys, and view real-time logs.
          </p>
        </div>

        {/* Login Card */}
        <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] text-zinc-400 hover:text-emerald-400 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials shortcut */}
          <div className="mt-5 p-3 rounded-lg border border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-zinc-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Admin Demo Account</span>
            </div>
            <button
              type="button"
              onClick={fillAdminCredentials}
              className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
            >
              Fill Credentials
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center text-xs text-zinc-400">
            <span>Don't have an account? </span>
            <Link href="/signup" className="text-emerald-400 hover:underline font-medium">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
