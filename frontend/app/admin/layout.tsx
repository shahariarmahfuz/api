'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  // Strict role verification:
  // 1. Unauthenticated visitors redirect to /login
  // 2. Normal users (role !== 'ADMIN') are strictly forbidden from /admin and redirect to /dashboard
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-xs font-mono text-zinc-500">Verifying administrative security clearance...</p>
      </div>
    );
  }

  // If user is not yet loaded or is not an administrator, do not render admin panel
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col">
      {/* Full screen main content - NO top bar, NO persistent sidebar */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
