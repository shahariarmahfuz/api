'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  LogIn,
  LogOut,
  BookOpen,
  Activity,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import {
  publicNavigation,
  userNavigation,
  adminNavigation,
  isRouteActive,
} from '@/config/navigation';
import { api } from '@/lib/api';

export function SideMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);

  // Close drawer on route navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Check backend health
  useEffect(() => {
    let mounted = true;
    api
      .checkHealth()
      .then((data) => {
        if (mounted) setSystemHealthy(data.status === 'healthy');
      })
      .catch(() => {
        if (mounted) setSystemHealthy(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push('/login');
  };

  // Determine root destination for brand logo click
  const brandHref = isAdmin ? '/admin' : isAuthenticated ? '/dashboard' : '/';

  return (
    <>
      {/* 1. MINIMAL FLOATING MENU TRIGGER BUTTON (NO TOP BAR) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label="Open Navigation Menu"
        className="fixed top-4 left-4 z-40 flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#0c0e14]/90 hover:bg-[#151926] backdrop-blur-md border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white shadow-xl shadow-black/60 transition-all cursor-pointer group"
      >
        <Menu className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
        <span className="text-xs font-semibold font-mono tracking-wide text-zinc-200">
          Menu
        </span>
      </button>

      {/* 2. OVERLAY BACKDROP */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. SIDE MENU DRAWER */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] h-full bg-[#0c0e14] border-r border-zinc-800/90 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Side Navigation"
      >
        {/* BRAND HEADER WITH EXACT 3:1 ORVIA LOGO */}
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
          <Link
            href={brandHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center"
          >
            <img
              src="/orvia-logo.png"
              alt="Orvia"
              className="h-8 w-auto aspect-[3/1] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* AUTHENTICATED USER IDENTITY CARD */}
        {isAuthenticated && user && (
          <div
            className={`p-3.5 mx-4 my-3 rounded-xl border shrink-0 ${
              isAdmin
                ? 'border-indigo-950 bg-indigo-950/20'
                : 'border-zinc-800 bg-zinc-900/40'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isAdmin
                    ? 'bg-indigo-900/80 border border-indigo-700/60 text-indigo-200'
                    : 'bg-zinc-800 border border-zinc-700/60 text-white'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                <p className="text-[10px] text-zinc-400 truncate font-mono">{user.email}</p>
              </div>
            </div>
            <div
              className={`flex items-center justify-between pt-2 border-t text-[10px] font-mono ${
                isAdmin ? 'border-indigo-900/40' : 'border-zinc-800'
              }`}
            >
              <span className="text-zinc-500">{isAdmin ? 'Privilege' : 'Access Role'}</span>
              <span
                className={`px-1.5 py-0.5 rounded uppercase font-semibold ${
                  isAdmin
                    ? 'bg-indigo-900/60 text-indigo-300 font-bold'
                    : 'bg-zinc-800 text-emerald-400'
                }`}
              >
                {isAdmin ? 'SUPERUSER' : user.role}
              </span>
            </div>
          </div>
        )}

        {/* NAVIGATION LIST (SCROLLABLE) */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {/* A. PUBLIC NAVIGATION (Unauthenticated Guests) */}
          {!isAuthenticated && (
            <>
              <div className="px-3 py-1.5">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Navigation
                </p>
              </div>
              {publicNavigation.map((item) => {
                const isActive = isRouteActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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

              {/* Guest Authentication Actions */}
              <div className="pt-4 mt-4 border-t border-zinc-800/80 px-1 space-y-2">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-mono rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-colors font-sans shadow-sm"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            </>
          )}

          {/* B. USER NAVIGATION (Authenticated Normal Users) */}
          {isAuthenticated && !isAdmin && (
            <>
              <div className="px-3 py-1.5">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400">
                  Developer Dashboard
                </p>
              </div>
              {userNavigation.map((item) => {
                const isActive = isRouteActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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

              <div className="pt-3 mt-3 border-t border-zinc-800/80">
                <Link
                  href="/docs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </Link>
                <Link
                  href="/status"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <span>Platform Status</span>
                </Link>
              </div>
            </>
          )}

          {/* C. ADMIN NAVIGATION (Authenticated Administrators) */}
          {isAuthenticated && isAdmin && (
            <>
              <div className="px-3 py-1.5">
                <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-indigo-400">
                  Administrative Control
                </p>
              </div>
              {adminNavigation.map((item) => {
                const isActive = isRouteActive(pathname, item.href, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
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

              <div className="pt-3 mt-3 border-t border-zinc-800/80">
                <Link
                  href="/docs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-zinc-400" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </Link>
                <Link
                  href="/status"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
                >
                  <Activity className="w-4 h-4 text-zinc-400" />
                  <span>Platform Status</span>
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* BOTTOM ACTIONS / STATUS */}
        <div className="p-3 border-t border-zinc-800/90 space-y-2 shrink-0 bg-[#0a0c12]">
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Operational Status indicator */}
          <div className="px-3 py-1 flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  systemHealthy === null
                    ? 'bg-zinc-500 animate-pulse'
                    : systemHealthy
                    ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50'
                    : 'bg-rose-500'
                }`}
              />
              <span>
                {systemHealthy === null
                  ? 'Connecting...'
                  : systemHealthy
                  ? 'Operational'
                  : 'Degraded'}
              </span>
            </span>
            <span className="text-zinc-400">v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
