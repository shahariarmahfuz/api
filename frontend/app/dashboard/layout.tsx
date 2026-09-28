'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Shield,
  Loader2,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { userNavigation, isRouteActive } from '@/config/navigation';

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

  // Auth protection
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-500">Authenticating user session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Find active item for mobile header label
  const activeItem =
    userNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    userNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Mobile Top Context Bar (Hidden on desktop) */}
      <div className="md:hidden mb-6 p-3 rounded-xl border border-zinc-800 bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-emerald-400">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-zinc-400 block font-mono uppercase">Developer Dashboard</span>
            <span className="text-xs font-bold text-white">{activeItem.name}</span>
          </div>
        </div>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 border border-zinc-700 transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>Dashboard Menu</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Sidebar (Hidden on mobile) */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            {/* User Profile Mini Card */}
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono">
                <span className="text-zinc-500">Role</span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase font-semibold">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Navigation links - Strictly User Navigation */}
            <nav className="space-y-1">
              {userNavigation.map((item) => {
                const isActive = isRouteActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* If user is Admin, provide direct entry to Admin Panel */}
            {isAdmin && (
              <div className="pt-2">
                <Link
                  href="/admin"
                  className="flex items-center justify-between p-3 rounded-xl border border-indigo-900/50 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold">Switch to Admin Panel</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Drawer (Only appears when user opens Dashboard Menu on mobile) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Off-canvas slideover panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#0e1017] border-r border-zinc-800 p-5 z-10 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Drawer header with clear close button */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Developer Dashboard
                </span>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close dashboard menu"
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Mini Profile */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800 text-[10px] font-mono">
                  <span className="text-zinc-500">Access Level</span>
                  <span className="text-emerald-400 font-semibold uppercase">{user.role}</span>
                </div>
              </div>

              {/* Navigation list */}
              <nav className="space-y-1">
                {userNavigation.map((item) => {
                  const isActive = isRouteActive(pathname, item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-800 text-white font-semibold border border-zinc-700/60'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Switch to Admin if authorized */}
              {isAdmin && (
                <div className="pt-2 border-t border-zinc-800/80">
                  <Link
                    href="/admin"
                    onClick={() => setMobileDrawerOpen(false)}
                    className="flex items-center justify-between p-3 rounded-xl border border-indigo-900/50 bg-indigo-950/20 text-indigo-300 text-xs transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-indigo-400" />
                      <span className="font-semibold">Switch to Admin Panel</span>
                    </div>
                    <span>&rarr;</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Bottom info */}
            <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
              Orvia v1.0.0
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
