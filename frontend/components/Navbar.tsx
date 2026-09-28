'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Layers, Terminal, Activity, Key, Menu, X, ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/api';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemHealthy, setSystemHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    api.checkHealth()
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

  const navLinks = [
    { name: 'APIs', href: '/apis' },
    { name: 'Documentation', href: '/docs' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Status', href: '/status' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
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

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-white bg-zinc-800/70 border border-zinc-700/50'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Status & Actions */}
          <div className="hidden md:flex items-center gap-4">
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
                {systemHealthy === null ? 'Connecting...' : systemHealthy ? 'Systems Operational' : 'Degraded'}
              </span>
            </Link>

            <Link
              href="/dashboard/api-keys"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 text-zinc-900 hover:bg-white transition-all shadow-sm font-mono"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Get API Key</span>
            </Link>
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#0d0f17] px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800"
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2 border-t border-zinc-800 mt-2">
            <Link
              href="/dashboard/api-keys"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center px-4 py-2 text-xs font-medium rounded bg-zinc-100 text-zinc-900"
            >
              Get API Key
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
