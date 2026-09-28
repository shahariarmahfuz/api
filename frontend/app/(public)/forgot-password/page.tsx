'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Layers, ArrowLeft, Loader2, AlertCircle, CheckCircle2, Key } from 'lucide-react';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.forgotPassword(email.trim());
      setSubmitted(true);
      if (res.data?.reset_token) {
        setResetToken(res.data.reset_token);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img
              src="/orvia-logo.png"
              alt="Orvia"
              className="h-10 w-auto aspect-[1198/408] object-contain mx-auto"
            />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-4">
            Reset Password
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Enter your account email to receive reset instructions.
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-zinc-800 bg-[#0e1017] shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-950/40 border border-rose-800/50 flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Account Email
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Token...</span>
                  </>
                ) : (
                  <span>Send Reset Instructions</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-white">Instructions Generated</h2>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If an account with <strong className="text-zinc-200">{email}</strong> exists, a password reset token has been issued.
              </p>

              {resetToken && (
                <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#07080d] text-left space-y-2">
                  <span className="text-[11px] font-mono text-zinc-400 block">
                    Demo Environment Token:
                  </span>
                  <div className="font-mono text-xs text-emerald-400 break-all p-2 rounded bg-zinc-900 border border-zinc-800">
                    {resetToken}
                  </div>
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline font-mono pt-1"
                  >
                    <span>Click here to Reset Password &rarr;</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center text-xs">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
