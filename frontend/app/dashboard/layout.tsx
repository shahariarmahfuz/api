'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Loader2,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { userNavigation, isRouteActive } from '@/config/navigation';
import { UserSidebar } from '@/components/UserSidebar';

export default function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Auth protection guard:
  // 1. Guests redirect to /login
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
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-500">Loading user dashboard...</p>
      </div>
    );
  }

  // If user is not yet loaded or is an administrator, do not render dashboard contents
  if (!user || isAdmin) {
    return null;
  }

  // Find active item for header breadcrumb
  const activeItem =
    userNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    userNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen flex bg-[#090a0f] text-zinc-100">
      {/* 1. Desktop Persistent User Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30 border-r border-zinc-800">
        <UserSidebar />
      </aside>

      {/* 2. Main Dashboard Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top User Dashboard Header */}
        <header className="h-16 border-b border-zinc-800 bg-[#0c0e14]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile drawer toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open dashboard menu"
              className="md:hidden p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-zinc-500 hidden sm:inline">User Dashboard</span>
              <span className="text-zinc-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                <ActiveIcon className="w-4 h-4 text-emerald-400" />
                <span>{activeItem.name}</span>
              </div>
            </div>
          </div>

          {/* Right Header Status */}
          <div className="flex items-center gap-3">
            <Link
              href="/status"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational</span>
            </Link>

            <Link
              href="/apis"
              className="text-xs text-zinc-400 hover:text-white font-mono flex items-center gap-1 px-2 py-1"
            >
              <span>API Catalog</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </header>

        {/* Main Dashboard Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* 3. Mobile Responsive Drawer */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Slideover menu */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0c0e14] border-r border-zinc-800 z-10 shadow-2xl">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close dashboard menu"
              className="absolute top-4 right-4 z-20 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
            <UserSidebar onNavigate={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
