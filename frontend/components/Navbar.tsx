'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Layers,
  Menu,
  X,
  Shield,
  User,
  LogOut,
  LogIn,
  LayoutDashboard,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { publicNavigation, isRouteActive } from '@/config/navigation';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);

  // Close mobile menu whenever pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

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
    setMobileMenuOpen(false);
    await logout();
    router.push('/login');
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#090a0f]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Public Navigation Links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700/80 flex items-center justify-center text-zinc-100 group-hover:border-zinc-500 transition-colors shadow-sm shadow-zinc-950">
                <Layers className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white flex items-center gap-1.5">
                Orvia
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                  Platform
                </span>
              </span>
            </Link>

            {/* Desktop Public Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {publicNavigation.map((link) => {
                const isActive = isRouteActive(pathname, link.href, link.exact);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3.5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-zinc-800/80 border border-zinc-700/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Status & Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* System Health Indicator */}
            <Link
              href="/status"
              className="flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  systemHealthy === null
                    ? 'bg-zinc-500 animate-pulse'
                    : systemHealthy
                    ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50'
                    : 'bg-rose-500'
                }`}
              />
              <span className="text-zinc-300">
                {systemHealthy === null
                  ? 'Connecting...'
                  : systemHealthy
                  ? 'Operational'
                  : 'Degraded'}
              </span>
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                {/* User Dashboard Entry */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#0e1017] hover:border-zinc-700 transition-colors text-xs group"
                >
                  <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-200">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-zinc-200 font-medium">{user.name}</span>
                  <span
                    className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                      user.role === 'ADMIN'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    {user.role}
                  </span>
                  <ArrowRight className="w-3 h-3 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>

                {/* If user is Admin, direct link to Admin Panel */}
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-900/60 bg-indigo-950/40 hover:bg-indigo-950/70 text-indigo-300 text-xs font-medium transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Admin Panel</span>
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-1.5 rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors font-mono"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>

                <Link
                  href="/signup"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all shadow-sm font-sans"
                >
                  <span>Sign Up</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation overlay modal / drawer for Public Website */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-start">
          <div className="w-full bg-[#0d0f17] border-b border-zinc-800 p-4 shadow-2xl">
            {/* Top drawer header with clear close button */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span className="font-semibold text-white">Orvia Platform</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Public Navigation links */}
            <div className="py-4 space-y-1">
              {publicNavigation.map((link) => {
                const isActive = isRouteActive(pathname, link.href, link.exact);
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white font-semibold'
                        : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}

              {/* If authenticated, provide entry to Dashboard / Admin */}
              {isAuthenticated && (
                <div className="pt-2 mt-2 border-t border-zinc-800/80 space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-emerald-400 bg-emerald-950/20 border border-emerald-900/40"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Developer Dashboard</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-300 bg-indigo-950/30 border border-indigo-900/40"
                    >
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        <span>Admin Panel</span>
                      </div>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Auth actions */}
            <div className="pt-3 border-t border-zinc-800">
              {isAuthenticated && user ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs px-2 text-zinc-400">
                    <span className="truncate">Signed in as {user.name}</span>
                    <span className="font-mono uppercase font-bold text-zinc-300 px-1.5 py-0.5 bg-zinc-800 rounded">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-zinc-800 text-rose-300 hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 text-xs font-mono rounded-lg bg-zinc-800 text-zinc-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-center px-4 py-2.5 text-xs font-semibold rounded-lg bg-emerald-500 text-zinc-950"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Clickable bottom backdrop to dismiss */}
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}
    </nav>
  );
}
