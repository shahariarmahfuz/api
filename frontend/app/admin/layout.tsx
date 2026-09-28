'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  Layers,
  Key,
  ListOrdered,
  Settings,
  ArrowLeft,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const adminNav = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'APIs Registry', href: '/admin/apis', icon: Layers },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'API Requests', href: '/admin/requests', icon: ListOrdered },
  { name: 'Platform Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, isAuthenticated, isAdmin } = useAuth();

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
        <p className="text-xs font-mono text-zinc-500">Verifying administrative credentials...</p>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Banner */}
      <div className="mb-6 p-3 rounded-xl border border-indigo-800/40 bg-indigo-950/20 flex flex-wrap items-center justify-between gap-3">
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
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Developer Dashboard</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Admin Navigation Sidebar */}
        <aside className="w-full md:w-60 shrink-0">
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

            {/* Nav list */}
            <nav className="space-y-1">
              {adminNav.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-950/60 text-white font-semibold border border-indigo-800/60'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Admin Page Content */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
