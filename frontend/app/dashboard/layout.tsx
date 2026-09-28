'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

  // Strict role & auth protection guard:
  // 1. Unauthenticated visitors redirect to /login
  // 2. Administrators are strictly forbidden from /dashboard and redirect to /admin
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (isAdmin) {
        router.push('/admin');
      }
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-500">Loading user dashboard...</p>
      </div>
    );
  }

  // If user is not yet loaded or is an administrator, do not render dashboard contents
  if (!user || isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col">
      {/* Full screen main content - NO persistent sidebar */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
