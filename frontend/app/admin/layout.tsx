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
  LogOut,
  Layers,
  ChevronRight,
  Shield,
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
  const { user, loading, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Close drawer on pathname change
  useEffect(() => {
    setMobileDrawerOpen(false);
  }, [pathname]);

  // Strict role verification: Non-admin users are denied access
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

  if (!user || !isAdmin) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  // Active admin section
  const activeItem =
    adminNavigation.find((item) => isRouteActive(pathname, item.href, item.exact)) ||
    adminNavigation[0];

  const ActiveIcon = activeItem.icon;

  return (
    <div className="min-h-screen flex bg-[#090a0f] text-zinc-100">
      {/* 1. Desktop Persistent Admin Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-indigo-900/40 bg-[#0c0e16] h-screen sticky top-0 z-30">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-indigo-900/30 flex items-center justify-between">
          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800/60 flex items-center justify-center text-indigo-300 shadow-sm">
              <Shield className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-white block">
                Orvia
              </span>
              <span className="text-[10px] text-indigo-300 font-mono block -mt-0.5 font-bold uppercase">
                Admin Control Panel
              </span>
            </div>
          </Link>
        </div>

        {/* Admin Mini Profile */}
        <div className="p-4 mx-3 my-3 rounded-xl border border-indigo-950 bg-indigo-950/20">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-900/80 border border-indigo-700/60 flex items-center justify-center font-bold text-xs text-indigo-200">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-indigo-900/40 text-[10px] font-mono">
            <span className="text-zinc-500">Clearance</span>
            <span className="px-1.5 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-bold uppercase">
              SUPERUSER
            </span>
          </div>
        </div>

        {/* Exit to Developer Dashboard link */}
        <div className="px-3 pb-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors group"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-400 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-semibold">Exit to Developer Dashboard</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">&rarr;</span>
          </Link>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {adminNavigation.map((item) => {
            const isActive = isRouteActive(pathname, item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-950/80 text-white font-semibold border border-indigo-800/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Sidebar Actions */}
        <div className="p-3 border-t border-indigo-900/30">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
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
                Administrative Panel
              </span>
              <span className="text-zinc-600 hidden sm:inline">/</span>
              <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                <ActiveIcon className="w-4 h-4 text-indigo-400" />
                <span>{activeItem.name}</span>
              </div>
            </div>
          </div>

          {/* Right Header Badges & Actions */}
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-indigo-900/60 text-indigo-300 font-bold border border-indigo-700/50">
              Superuser
            </span>

            <Link
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:bg-zinc-800 text-xs transition-colors font-sans"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Developer Dashboard</span>
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
          <div className="relative w-72 max-w-[85vw] bg-[#0c0e16] border-r border-indigo-900/50 p-5 z-10 flex flex-col justify-between overflow-y-auto shadow-2xl">
            <div className="space-y-6">
              {/* Header with clear close button */}
              <div className="flex items-center justify-between pb-3 border-b border-indigo-900/40">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
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

              {/* Exit to Developer Dashboard */}
              <div className="pt-1">
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

              {/* Nav Items */}
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
                          ? 'bg-indigo-950/80 text-white font-semibold border border-indigo-800/60'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-indigo-900/30">
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
