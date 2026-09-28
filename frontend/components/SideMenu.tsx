'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
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

  // Handle ESC key to close drawer and lock body scroll when open
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

  // Check backend health for status indicator
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
      {/* 1. AMOLED BLACK APPLICATION HEADER (TRUE BLACK #000000, SUBTLE SEPARATOR) */}
      <header className="sticky top-0 z-40 w-full border-b border-white/[0.06] bg-[#000000]">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between">
          {/* LEFT: Compact Orvia Logo (Strict 2.936:1 Aspect Ratio) */}
          <Link
            href={brandHref}
            className="flex items-center transition-opacity hover:opacity-90 shrink-0"
            aria-label="Orvia Home"
          >
            <img
              src="/orvia-logo.png"
              alt="Orvia"
              className="w-[108px] sm:w-[128px] md:w-[138px] h-auto aspect-[1198/408] object-contain"
            />
          </Link>

          {/* RIGHT: Minimal, Borderless Outline Menu Trigger (No container, no border, 44x44px touch target) */}
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="w-11 h-11 flex items-center justify-center text-zinc-300 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer focus:outline-none -mr-2 shrink-0 group"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-zinc-200 transition-transform group-hover:scale-105" strokeWidth={1.5} />
            ) : (
              <svg
                className="w-5 h-5 text-zinc-200 transition-transform group-hover:scale-105"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <line x1="3.5" y1="6.5" x2="20.5" y2="6.5" />
                <line x1="3.5" y1="12" x2="20.5" y2="12" />
                <line x1="3.5" y1="17.5" x2="20.5" y2="17.5" />
              </svg>
            )}
          </button>
        </div>
      </header>

      {/* 2. OVERLAY BACKDROP OVER REST OF PAGE */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-opacity duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 3. SIDE MENU DRAWER (AMOLED BLACK #000000, EMERGES STRICTLY FROM THE LEFT) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] sm:w-[320px] max-w-[340px] h-full bg-[#000000] border-r border-white/[0.08] shadow-2xl flex flex-col transform transition-transform duration-250 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Side Navigation"
      >
        {/* DRAWER HEADER: [ COMPACT LOGO ] ... [ X ] */}
        <div className="px-4 py-3 border-b border-white/[0.06] flex items-center justify-between shrink-0 bg-[#000000]">
          <Link
            href={brandHref}
            onClick={() => setIsOpen(false)}
            className="flex items-center"
          >
            <img
              src="/orvia-logo.png"
              alt="Orvia"
              className="w-[102px] sm:w-[110px] h-auto aspect-[1198/408] object-contain"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
            className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-white bg-transparent border-none p-0 cursor-pointer focus:outline-none transition-colors"
          >
            <X className="w-4 h-4 text-zinc-300" strokeWidth={1.5} />
          </button>
        </div>

        {/* AUTHENTICATED USER IDENTITY CARD (ELEVATED SURFACE #050505, SUBTLE BORDER) */}
        {isAuthenticated && user && (
          <div
            className={`p-3 mx-3 my-2.5 rounded-lg border shrink-0 ${
              isAdmin
                ? 'border-indigo-950/60 bg-[#050505]'
                : 'border-white/[0.08] bg-[#050505]'
            }`}
          >
            <div className="flex items-center gap-2.5 mb-2">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                  isAdmin
                    ? 'bg-indigo-950/60 border border-indigo-800/40 text-indigo-300'
                    : 'bg-[#080808] border border-white/[0.1] text-zinc-200'
                }`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-zinc-100 truncate font-sans">{user.name}</p>
                <p className="text-[11px] text-zinc-400 truncate font-sans">{user.email}</p>
              </div>
            </div>
            <div
              className={`flex items-center justify-between pt-1.5 border-t text-[10px] ${
                isAdmin ? 'border-indigo-950/40' : 'border-white/[0.06]'
              }`}
            >
              <span className="text-zinc-500 font-sans">{isAdmin ? 'Privilege' : 'Access Role'}</span>
              <span
                className={`px-1.5 py-0.5 rounded font-mono uppercase font-semibold ${
                  isAdmin
                    ? 'bg-indigo-950/70 text-indigo-300 border border-indigo-900/50'
                    : 'bg-white/[0.06] text-emerald-400 border border-white/[0.08]'
                }`}
              >
                {isAdmin ? 'SUPERUSER' : user.role}
              </span>
            </div>
          </div>
        )}

        {/* NAVIGATION LIST (SCROLLABLE, REFINED AMOLED SPACING & TYPOGRAPHY) */}
        <nav className="flex-1 px-2.5 py-1.5 space-y-0.5 overflow-y-auto">
          {/* A. PUBLIC NAVIGATION (Unauthenticated Guests) */}
          {!isAuthenticated && (
            <>
              <div className="px-2.5 pt-2 pb-1">
                <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-zinc-500">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Guest Authentication Actions */}
              <div className="pt-3 mt-3 border-t border-white/[0.06] px-1 space-y-1.5">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium font-sans rounded-lg bg-[#080808] hover:bg-[#121212] border border-white/[0.08] text-zinc-200 transition-colors"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold font-sans rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black transition-colors shadow-sm"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            </>
          )}

          {/* B. USER NAVIGATION (Authenticated Normal Users) */}
          {isAuthenticated && !isAdmin && (
            <>
              <div className="px-2.5 pt-2 pb-1">
                <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-zinc-500">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors ${
                      isActive
                        ? 'bg-white/[0.08] text-white font-medium border border-white/[0.1]'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] space-y-0.5">
                <Link
                  href="/docs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </Link>
                <Link
                  href="/status"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Platform Status</span>
                </Link>
              </div>
            </>
          )}

          {/* C. ADMIN NAVIGATION (Authenticated Administrators) */}
          {isAuthenticated && isAdmin && (
            <>
              <div className="px-2.5 pt-2 pb-1">
                <p className="text-[11px] font-sans font-medium uppercase tracking-wider text-indigo-400/80">
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
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans transition-colors ${
                      isActive
                        ? 'bg-indigo-950/40 text-white font-medium border border-indigo-800/40 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              <div className="pt-2.5 mt-2.5 border-t border-white/[0.06] space-y-0.5">
                <Link
                  href="/docs"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <BookOpen className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Documentation</span>
                  <ExternalLink className="w-3 h-3 ml-auto text-zinc-500" />
                </Link>
                <Link
                  href="/status"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium font-sans text-zinc-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                >
                  <Activity className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span>Platform Status</span>
                </Link>
              </div>
            </>
          )}
        </nav>

        {/* BOTTOM ACTIONS / STATUS (AMOLED BLACK) */}
        <div className="p-2.5 border-t border-white/[0.06] space-y-1.5 shrink-0 bg-[#000000]">
          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium font-sans text-zinc-400 hover:text-rose-400 hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}

          {/* Operational Status indicator */}
          <div className="px-2.5 py-1 flex items-center justify-between text-[11px] font-sans text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
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
            <span className="text-zinc-600 font-mono text-[10px]">v1.0</span>
          </div>
        </div>
      </div>
    </>
  );
}
