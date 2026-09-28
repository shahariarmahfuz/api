'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  LayoutDashboard,
  Shield,
  Loader2,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
  BookOpen,
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
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Auth protection guard
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090a0f] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
        <p className="text-xs font-mono text-zinc-500">Loading developer session...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Find active item for header breadcrumb
  const activeItem =
    userNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    userNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen flex bg-[#090a0f] text-zinc-100">
      {/* 1. Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#0c0e14] h-screen sticky top-0 z-30">
        {/* Brand header */}
        <div className="h-16 px-6 border-b border-zinc-800 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 shadow-sm">
              <Layers className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                Orvia
              </span>
              <span className="text-[10px] text-zinc-400 font-mono block -mt-0.5">
                Developer Dashboard
              </span>
            </div>
          </Link>
        </div>

        {/* User Mini Profile Card */}
        <div className="p-4 mx-3 my-3 rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/60 flex items-center justify-center font-bold text-xs text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-[10px] font-mono">
            <span className="text-zinc-500">Access Role</span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-400 uppercase font-semibold">
              {user.role}
            </span>
          </div>
        </div>

        {/* Main Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
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
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* If authenticated user is an ADMIN, render direct entry to Admin Panel */}
          {isAdmin && (
            <div className="pt-3 mt-3 border-t border-zinc-800/80">
              <Link
                href="/admin"
                className="flex items-center justify-between p-2.5 rounded-lg border border-indigo-900/50 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 text-xs transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="font-semibold">Switch to Admin Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          )}
        </nav>

        {/* Bottom Sidebar Actions */}
        <div className="p-3 border-t border-zinc-800 space-y-1">
          <Link
            href="/docs"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Public API Docs</span>
            <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 2. Main Dashboard Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Dashboard Header */}
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
              <span className="text-zinc-500 hidden sm:inline">Developer Dashboard</span>
              <span className="text-zinc-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                <ActiveIcon className="w-4 h-4 text-emerald-400" />
                <span>{activeItem.name}</span>
              </div>
            </div>
          </div>

          {/* Right Header Badges */}
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
              <span>Explore APIs</span>
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
          <div className="relative w-72 max-w-[85vw] bg-[#0c0e14] border-r border-zinc-800 p-5 z-10 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Header with clear close button */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                    Developer Dashboard
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close dashboard menu"
                  className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User profile */}
              <div className="p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center font-bold text-xs text-white">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-zinc-800 text-[10px] font-mono">
                  <span className="text-zinc-500">Access Level</span>
                  <span className="text-emerald-400 font-semibold uppercase">{user.role}</span>
                </div>
              </div>

              {/* Nav Items */}
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

              {/* Admin Switcher if authorized */}
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

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-zinc-800/80 space-y-2">
              <Link
                href="/docs"
                onClick={() => setMobileDrawerOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Public Documentation</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-800 text-rose-300 hover:bg-rose-950/40"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
