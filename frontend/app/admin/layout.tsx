'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Loader2,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { adminNavigation, isRouteActive } from '@/config/navigation';
import { AdminSidebar } from '@/components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on pathname change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Strict role verification:
  // 1. Guests redirect to /login
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

  // Active admin section
  const activeItem =
    adminNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    adminNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen flex bg-[#090a0f] text-zinc-100">
      {/* 1. Desktop Persistent Admin Sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-screen sticky top-0 z-30 border-r border-indigo-900/40">
        <AdminSidebar />
      </aside>

      {/* 2. Main Admin Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Admin Header */}
        <header className="h-16 border-b border-indigo-900/40 bg-[#0c0e16]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile drawer toggle */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              aria-label="Open admin menu"
              className="md:hidden p-2 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-indigo-300 font-bold hidden sm:inline flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-400" />
                Administrative Control Panel
              </span>
              <span className="text-zinc-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                <ActiveIcon className="w-4 h-4 text-indigo-400" />
                <span>{activeItem.name}</span>
              </div>
            </div>
          </div>

          {/* Right Header Badges */}
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/50 flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>SUPERUSER CLEARANCE</span>
            </span>

            <Link
              href="/status"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Operational</span>
            </Link>
          </div>
        </header>

        {/* Main Admin Page Content */}
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

          {/* Slideover panel */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#0c0e16] border-r border-indigo-900/50 z-10 shadow-2xl">
            <button
              onClick={() => setMobileDrawerOpen(false)}
              aria-label="Close admin menu"
              className="absolute top-4 right-4 z-20 p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
            <AdminSidebar onNavigate={() => setMobileDrawerOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
