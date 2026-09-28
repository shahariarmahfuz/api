'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ArrowLeft,
  Loader2,
  Menu,
  X,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { adminNavigation, isRouteActive } from '@/config/navigation';

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

  // Strict role verification: Normal users are denied and redirected
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
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-xs font-mono text-zinc-500">Verifying administrative clearance...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  // Active admin section
  const activeItem =
    adminNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    adminNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Top Admin Banner (Desktop) */}
      <div className="hidden md:flex mb-6 p-3 rounded-xl border border-indigo-800/40 bg-indigo-950/20 items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-indigo-200">
            Administrative Control Panel
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/50">
            Superuser
          </span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Exit to Developer Dashboard</span>
        </Link>
      </div>

      {/* Top Admin Bar (Mobile) */}
      <div className="md:hidden mb-6 p-3 rounded-xl border border-indigo-900/50 bg-[#0e1017] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300">
            <ActiveIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase px-1 rounded bg-indigo-900/60 text-indigo-300 font-bold">
                SUPERUSER
              </span>
            </div>
            <span className="text-xs font-bold text-white block mt-0.5">{activeItem.name}</span>
          </div>
        </div>

        <button
          onClick={() => setMobileDrawerOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-xs text-indigo-200 border border-indigo-800/60 transition-colors"
        >
          <Menu className="w-4 h-4" />
          <span>Admin Menu</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Desktop Admin Sidebar (Hidden on mobile) */}
        <aside className="hidden md:block w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div className="p-3.5 rounded-xl border border-zinc-800 bg-[#0e1017]">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center font-bold text-xs text-indigo-300">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-zinc-400 truncate font-mono">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-[10px] font-mono">
                <span className="text-zinc-500">Security Clearance</span>
                <span className="text-emerald-400 font-semibold">Active Admin</span>
              </div>
            </div>

            {/* Navigation links - Strictly Admin Navigation */}
            <nav className="space-y-1">
              {adminNavigation.map((item) => {
                const isActive = isRouteActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-950/70 text-white font-semibold border border-indigo-700/60 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Exit to Developer Dashboard link */}
            <div className="pt-2 border-t border-zinc-800/80">
              <Link
                href="/dashboard"
                className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/60 text-zinc-300 text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
                  <span className="font-semibold">Exit to Dashboard</span>
                </div>
                <span className="text-[11px] text-zinc-500 font-mono">&rarr;</span>
              </Link>
            </div>
          </div>
        </aside>

        {/* Admin Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Mobile Drawer (Only appears when user opens Admin Menu on mobile) */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileDrawerOpen(false)}
          />

          {/* Off-canvas slideover panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#0e1017] border-r border-indigo-900/40 p-5 z-10 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Drawer header with clear close button */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Admin Panel
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close admin menu"
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Admin Mini Profile */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-indigo-950">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded bg-indigo-950 border border-indigo-800/60 flex items-center justify-center font-bold text-xs text-indigo-300">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800 text-[10px] font-mono">
                  <span className="text-zinc-500">Privilege</span>
                  <span className="text-indigo-300 font-semibold uppercase">SUPERUSER</span>
                </div>
              </div>

              {/* Navigation list */}
              <nav className="space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = isRouteActive(pathname, item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileDrawerOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-950/70 text-white font-semibold border border-indigo-800/60'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Exit to Developer Dashboard */}
              <div className="pt-2 border-t border-zinc-800/80">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4 text-zinc-400" />
                    <span className="font-semibold">Exit to Dashboard</span>
                  </div>
                  <span>&rarr;</span>
                </Link>
              </div>
            </div>

            {/* Bottom info */}
            <div className="pt-4 border-t border-zinc-800/80 text-[11px] text-zinc-500 font-mono">
              Administrative Scope
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
